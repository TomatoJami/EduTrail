import { NextRequest, NextResponse } from "next/server";

/** Centralizes the backend API base URL used by request helpers. */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/** Builds auth headers for backend proxy requests. */
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

/** Proxies quiz grading requests to the backend API. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/questions/grade`, {
      method: "POST",
      headers: getAuthHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to grade quiz",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
