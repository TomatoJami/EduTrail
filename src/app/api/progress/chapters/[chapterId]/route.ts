import { NextRequest, NextResponse } from "next/server";

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

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const body = await request.json();
    const headers = getAuthHeaders(request);

    const response = await fetch(
      `${API_URL}/progress/chapters/${chapterId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update chapter progress",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}