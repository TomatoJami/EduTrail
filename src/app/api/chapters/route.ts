import { NextResponse } from 'next/server';

/** Centralizes the backend API base URL used by request helpers. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/** Proxies GET requests from the Next.js route to the backend API. */
export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id');
  const authorization = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const module_id = searchParams.get('module_id');

  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (userId) {
    headers['x-user-id'] = userId;
  }

  if (authorization) {
    headers.Authorization = authorization;
  }

  const url = module_id ? `${API_URL}/chapters?module_id=${module_id}` : `${API_URL}/chapters`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}

/** Proxies POST requests from the Next.js route to the backend API. */
export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id');
  const authorization = request.headers.get('authorization');
  const body = await request.json();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create chapter' },
      { status: 500 }
    );
  }
}
