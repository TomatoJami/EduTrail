import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { ModuleService, ModulePayload } from '../../src/services/moduleService';
import { Module } from '../../src/models/Module';

vi.mock('../../src/models/Module');

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

const sessionPopulateQuery = <T,>(value: T) => ({
  session: vi.fn().mockReturnValue({
    populate: vi.fn().mockResolvedValue(value),
  }),
});

describe('ModuleService', () => {
  let moduleService: ModuleService;

  beforeEach(() => {
    vi.clearAllMocks();
    moduleService = new ModuleService();
  });

  describe('getAllModules', () => {
    it('should return all modules sorted by order', async () => {
      const mockModules = [
        { _id: 'module-1', title: 'Module 1', order: 1, course_id: 'course-1' },
        { _id: 'module-2', title: 'Module 2', order: 2, course_id: 'course-1' },
      ];

      vi.mocked(Module.find).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockModules),
        }),
      } as any);

      const result = await moduleService.getAllModules();

      expect(result).toEqual(mockModules);
      expect(Module.find).toHaveBeenCalled();
    });

    it('should return empty array when no modules exist', async () => {
      vi.mocked(Module.find).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await moduleService.getAllModules();

      expect(result).toEqual([]);
    });
  });

  describe('getModulesByCourseId', () => {
    it('should return modules for a specific course', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockModules = [
        { _id: 'module-1', title: 'Module 1', order: 1, course_id: courseId },
      ];

      vi.mocked(Module.find).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockModules),
        }),
      } as any);

      const result = await moduleService.getModulesByCourseId(courseId);

      expect(result).toEqual(mockModules);
      expect(Module.find).toHaveBeenCalledWith({ course_id: courseId });
    });

    it('should throw error for invalid course id', async () => {
      await expect(moduleService.getModulesByCourseId('invalid-id')).rejects.toThrow(
        'Invalid course id'
      );
    });

    it('should return empty array when no modules exist for course', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();

      vi.mocked(Module.find).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await moduleService.getModulesByCourseId(courseId);

      expect(result).toEqual([]);
    });
  });

  describe('createModule', () => {
    it('should create a new module with auto-incremented order', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const payload: ModulePayload = {
        title: 'New Module',
        course_id: courseId,
      };

      const mockModule = {
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue({ ...payload, order: 1 }),
      };

      vi.mocked(Module.findOne).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null),
        }),
      } as any);

      vi.mocked(Module).mockImplementation(function () { return mockModule as any; });

      await moduleService.createModule(payload);

      expect(mockModule.save).toHaveBeenCalled();
    });

    it('should create a module with specified order', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const payload: ModulePayload = {
        title: 'Module with Order',
        order: 5,
        course_id: courseId,
      };

      const mockModule = {
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(payload),
      };

      vi.mocked(Module).mockImplementation(function () { return mockModule as any; });

      await moduleService.createModule(payload);

      expect(mockModule.save).toHaveBeenCalled();
    });

    it('should set order to 1 when no existing modules', async () => {
      const courseId = new mongoose.Types.ObjectId().toString();
      const payload: ModulePayload = {
        title: 'First Module',
        course_id: courseId,
      };

      const mockModule = {
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue({ ...payload, order: 1 }),
      };

      vi.mocked(Module.findOne).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null),
        }),
      } as any);

      vi.mocked(Module).mockImplementation(function () { return mockModule as any; });

      await moduleService.createModule(payload);

      expect(mockModule.save).toHaveBeenCalled();
    });
  });

  describe('updateModule', () => {
    it('should update an existing module', async () => {
      const moduleId = new mongoose.Types.ObjectId().toString();
      const payload: Partial<ModulePayload> = { title: 'Updated Module' };

      vi.mocked(Module.findByIdAndUpdate).mockReturnValue({
        populate: vi.fn().mockResolvedValue({ _id: moduleId, ...payload }),
      } as any);

      const result = await moduleService.updateModule(moduleId, payload);

      expect(Module.findByIdAndUpdate).toHaveBeenCalledWith(moduleId, payload, {
        new: true,
        runValidators: true,
      });
    });

    it('should throw error for invalid module id', async () => {
      const payload: Partial<ModulePayload> = { title: 'Updated' };

      await expect(moduleService.updateModule('invalid-id', payload)).rejects.toThrow(
        'Invalid module id'
      );
    });

    it('should validate and convert course_id', async () => {
      const moduleId = new mongoose.Types.ObjectId().toString();
      const courseId = new mongoose.Types.ObjectId().toString();
      const payload: Partial<ModulePayload> = { course_id: courseId };

      vi.mocked(Module.findByIdAndUpdate).mockReturnValue({
        populate: vi.fn().mockResolvedValue({ _id: moduleId, course_id: courseId }),
      } as any);

      await moduleService.updateModule(moduleId, payload);

      expect(Module.findByIdAndUpdate).toHaveBeenCalledWith(
        moduleId,
        expect.objectContaining({
          course_id: expect.any(mongoose.Types.ObjectId),
        }),
        expect.any(Object)
      );
    });
  });

  describe('deleteModule', () => {
    it('should delete a module and reorder remaining modules', async () => {
      mockMongooseSession();
      const moduleId = new mongoose.Types.ObjectId().toString();
      const courseId = new mongoose.Types.ObjectId().toString();
      const mockModule = {
        _id: moduleId,
        title: 'Module to Delete',
        order: 2,
        course_id: courseId,
      };

      vi.mocked(Module.findById).mockReturnValue(sessionQuery(mockModule) as any);
      vi.mocked(Module.findByIdAndDelete).mockReturnValue(sessionPopulateQuery(mockModule) as any);
      vi.mocked(Module.updateMany).mockReturnValue(sessionQuery({}) as any);

      const result = await moduleService.deleteModule(moduleId);

      expect(Module.findByIdAndDelete).toHaveBeenCalledWith(new mongoose.Types.ObjectId(moduleId));
      expect(Module.updateMany).toHaveBeenCalledWith(
        {
          course_id: courseId,
          order: { $gt: 2 },
        },
        { $inc: { order: -1 } }
      );
      expect(result).toEqual(mockModule);
    });

    it('should throw error for invalid module id', async () => {
      await expect(moduleService.deleteModule('invalid-id')).rejects.toThrow(
        'Invalid module id'
      );
    });

    it('should return null when module not found', async () => {
      mockMongooseSession();
      const moduleId = new mongoose.Types.ObjectId().toString();
      vi.mocked(Module.findById).mockReturnValue(sessionQuery(null) as any);

      const result = await moduleService.deleteModule(moduleId);

      expect(result).toBeNull();
    });
  });

  describe('getModuleById', () => {
    it('should retrieve a module by id', async () => {
      const moduleId = new mongoose.Types.ObjectId().toString();
      const mockModule = { _id: moduleId, title: 'Test Module', order: 1 };

      vi.mocked(Module.findById).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockModule),
      } as any);

      const result = await moduleService.getModuleById(moduleId);

      expect(Module.findById).toHaveBeenCalledWith(moduleId);
      expect(result).toEqual(mockModule);
    });

    it('should throw error for invalid module id', async () => {
      await expect(moduleService.getModuleById('invalid-id')).rejects.toThrow(
        'Invalid module id'
      );
    });

    it('should return null when module not found', async () => {
      const moduleId = new mongoose.Types.ObjectId().toString();

      vi.mocked(Module.findById).mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      } as any);

      const result = await moduleService.getModuleById(moduleId);

      expect(result).toBeNull();
    });
  });
});
