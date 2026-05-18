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

  if (authorization) {
    headers.Authorization = authorization;
  } else if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = getAuthHeaders(request);

    // Fetch modules for this course
    const modulesResponse = await fetch(`${API_URL}/modules?course_id=${id}`, {
      method: 'GET',
      headers,
    });

    if (!modulesResponse.ok) {
      throw new Error('Failed to fetch modules');
    }

    const modulesData = await modulesResponse.json();
    const modules = modulesData.data || [];

    // Fetch chapters and questions for each module
    const modulesWithContent = await Promise.all(
      modules.map(async (module: any) => {
        // Fetch chapters for this module
        const chaptersResponse = await fetch(`${API_URL}/chapters?module_id=${module._id}`, {
          method: 'GET',
          headers,
        });

        const chaptersData = await chaptersResponse.json();
        const chapters = chaptersData.data || [];

        // Fetch questions for this module
        const questionsResponse = await fetch(`${API_URL}/questions?module_id=${module._id}`, {
          method: 'GET',
          headers,
        });

        const questionsData = await questionsResponse.json();
        const questions = questionsData.data || [];

        return {
          ...module,
          chapters: chapters.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
          questions,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: modulesWithContent.sort((a, b) => (a.order || 0) - (b.order || 0)),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch course content',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
