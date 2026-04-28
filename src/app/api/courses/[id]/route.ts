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
    const { id } = await params;
    const headers = getAuthHeaders(request);

    const response = await fetch(`${API_URL}/courses/${id}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch subject',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
