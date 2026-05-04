import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (userId) {
    headers['x-user-id'] = userId;
  }

  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const headers = getAuthHeaders(request);
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not authenticated',
          data: { chapters: {}, questions: {} },
        },
        { status: 200 }
      );
    }

    // Fetch modules for this course
    const modulesResponse = await fetch(`${API_URL}/modules?course_id=${courseId}`, {
      method: 'GET',
      headers,
    });

    if (!modulesResponse.ok) {
      throw new Error('Failed to fetch modules');
    }

    const modulesData = await modulesResponse.json();
    const modules = modulesData.data || [];

    const chapterProgressMap: Record<string, boolean> = {};
    const questionProgressMap: Record<string, boolean> = {};

    // Fetch progress for all chapters and questions in this course
    for (const module of modules) {
      // Get chapter progress for this module
      try {
        const chapterProgressResponse = await fetch(
          `${API_URL}/user-chapters/${userId}/modules/${module._id}/chapters`,
          {
            method: 'GET',
            headers,
          }
        );

        if (chapterProgressResponse.ok) {
          const chapterProgressData = await chapterProgressResponse.json();
          const completedChapters = chapterProgressData.data || [];

          for (const completed of completedChapters) {
            chapterProgressMap[completed.chapter_id] = completed.is_completed;
          }
        }
      } catch (err) {
        console.error('Error fetching chapter progress:', err);
      }

      // Get question progress for this module
      try {
        const questionProgressResponse = await fetch(
          `${API_URL}/user-questions/${userId}/modules/${module._id}/questions`,
          {
            method: 'GET',
            headers,
          }
        );

        if (questionProgressResponse.ok) {
          const questionProgressData = await questionProgressResponse.json();
          const completedQuestions = questionProgressData.data || [];

          for (const completed of completedQuestions) {
            questionProgressMap[completed.question_id] = completed.is_completed;
          }
        }
      } catch (err) {
        console.error('Error fetching question progress:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        chapters: chapterProgressMap,
        questions: questionProgressMap,
      },
    });
  } catch (error) {
    console.error('Error fetching course progress:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch course progress',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
