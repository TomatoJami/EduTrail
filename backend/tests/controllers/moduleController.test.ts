import { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleController } from '../../src/controllers/moduleController';
import { moduleService } from '../../src/services/moduleService';
import { createMockResponse } from '../testUtils';

vi.mock('../../src/services/moduleService', () => ({
  moduleService: {
    getAllModules: vi.fn(),
    getModulesByCourseId: vi.fn(),
    getModuleById: vi.fn(),
    createModule: vi.fn(),
    updateModule: vi.fn(),
    deleteModule: vi.fn(),
  },
}));

describe('ModuleController', () => {
  const controller = new ModuleController();
  const courseId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters modules by course_id when provided', async () => {
    const modules = [{ _id: 'module-1' }];
    vi.mocked(moduleService.getModulesByCourseId).mockResolvedValue(modules as any);
    const res = createMockResponse();

    await controller.getAllModules({ query: { course_id: courseId } } as unknown as Request, res);

    expect(moduleService.getModulesByCourseId).toHaveBeenCalledWith(courseId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Modules fetched successfully',
      data: modules,
    });
  });

  it('rejects invalid course ids when creating modules', async () => {
    const res = createMockResponse();

    await controller.createModule({
      body: { title: 'Intro', course_id: 'bad-id' },
    } as Request, res);

    expect(moduleService.createModule).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid course_id',
    });
  });

  it('trims and creates valid modules', async () => {
    const module = { _id: 'module-1', title: 'Intro' };
    vi.mocked(moduleService.createModule).mockResolvedValue(module as any);
    const res = createMockResponse();

    await controller.createModule({
      body: { title: '  Intro  ', order: 1, course_id: courseId },
    } as Request, res);

    expect(moduleService.createModule).toHaveBeenCalledWith({
      title: 'Intro',
      order: 1,
      course_id: courseId,
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
