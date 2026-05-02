import mongoose from 'mongoose';
import { Module, IModule } from '../models/Module';

export interface ModulePayload {
  title: string;
  order?: number;
  course_id: string;
}

export class ModuleService {
  async getAllModules(): Promise<IModule[]> {
    return Module.find().populate('course_id').sort({ order: 1 });
  }

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
      new: true,
      runValidators: true,
    }).populate('course_id');
  }

  async deleteModule(id: string): Promise<IModule | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid module id');
    }

    const moduleToDelete = await Module.findById(id);
    if (!moduleToDelete) {
      return null;
    }

    const deletedModule = await Module.findByIdAndDelete(id).populate('course_id');

    if (deletedModule) {
      await Module.updateMany(
        {
          course_id: deletedModule.course_id,
          order: { $gt: deletedModule.order },
        },
        { $inc: { order: -1 } }
      );
    }

    return deletedModule;
  }

  async getModuleById(id: string): Promise<IModule | null> {
    if (!mongoose.isValidObjectId(id)) {
      throw new Error('Invalid module id');
    }

    return Module.findById(id).populate('course_id');
  }
}

export const moduleService = new ModuleService();
