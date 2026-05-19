import mongoose from 'mongoose';
import { Module, IModule } from '../models/Module';

/** Defines the TypeScript shape for module payload. */
export interface ModulePayload {
  title: string;
  order?: number;
  course_id: string;
}

// Owns module persistence and cascading deletes for nested learning content.
export class ModuleService {
  /** Handles the get all modules request flow. */
  async getAllModules(): Promise<IModule[]> {
    // Reads every module when no course filter is supplied.
    return Module.find().populate('course_id').sort({ order: 1 });
  }

  /** Handles the get modules by course id request flow. */
  async getModulesByCourseId(courseId: string): Promise<IModule[]> {
    // Reads modules for one course in learning order.
    if (!mongoose.isValidObjectId(courseId)) {
      throw new Error('Invalid course id');
    }
    return Module.find({ course_id: courseId }).populate('course_id').sort({ order: 1 });
  }

  /** Handles the create module request flow. */
  async createModule(payload: ModulePayload): Promise<IModule> {
    const courseId = new mongoose.Types.ObjectId(payload.course_id);
    
    let order = payload.order;
    if (order === undefined) {
      const maxOrderModule = await Module.findOne({ course_id: courseId })
        .sort({ order: -1 })
        .lean();
      
      order = (maxOrderModule?.order || 0) + 1;
    }

    const module = new Module({
      ...payload,
      order,
      course_id: courseId,
    });

    await module.save();
    return module.populate('course_id');
  }

  /** Handles the update module request flow. */
  async updateModule(id: string, payload: Partial<ModulePayload>): Promise<IModule | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid module id');
    }

    const nextPayload: Record<string, unknown> = { ...payload };

    if (payload.course_id) {
      if (!mongoose.isValidObjectId(payload.course_id)) {
        throw new Error('Invalid course id');
      }
      nextPayload.course_id = new mongoose.Types.ObjectId(payload.course_id);
    }

    return Module.findByIdAndUpdate(id, nextPayload, {
      returnDocument: 'after',
      runValidators: true,
    }).populate('course_id');
  }

  /** Handles the delete module request flow. */
  async deleteModule(id: string): Promise<IModule | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid module id');
    }
    const moduleObjectId = new mongoose.Types.ObjectId(id);

    const session = await mongoose.startSession();
    let deletedModule: IModule | null = null;

    try {
      await session.withTransaction(async () => {
        const moduleToDelete = await Module.findById(moduleObjectId).session(session);
        if (!moduleToDelete) {
          deletedModule = null;
          return;
        }

        const deleted = await Module.findByIdAndDelete(moduleObjectId).session(session).populate('course_id');
        deletedModule = deleted;

        if (deletedModule) {
          await Module.updateMany(
            {
              course_id: deletedModule.course_id,
              order: { $gt: deletedModule.order },
            },
            { $inc: { order: -1 } }
          ).session(session);
        }
      });
    } finally {
      await session.endSession();
    }

    return deletedModule;
  }

  /** Handles the get module by id request flow. */
  async getModuleById(id: string): Promise<IModule | null> {
    // Reads one module by id.
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid module id');
    }

    return Module.findById(id).populate('course_id');
  }
}

export const moduleService = new ModuleService();
