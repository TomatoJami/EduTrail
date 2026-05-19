import { NextRequest, NextResponse } from "next/server";

/** Keeps the proxy logic isolated and reusable. */
export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("authToken")?.value;
  if (!token || request.headers.has("authorization")) {
    return NextResponse.next();
  }

  const headers = new Headers(request.headers);
  headers.set("authorization", `Bearer ${token}`);

  return NextResponse.next({
    request: {
      headers,
    },
  });
}

export const config = {
  matcher: "/api/:path*",
};
