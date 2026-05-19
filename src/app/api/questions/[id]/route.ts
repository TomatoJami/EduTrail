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
  const { id } = await params;
  const headers = getAuthHeaders(request);

  try {
    const response = await fetch(`${API_URL}/questions/${id}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

/** Proxies PUT requests from the Next.js route to the backend API. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.headers.get('x-user-id');
  const body = await request.json();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/questions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update question' },
      { status: 500 }
    );
  }
}

/** Proxies DELETE requests from the Next.js route to the backend API. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/questions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(request),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
