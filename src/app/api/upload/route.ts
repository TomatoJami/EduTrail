import { NextRequest, NextResponse } from "next/server";

/** Centralizes the backend API base URL used by request helpers. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/** Proxies POST requests from the Next.js route to the backend API. */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const authorization = request.headers.get("authorization");
    const folder = request.nextUrl.searchParams.get("folder") || "subjects";
    const formData = await request.formData();

    const headers: Record<string, string> = {};
    if (userId) {
      headers["x-user-id"] = userId;
    }
    if (authorization) {
      headers.Authorization = authorization;
    }

    // Stream the browser FormData to the backend so Supabase writes stay server-side.
    const response = await fetch(`${API_URL}/upload?folder=${encodeURIComponent(folder)}`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
