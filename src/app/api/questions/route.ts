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
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const module_id = searchParams.get('module_id');

  const headers = getAuthHeaders(request);

  const url = module_id ? `${API_URL}/questions?module_id=${module_id}` : `${API_URL}/questions`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

/** Proxies POST requests from the Next.js route to the backend API. */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const body = await request.json();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/questions`, {
      method: 'POST',
      headers: getAuthHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create question' },
      { status: 500 }
    );
  }
}
