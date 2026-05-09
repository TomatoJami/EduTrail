import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getAuthHeaders(request: NextRequest) {
  const userId = request.headers.get("x-user-id");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (userId) {
    headers["x-user-id"] = userId;
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

    // Проверяем user_id из заголовка
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: invalid user id",
        },
        { status: 401 }
      );
    }

    // Получаем данные только от фронтенда
    const body = await request.json();

    // Проверяем обязательные поля
    if (!body.feedbackType || !body.data?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "feedbackType and data are required",
        },
        { status: 400 }
      );
    }

    // Формируем payload для backend API
    const payload = {
      feedbackType: body.feedbackType,
      data: body.data.trim(),
      user_id: userId, // добавляем автоматически
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