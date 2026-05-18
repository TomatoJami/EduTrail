import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getAuthHeaders(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const authorization = request.headers.get("authorization");
  const token = request.cookies.get("authToken")?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (userId) {
    headers["x-user-id"] = userId;
  }

  if (authorization) {
    headers.Authorization = authorization;
  } else if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const headers = getAuthHeaders(request);

    const response = await fetch(`${API_URL}/feedback`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch feedback",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    // Validate the user id provided by the authenticated frontend request.
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: invalid user id",
        },
        { status: 401 }
      );
    }

    // Accept only feedback fields controlled by the frontend form.
    const body = await request.json();

    // Required fields are checked before forwarding to the backend API.
    if (!body.feedbackType || !body.data?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "feedbackType and data are required",
        },
        { status: 400 }
      );
    }

    // Build the backend payload and attach the user id server-side.
    const payload = {
      feedbackType: body.feedbackType,
      data: body.data.trim(),
      user_id: userId,
    };

    const headers = getAuthHeaders(request);

    const response = await fetch(`${API_URL}/feedback`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request payload",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}
