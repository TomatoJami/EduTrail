import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const authorization = request.headers.get('authorization');
  const token = request.cookies.get('authToken')?.value;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (userId) {
    headers['x-user-id'] = userId;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
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
  const authorization = request.headers.get('authorization');
  const token = request.cookies.get('authToken')?.value;

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

    console.log(`[Course Progress] GET - courseId: ${courseId}, userId: ${userId}`);

    // Call backend endpoint that already does all the work
    const response = await fetch(`${API_URL}/progress/courses/${courseId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.error(`[Course Progress] Backend returned ${response.status}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch course progress',
          data: { chapters: {}, questions: {} },
        },
        { status: 200 }
      );
    }

    const backendData = await response.json();
    console.log(`[Course Progress] Backend response:`, JSON.stringify(backendData, null, 2));

    // Extract the full data object from backend (includes chapters, questions, status, is_bookmarked, etc)
    const fullData = backendData.data || {};

    // Extract just chapters and questions for the frontend component
    const chapters = fullData.chapters || {};
    const questions = fullData.questions || {};

    console.log(`[Course Progress] Final chapters:`, chapters);
    console.log(`[Course Progress] Final questions:`, questions);

    return NextResponse.json({
      success: true,
      data: {
        chapters,
        questions,
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
