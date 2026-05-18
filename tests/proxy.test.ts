import { beforeEach, describe, expect, it, vi } from "vitest";

const nextResponseMock = vi.hoisted(() => ({
  next: vi.fn((init?: unknown) => ({ type: "next", init })),
}));

vi.mock("next/server", () => ({
  NextResponse: nextResponseMock,
}));

const makeRequest = ({
  pathname,
  token,
  authorization,
}: {
  pathname: string;
  token?: string;
  authorization?: string;
}) =>
  ({
    nextUrl: { pathname },
    cookies: {
      get: vi.fn((name: string) => (name === "authToken" && token ? { value: token } : undefined)),
    },
    headers: new Headers(authorization ? { authorization } : undefined),
  }) as any;

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("leaves non-api routes untouched", async () => {
    const { proxy } = await import("../src/proxy");

    const result = proxy(makeRequest({ pathname: "/courses", token: "cookie-token" }));

    // Page requests should not receive API authorization headers from the cookie proxy.
    expect(nextResponseMock.next).toHaveBeenCalledWith();
    expect(result).toEqual({ type: "next", init: undefined });
  });

  it("adds a bearer authorization header to api requests with an auth cookie", async () => {
    const { proxy } = await import("../src/proxy");

    proxy(makeRequest({ pathname: "/api/courses", token: "cookie-token" }));

    const init = nextResponseMock.next.mock.calls[0][0] as {
      request: { headers: Headers };
    };

    // Backend API routes expect Authorization, while the browser stores the token as a cookie.
    expect(init.request.headers.get("authorization")).toBe("Bearer cookie-token");
  });

  it("keeps an existing authorization header instead of overwriting it", async () => {
    const { proxy } = await import("../src/proxy");

    proxy(
      makeRequest({
        pathname: "/api/courses",
        token: "cookie-token",
        authorization: "Bearer explicit-token",
      })
    );

    // Explicit headers can come from tests, tools, or future clients and should remain authoritative.
    expect(nextResponseMock.next).toHaveBeenCalledWith();
  });
});
