import { NextRequest, NextResponse } from 'next/server';

/** Centralizes the backend API base URL used by request helpers. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/** Builds auth headers for backend proxy requests. */
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

  if (authorization) {
    headers.Authorization = authorization;
  } else if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/** Proxies GET requests from the Next.js route to the backend API. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;
    const headers = getAuthHeaders(request);
    const userId = request.headers.get('x-user-id');

    if (!userId && !headers.Authorization) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not authenticated',
          data: { chapters: {}, questions: {} },
        },
        { status: 200 }
      );
    }

    // Call backend endpoint that already does all the work
    const response = await fetch(`${API_URL}/progress/courses/${courseId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
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

    // Extract the full data object from backend (includes chapters, questions, status, is_bookmarked, etc)
    const fullData = backendData.data || {};

    // Extract just chapters and questions for the frontend component
    const chapters = fullData.chapters || {};
    const questions = fullData.questions || {};

    return NextResponse.json({
      success: true,
      data: {
        chapters,
        questions,
      },
    });
  } catch (error) {
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
