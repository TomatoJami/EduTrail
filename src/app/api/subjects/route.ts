import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

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

export async function GET(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);

    const response = await fetch(`${API_URL}/subjects`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch subjects',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
  const authorization = request.headers.get('authorization');
  const token = request.cookies.get('authToken')?.value;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: invalid user id' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const headers = getAuthHeaders(request);

    const response = await fetch(`${API_URL}/subjects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload', error: String(error) },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
  const authorization = request.headers.get('authorization');
  const token = request.cookies.get('authToken')?.value;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: invalid user id' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      );
    }

    const headers = getAuthHeaders(request);

    const response = await fetch(`${API_URL}/subjects/${body.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload', error: String(error) },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
  const authorization = request.headers.get('authorization');
  const token = request.cookies.get('authToken')?.value;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: invalid user id' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, message: 'id is required' },
        { status: 400 }
      );
    }

    const headers = getAuthHeaders(request);

    const response = await fetch(`${API_URL}/subjects/${body.id}`, {
      method: 'DELETE',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload', error: String(error) },
      { status: 400 }
    );
  }
}
