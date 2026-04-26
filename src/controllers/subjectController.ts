import { NextResponse } from 'next/server';
import connectDB from '@/config/database';
import { subjectService, SubjectPayload } from '@/services/subjectService';

export class SubjectController {
  async getAllSubjects(): Promise<NextResponse> {
    try {
      await connectDB();
      const subjects = await subjectService.getAllSubjects();

      return NextResponse.json(
        { success: true, message: 'Subjects fetched successfully', data: subjects },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch subjects',
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }

  async createSubject(payload: SubjectPayload): Promise<NextResponse> {
    try {
      await connectDB();

      if (!payload.subject_name || !payload.subject_img) {
        return NextResponse.json(
          { success: false, message: 'subject_name and subject_img are required' },
          { status: 400 }
        );
      }

      const subject = await subjectService.createSubject(payload);
      return NextResponse.json(
        { success: true, message: 'Subject created successfully', data: subject },
        { status: 201 }
      );
    } catch (error) {
      const err = error as { code?: number; message?: string };
      if (err.code === 11000) {
        return NextResponse.json(
          { success: false, message: 'Subject with this name already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create subject',
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }

  async updateSubject(id: string, payload: Partial<SubjectPayload>): Promise<NextResponse> {
    try {
      await connectDB();

      if (!id) {
        return NextResponse.json(
          { success: false, message: 'Subject id is required' },
          { status: 400 }
        );
      }

      const subject = await subjectService.updateSubject(id, payload);
      if (!subject) {
        return NextResponse.json(
          { success: false, message: 'Subject not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, message: 'Subject updated successfully', data: subject },
        { status: 200 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('Invalid subject id') ? 400 : 500;

      return NextResponse.json(
        { success: false, message: 'Failed to update subject', error: message },
        { status }
      );
    }
  }

  async deleteSubject(id: string): Promise<NextResponse> {
    try {
      await connectDB();

      if (!id) {
        return NextResponse.json(
          { success: false, message: 'Subject id is required' },
          { status: 400 }
        );
      }

      const subject = await subjectService.deleteSubject(id);
      if (!subject) {
        return NextResponse.json(
          { success: false, message: 'Subject not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, message: 'Subject deleted successfully', data: subject },
        { status: 200 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes('Invalid subject id') ? 400 : 500;

      return NextResponse.json(
        { success: false, message: 'Failed to delete subject', error: message },
        { status }
      );
    }
  }
}

export const subjectController = new SubjectController();
