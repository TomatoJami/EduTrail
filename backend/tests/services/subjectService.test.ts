import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { SubjectService, SubjectPayload } from '../../src/services/subjectService';
import { Subject } from '../../src/models/Subject';
import { Course } from '../../src/models/Course';
import * as storageCleanupService from '../../src/services/storageCleanupService';
import { Module } from '../../src/models/Module';
import { Chapter } from '../../src/models/Chapter';
import { Question } from '../../src/models/Question';
import { TestQuestion } from '../../src/models/TestQuestion';
import { ShortAnswerQuestion } from '../../src/models/ShortAnswerQuestion';
import { FillInTheBlankQuestion } from '../../src/models/FillInTheBlankQuestion';
import { ChapterProgress } from '../../src/models/ChapterProgress';
import { QuestionProgress } from '../../src/models/QuestionProgress';
import { CourseProgress } from '../../src/models/CourseProgress';

vi.mock('../../src/models/Subject');
vi.mock('../../src/models/Course');
vi.mock('../../src/services/storageCleanupService');
vi.mock('../../src/models/Module');
vi.mock('../../src/models/Chapter');
vi.mock('../../src/models/Question');
vi.mock('../../src/models/TestQuestion');
vi.mock('../../src/models/ShortAnswerQuestion');
vi.mock('../../src/models/FillInTheBlankQuestion');
vi.mock('../../src/models/ChapterProgress');
vi.mock('../../src/models/QuestionProgress');
vi.mock('../../src/models/CourseProgress');

const mockMongooseSession = () => {
  const session = {
    withTransaction: vi.fn(async (callback: () => Promise<void>) => callback()),
    endSession: vi.fn(),
  };

  vi.spyOn(mongoose, 'startSession').mockResolvedValue(session as any);
  return session;
};

const sessionQuery = <T,>(value: T) => ({
  session: vi.fn().mockResolvedValue(value),
});

const selectQuery = <T,>(value: T) => ({
  select: vi.fn().mockResolvedValue(value),
});

const selectSessionQuery = <T,>(value: T) => ({
  select: vi.fn().mockReturnValue(sessionQuery(value)),
});

const mockSubjectDeleteDependencies = (deletedSubject: unknown) => {
  vi.mocked(Module.find).mockReturnValue(selectSessionQuery([]) as any);
  vi.mocked(Chapter.find).mockReturnValue(selectSessionQuery([]) as any);
  vi.mocked(Question.find).mockReturnValue(selectSessionQuery([]) as any);
  vi.mocked(TestQuestion.find).mockReturnValue(selectSessionQuery([]) as any);
  vi.mocked(ShortAnswerQuestion.find).mockReturnValue(selectSessionQuery([]) as any);
  vi.mocked(FillInTheBlankQuestion.find).mockReturnValue(selectSessionQuery([]) as any);
  vi.mocked(ChapterProgress.deleteMany).mockReturnValue(sessionQuery({}) as any);
  vi.mocked(QuestionProgress.deleteMany).mockReturnValue(sessionQuery({}) as any);
  vi.mocked(TestQuestion.deleteMany).mockReturnValue(sessionQuery({}) as any);
  vi.mocked(ShortAnswerQuestion.deleteMany).mockReturnValue(sessionQuery({}) as any);
  vi.mocked(FillInTheBlankQuestion.deleteMany).mockReturnValue(sessionQuery({}) as any);
  vi.mocked(Question.deleteMany).mockReturnValue(sessionQuery({}) as any);
  vi.mocked(Chapter.deleteMany).mockReturnValue(sessionQuery({}) as any);
  vi.mocked(Module.deleteMany).mockReturnValue(sessionQuery({}) as any);
  vi.mocked(CourseProgress.deleteMany).mockReturnValue(sessionQuery({}) as any);
  vi.mocked(Course.deleteMany).mockReturnValue(sessionQuery({}) as any);
  vi.mocked(Subject.findByIdAndDelete).mockReturnValue(sessionQuery(deletedSubject) as any);
};

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
        returnDocument: 'after',
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
      mockMongooseSession();
      const subjectId = new mongoose.Types.ObjectId().toString();
      const mockSubject = { _id: subjectId, subject_name: 'Math', subject_img: 'math.jpg' };

      vi.mocked(Subject.findById).mockResolvedValue(mockSubject as any);
      vi.mocked(Course.find).mockReturnValue(selectQuery([
          { _id: 'course-1' },
          { _id: 'course-2' },
        ]) as any);
      mockSubjectDeleteDependencies(mockSubject);

      const result = await subjectService.deleteSubject(subjectId);

      expect(Course.find).toHaveBeenCalledWith({
        subject_id: new mongoose.Types.ObjectId(subjectId),
      });
      expect(Course.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['course-1', 'course-2'] } });
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
      mockMongooseSession();
      const subjectId = new mongoose.Types.ObjectId().toString();
      const mockSubject = { _id: subjectId, subject_name: 'Math', subject_img: 'math.jpg' };

      vi.mocked(Subject.findById).mockResolvedValue(mockSubject as any);
      vi.mocked(Course.find).mockReturnValue(selectQuery([]) as any);
      mockSubjectDeleteDependencies(mockSubject);

      await subjectService.deleteSubject(subjectId);

      expect(storageCleanupService.deleteSupabaseImages).toHaveBeenCalledWith('math.jpg');
    });

    it('should cleanup related course and chapter images on delete', async () => {
      mockMongooseSession();
      const subjectId = new mongoose.Types.ObjectId().toString();
      const moduleId = new mongoose.Types.ObjectId();
      const mockSubject = {
        _id: subjectId,
        subject_name: 'Math',
        subject_img: 'https://example.supabase.co/storage/v1/object/public/images/subjects/math.jpg',
      };
      const courseImg = 'https://example.supabase.co/storage/v1/object/public/images/courses/algebra.jpg';
      const chapterContent =
        'Intro ![diagram](https://example.supabase.co/storage/v1/object/public/images/chapters/diagram.jpg)';

      vi.mocked(Subject.findById).mockResolvedValue(mockSubject as any);
      vi.mocked(Course.find).mockReturnValue(selectQuery([
        { _id: 'course-1', course_img: courseImg },
      ]) as any);
      mockSubjectDeleteDependencies(mockSubject);
      vi.mocked(Module.find).mockReturnValue(selectSessionQuery([{ _id: moduleId }]) as any);
      vi.mocked(Chapter.find).mockReturnValue(selectSessionQuery([
        { _id: new mongoose.Types.ObjectId(), content: chapterContent },
      ]) as any);
      vi.mocked(Question.find).mockReturnValue(selectSessionQuery([]) as any);

      await subjectService.deleteSubject(subjectId);

      expect(storageCleanupService.deleteSupabaseImages).toHaveBeenCalledWith(
        mockSubject.subject_img,
        courseImg,
        chapterContent
      );
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
