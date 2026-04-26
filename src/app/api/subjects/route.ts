import { NextRequest, NextResponse } from 'next/server';
import { subjectController } from '@/controllers/subjectController';
import { requireAdmin } from '@/utils/requireAdmin';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  return subjectController.getAllSubjects();
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = (await request.json()) as { subject_name?: string; subject_img?: string };

    return subjectController.createSubject({
      subject_name: body.subject_name?.trim() || '',
      subject_img: body.subject_img?.trim() || '',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload', error: String(error) },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      subject_name?: string;
      subject_img?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      );
    }

    return subjectController.updateSubject(body.id, {
      subject_name: body.subject_name?.trim(),
      subject_img: body.subject_img?.trim(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload', error: String(error) },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = (await request.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      );
    }

    return subjectController.deleteSubject(body.id);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload', error: String(error) },
      { status: 400 }
    );
  }
}
