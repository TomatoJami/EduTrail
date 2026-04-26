import { NextRequest, NextResponse } from 'next/server';
import { courseController } from '@/controllers/courseController';
import { requireAdmin } from '@/utils/requireAdmin';
import { CourseAgeGroup } from '@/models/Course';

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  return courseController.getAllCourses();
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      ageGroup?: CourseAgeGroup;
      course_img?: string;
      subject_id?: string;
    };

    return courseController.createCourse({
      title: body.title?.trim() || '',
      description: body.description?.trim() || '',
      ageGroup: body.ageGroup || ('1-3' as CourseAgeGroup),
      course_img: body.course_img?.trim() || '',
      subject_id: body.subject_id?.trim() || '',
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
      title?: string;
      description?: string;
      ageGroup?: CourseAgeGroup;
      course_img?: string;
      subject_id?: string;
    };

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      );
    }

    return courseController.updateCourse(body.id, {
      title: body.title?.trim(),
      description: body.description?.trim(),
      ageGroup: body.ageGroup,
      course_img: body.course_img?.trim(),
      subject_id: body.subject_id?.trim(),
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

    return courseController.deleteCourse(body.id);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload', error: String(error) },
      { status: 400 }
    );
  }
}
