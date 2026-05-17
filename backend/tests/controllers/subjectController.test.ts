import { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { subjectService } from '../../src/services/subjectService';
import { SubjectController } from '../../src/controllers/subjectController';
import { createMockResponse } from '../testUtils';

vi.mock('../../src/services/subjectService', () => ({
  subjectService: {
    getAllSubjects: vi.fn(),
    getSubjectById: vi.fn(),
    createSubject: vi.fn(),
    updateSubject: vi.fn(),
    deleteSubject: vi.fn(),
  },
}));

describe('SubjectController', () => {
  const controller = new SubjectController();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires name and image when creating a subject', async () => {
    const res = createMockResponse();

    await controller.createSubject({ body: { subject_name: 'Math' } } as Request, res);

    expect(subjectService.createSubject).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'subject_name and subject_img are required',
    });
  });

  it('trims and creates subjects', async () => {
    const subject = { _id: 'subject-1', subject_name: 'Math' };
    vi.mocked(subjectService.createSubject).mockResolvedValue(subject as any);
    const res = createMockResponse();

    await controller.createSubject({
      body: {
        subject_name: '  Math  ',
        subject_img: '  https://example.com/math.jpg  ',
      },
    } as Request, res);

    expect(subjectService.createSubject).toHaveBeenCalledWith({
      subject_name: 'Math',
      subject_img: 'https://example.com/math.jpg',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Subject created successfully',
      data: subject,
    });
  });

  it('returns a conflict for duplicate subject names', async () => {
    vi.mocked(subjectService.createSubject).mockRejectedValue({ code: 11000 });
    const res = createMockResponse();

    await controller.createSubject({
      body: {
        subject_name: 'Math',
        subject_img: 'https://example.com/math.jpg',
      },
    } as Request, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Subject with this name already exists',
    });
  });
});
