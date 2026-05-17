import { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COURSE_TEXT_LIMIT } from '../../src/models/Course';
import { courseService } from '../../src/services/courseService';
import { createMockResponse } from '../testUtils';
import { CourseController } from '../../src/controllers/courseController';

vi.mock('../../src/services/courseService', () => ({
  courseService: {
    getAllCourses: vi.fn(),
    getCourseById: vi.fn(),
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
    deleteCourse: vi.fn(),
  },
}));

describe('CourseController', () => {
  const controller = new CourseController();
  const subjectId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires all fields when creating a course', async () => {
    const res = createMockResponse();

    await controller.createCourse({ body: {} } as Request, res);

    expect(courseService.createCourse).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'title, description, ageGroup, course_img and subject_id are required',
    });
  });

  it('rejects invalid age groups', async () => {
    const res = createMockResponse();

    await controller.createCourse({
      body: {
        title: 'Course',
        description: 'Description',
        ageGroup: '13-18',
        course_img: 'https://example.com/image.jpg',
        subject_id: subjectId,
      },
    } as Request, res);

    expect(courseService.createCourse).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid ageGroup value',
    });
  });

  it('rejects invalid subject ids', async () => {
    const res = createMockResponse();

    await controller.createCourse({
      body: {
        title: 'Course',
        description: 'Description',
        ageGroup: '10-12',
        course_img: 'https://example.com/image.jpg',
        subject_id: 'not-an-id',
      },
    } as Request, res);

    expect(courseService.createCourse).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid subject_id',
    });
  });

  it('rejects course text that exceeds the model limit', async () => {
    const res = createMockResponse();

    await controller.createCourse({
      body: {
        title: 'A'.repeat(COURSE_TEXT_LIMIT + 1),
        description: 'Description',
        ageGroup: '10-12',
        course_img: 'https://example.com/image.jpg',
        subject_id: subjectId,
      },
    } as Request, res);

    expect(courseService.createCourse).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: `title cannot exceed ${COURSE_TEXT_LIMIT} characters`,
    });
  });

  it('normalizes and creates valid courses', async () => {
    const course = { _id: 'course-1', title: 'Course' };
    vi.mocked(courseService.createCourse).mockResolvedValue(course as any);
    const res = createMockResponse();

    await controller.createCourse({
      body: {
        title: '  Course  ',
        description: '  Description  ',
        goals: ['  Learn  ', '', 123],
        ageGroup: '10-12',
        course_img: '  https://example.com/image.jpg  ',
        subject_id: subjectId,
      },
    } as Request, res);

    expect(courseService.createCourse).toHaveBeenCalledWith({
      title: 'Course',
      description: 'Description',
      goals: ['Learn'],
      ageGroup: '10-12',
      course_img: 'https://example.com/image.jpg',
      subject_id: subjectId,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  });

  it('returns 404 when updating a missing course', async () => {
    vi.mocked(courseService.updateCourse).mockResolvedValue(null);
    const res = createMockResponse();

    await controller.updateCourse({
      params: { id: 'course-1' },
      body: { title: 'Updated' },
    } as unknown as Request, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Course not found',
    });
  });
});
