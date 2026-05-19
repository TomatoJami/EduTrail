import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { CourseService, CoursePayload } from '../../src/services/courseService';
import { Course } from '../../src/models/Course';
import { Module } from '../../src/models/Module';
import { Chapter } from '../../src/models/Chapter';
import { Question } from '../../src/models/Question';
import { TestQuestion } from '../../src/models/TestQuestion';
import { ShortAnswerQuestion } from '../../src/models/ShortAnswerQuestion';
import { FillInTheBlankQuestion } from '../../src/models/FillInTheBlankQuestion';
import { ChapterProgress } from '../../src/models/ChapterProgress';
import { QuestionProgress } from '../../src/models/QuestionProgress';
import { CourseProgress } from '../../src/models/CourseProgress';
import * as storageCleanupService from '../../src/services/storageCleanupService';

vi.mock('../../src/models/Course');
vi.mock('../../src/models/Module');
vi.mock('../../src/models/Chapter');
vi.mock('../../src/models/Question');
vi.mock('../../src/models/TestQuestion');
vi.mock('../../src/models/ShortAnswerQuestion');
vi.mock('../../src/models/FillInTheBlankQuestion');
vi.mock('../../src/models/ChapterProgress');
vi.mock('../../src/models/QuestionProgress');
vi.mock('../../src/models/CourseProgress');
vi.mock('../../src/services/storageCleanupService');

describe('CourseService', () => {
  let courseService: CourseService;

  beforeEach(() => {
    vi.clearAllMocks();
    courseService = new CourseService();
  });

  describe('getAllCourses', () => {
    it('should return all courses sorted by creation date', async () => {
      const mockCourses = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Course 1',
          description: 'Desc 1',
          ageGroup: '10-12' as const,
          goals: ['goal 1'],
          course_img: 'img1.jpg',
          subject_id: new mongoose.Types.ObjectId(),
        },
      ];

      vi.mocked(Course.find).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockCourses),
        }),
      } as any);

      const result = await courseService.getAllCourses();

      expect(result).toEqual(mockCourses);
      expect(Course.find).toHaveBeenCalled();
    });

    it('should return empty array when no courses exist', async () => {
      vi.mocked(Course.find).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await courseService.getAllCourses();

      expect(result).toEqual([]);
    });
  });

  describe('createCourse', () => {
    it('should create a new course successfully', async () => {
      const payload: CoursePayload = {
        title: 'New Course',
        description: 'New Description',
        goals: ['goal1', 'goal2'],
        ageGroup: '4-9',
        course_img: 'new.jpg',
        subject_id: new mongoose.Types.ObjectId().toString(),
      };

      const mockCourse = {
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue({ _id: 'course-1', ...payload }),
      };

      vi.mocked(Course).mockImplementation(function () { return mockCourse as any; });

      const result = await courseService.createCourse(payload);

      expect(mockCourse.save).toHaveBeenCalled();
      expect(mockCourse.populate).toHaveBeenCalledWith('subject_id');
    });

    it('should throw error for invalid subject_id', async () => {
      const payload: CoursePayload = {
        title: 'New Course',
        description: 'New Description',
        goals: [],
        ageGroup: '1-3',
        course_img: 'new.jpg',
        subject_id: 'invalid-id',
      };

      await expect(courseService.createCourse(payload)).rejects.toThrow();
    });
  });

  describe('updateCourse', () => {
    it('should update an existing course', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const payload: Partial<CoursePayload> = { title: 'Updated Title' };

      const mockCourse = { _id: courseId, course_img: 'old.jpg' };

      vi.mocked(Course.findById).mockResolvedValue(mockCourse as any);
      vi.mocked(Course.findByIdAndUpdate).mockReturnValue({
        populate: vi.fn().mockResolvedValue({ ...mockCourse, ...payload }),
      } as any);

      const result = await courseService.updateCourse(courseId, payload);

      expect(Course.findById).toHaveBeenCalledWith(courseId);
      expect(Course.findByIdAndUpdate).toHaveBeenCalledWith(
        courseId,
        expect.any(Object),
        expect.objectContaining({ returnDocument: 'after' })
      );
    });

    it('should throw error for invalid course id', async () => {
      const payload: Partial<CoursePayload> = { title: 'Updated' };

      await expect(courseService.updateCourse('invalid-id', payload)).rejects.toThrow(
        'Invalid course id'
      );
    });

    it('should return null when course not found', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      vi.mocked(Course.findById).mockResolvedValue(null);

      const result = await courseService.updateCourse(courseId, { title: 'Updated' });

      expect(result).toBeNull();
    });

    it('should clean up old image when course_img is updated', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const oldImage = 'old.jpg';
      const newImage = 'new.jpg';

      const mockCourse = { _id: courseId, course_img: oldImage };
      vi.mocked(Course.findById).mockResolvedValue(mockCourse as any);
      vi.mocked(Course.findByIdAndUpdate).mockReturnValue({
        populate: vi.fn().mockResolvedValue({ ...mockCourse, course_img: newImage }),
      } as any);

      await courseService.updateCourse(courseId, { course_img: newImage });

      expect(storageCleanupService.deleteRemovedSupabaseImages).toHaveBeenCalledWith(
        oldImage,
        newImage
      );
    });
  });

  describe('deleteCourse', () => {
    it('should delete a course and all related data', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockCourse = {
        _id: courseId,
        course_img: 'course.jpg',
        subject_id: new mongoose.Types.ObjectId(),
      };

      vi.mocked(Course.findById).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCourse),
      } as any);
      vi.mocked(Module.find).mockReturnValue({
        select: vi.fn().mockResolvedValue([]),
      } as any);
      vi.mocked(Course.findByIdAndDelete).mockResolvedValue(mockCourse as any);
      vi.mocked(CourseProgress.deleteMany).mockResolvedValue({} as any);

      const result = await courseService.deleteCourse(courseId);

      expect(Course.findByIdAndDelete).toHaveBeenCalledWith(new mongoose.Types.ObjectId(courseId));
      expect(result).toEqual(mockCourse);
    });

    it('should throw error for invalid course id', async () => {
      await expect(courseService.deleteCourse('invalid-id')).rejects.toThrow(
        'Invalid course id'
      );
    });

    it('should return null when course not found', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      vi.mocked(Course.findById).mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      } as any);

      const result = await courseService.deleteCourse(courseId);

      expect(result).toBeNull();
    });
  });

  describe('getCourseById', () => {
    it('should retrieve a course by id', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockCourse = { _id: courseId, title: 'Test Course' };

      vi.mocked(Course.findById).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCourse),
      } as any);

      const result = await courseService.getCourseById(courseId);

      expect(Course.findById).toHaveBeenCalledWith(courseId);
      expect(result).toEqual(mockCourse);
    });

    it('should throw error for invalid course id', async () => {
      await expect(courseService.getCourseById('invalid-id')).rejects.toThrow(
        'Invalid course id'
      );
    });

    it('should return null when course not found', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      vi.mocked(Course.findById).mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      } as any);

      const result = await courseService.getCourseById(courseId);

      expect(result).toBeNull();
    });
  });
});
