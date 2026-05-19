import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { SubjectService, SubjectPayload } from '../../src/services/subjectService';
import { Subject } from '../../src/models/Subject';
import { Course } from '../../src/models/Course';
import { courseService } from '../../src/services/courseService';
import * as storageCleanupService from '../../src/services/storageCleanupService';

vi.mock('../../src/models/Subject');
vi.mock('../../src/models/Course');
vi.mock('../../src/services/courseService');
vi.mock('../../src/services/storageCleanupService');

describe('SubjectService', () => {
  let subjectService: SubjectService;

  beforeEach(() => {
    vi.clearAllMocks();
    subjectService = new SubjectService();
  });

  describe('getAllSubjects', () => {
    it('should return all subjects sorted by creation date', async () => {
      const mockSubjects = [
        { _id: 'subject-1', subject_name: 'Math', subject_img: 'math.jpg' },
        { _id: 'subject-2', subject_name: 'Science', subject_img: 'science.jpg' },
      ];

      vi.mocked(Subject.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockSubjects),
      } as any);

      const result = await subjectService.getAllSubjects();

      expect(result).toEqual(mockSubjects);
      expect(Subject.find).toHaveBeenCalled();
    });

    it('should return empty array when no subjects exist', async () => {
      vi.mocked(Subject.find).mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await subjectService.getAllSubjects();

      expect(result).toEqual([]);
    });
  });

  describe('createSubject', () => {
    it('should create a new subject', async () => {
      const payload: SubjectPayload = {
        subject_name: 'History',
        subject_img: 'history.jpg',
      };

      const mockSubject = {
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Subject).mockImplementation(function () { return mockSubject as any; });

      await subjectService.createSubject(payload);

      expect(mockSubject.save).toHaveBeenCalled();
    });

    it('should throw error for duplicate subject name', async () => {
      const payload: SubjectPayload = {
        subject_name: 'Math',
        subject_img: 'math.jpg',
      };

      const mockSubject = {
        save: vi.fn().mockRejectedValue(new Error('Duplicate key')),
      };

      vi.mocked(Subject).mockImplementation(function () { return mockSubject as any; });

      await expect(subjectService.createSubject(payload)).rejects.toThrow();
    });
  });

  describe('updateSubject', () => {
    it('should update an existing subject', async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      const payload: Partial<SubjectPayload> = { subject_name: 'Updated History' };

      const mockSubject = { _id: subjectId, subject_name: 'History', subject_img: 'old.jpg' };

      vi.mocked(Subject.findById).mockResolvedValue(mockSubject as any);
      vi.mocked(Subject.findByIdAndUpdate).mockResolvedValue({
        ...mockSubject,
        ...payload,
      } as any);

      const result = await subjectService.updateSubject(subjectId, payload);

      expect(Subject.findByIdAndUpdate).toHaveBeenCalledWith(subjectId, payload, {
        new: true,
        runValidators: true,
      });
    });

    it('should throw error for invalid subject id', async () => {
      const payload: Partial<SubjectPayload> = { subject_name: 'Updated' };

      await expect(subjectService.updateSubject('invalid-id', payload)).rejects.toThrow(
        'Invalid subject id'
      );
    });

    it('should return null when subject not found', async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      vi.mocked(Subject.findById).mockResolvedValue(null);

      const result = await subjectService.updateSubject(subjectId, { subject_name: 'Updated' });

      expect(result).toBeNull();
    });

    it('should clean up old image when subject_img is updated', async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      const oldImage = 'old.jpg';
      const newImage = 'new.jpg';

      const mockSubject = { _id: subjectId, subject_name: 'Math', subject_img: oldImage };

      vi.mocked(Subject.findById).mockResolvedValue(mockSubject as any);
      vi.mocked(Subject.findByIdAndUpdate).mockResolvedValue({
        ...mockSubject,
        subject_img: newImage,
      } as any);

      await subjectService.updateSubject(subjectId, { subject_img: newImage });

      expect(storageCleanupService.deleteRemovedSupabaseImages).toHaveBeenCalledWith(
        oldImage,
        newImage
      );
    });
  });

  describe('deleteSubject', () => {
    it('should delete a subject and all related courses', async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      const mockSubject = { _id: subjectId, subject_name: 'Math', subject_img: 'math.jpg' };

      vi.mocked(Subject.findById).mockResolvedValue(mockSubject as any);
      vi.mocked(Course.find).mockReturnValue({
        select: vi.fn().mockResolvedValue([
          { _id: 'course-1' },
          { _id: 'course-2' },
        ]),
      } as any);
      vi.mocked(Subject.findByIdAndDelete).mockResolvedValue(mockSubject as any);

      const result = await subjectService.deleteSubject(subjectId);

      expect(Course.find).toHaveBeenCalledWith({
        subject_id: new mongoose.Types.ObjectId(subjectId),
      });
      expect(courseService.deleteCourse).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockSubject);
    });

    it('should throw error for invalid subject id', async () => {
      await expect(subjectService.deleteSubject('invalid-id')).rejects.toThrow(
        'Invalid subject id'
      );
    });

    it('should return null when subject not found', async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      vi.mocked(Subject.findById).mockResolvedValue(null);

      const result = await subjectService.deleteSubject(subjectId);

      expect(result).toBeNull();
    });

    it('should cleanup subject image on delete', async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      const mockSubject = { _id: subjectId, subject_name: 'Math', subject_img: 'math.jpg' };

      vi.mocked(Subject.findById).mockResolvedValue(mockSubject as any);
      vi.mocked(Course.find).mockReturnValue({
        select: vi.fn().mockResolvedValue([]),
      } as any);
      vi.mocked(Subject.findByIdAndDelete).mockResolvedValue(mockSubject as any);

      await subjectService.deleteSubject(subjectId);

      expect(storageCleanupService.deleteSupabaseImages).toHaveBeenCalledWith('math.jpg');
    });
  });

  describe('getSubjectById', () => {
    it('should retrieve a subject by id', async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      const mockSubject = { _id: subjectId, subject_name: 'Math', subject_img: 'math.jpg' };

      vi.mocked(Subject.findById).mockResolvedValue(mockSubject as any);

      const result = await subjectService.getSubjectById(subjectId);

      expect(Subject.findById).toHaveBeenCalledWith(subjectId);
      expect(result).toEqual(mockSubject);
    });

    it('should throw error for invalid subject id', async () => {
      await expect(subjectService.getSubjectById('invalid-id')).rejects.toThrow(
        'Invalid subject id'
      );
    });

    it('should return null when subject not found', async () => {
      const subjectId = new mongoose.Types.ObjectId().toString();
      vi.mocked(Subject.findById).mockResolvedValue(null);

      const result = await subjectService.getSubjectById(subjectId);

      expect(result).toBeNull();
    });
  });
});
