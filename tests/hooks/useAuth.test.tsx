import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../src/hooks/useAuth";

describe("useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("logs in, stores the session, and exposes the normalized user", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          id: "user-1",
          email: "student@example.com",
          name: "Student",
          role: "admin",
          token: "token",
          expiresAt: "2026-01-01T01:00:00.000Z",
        },
      }),
    } as Response);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login("student@example.com", "Strong123!");
    });

    expect(fetch).toHaveBeenCalledWith("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        email: "student@example.com",
        password: "Strong123!",
      }),
    });
    expect(result.current.user).toEqual({
      id: "user-1",
      email: "student@example.com",
      name: "Student",
      role: "admin",
    });
    expect(JSON.parse(localStorage.getItem("user") || "{}")).toEqual({
      id: "user-1",
      email: "student@example.com",
      name: "Student",
      role: "admin",
    });
    expect(localStorage.getItem("authExpiresAt")).toBe("2026-01-01T01:00:00.000Z");
  });

  it("sets an error when login fails", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({
        success: false,
        message: "Email or Password is incorrect",
      }),
    } as Response);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login("student@example.com", "wrong");
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe("Email or Password is incorrect");
  });

  it("loads and refreshes a stored user", async () => {
    localStorage.setItem("user", JSON.stringify({
      id: "user-1",
      email: "old@example.com",
      name: "Old",
      role: "student",
    }));
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          _id: "user-1",
          email: "fresh@example.com",
          name: "Fresh",
          role: "student",
        },
      }),
    } as Response);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.loadUser();
    });

    expect(fetch).toHaveBeenCalledWith("/api/users/user-1", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "user-1",
      },
    });
    expect(result.current.initialized).toBe(true);
    expect(result.current.user).toEqual({
      id: "user-1",
      email: "fresh@example.com",
      name: "Fresh",
      role: "student",
    });
  });

  it("clears local session on logout", async () => {
    localStorage.setItem("user", JSON.stringify({
      id: "user-1",
      email: "student@example.com",
      name: "Student",
      role: "student",
    }));
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.logout();
    });

    await waitFor(() => {
      expect(localStorage.getItem("user")).toBeNull();
      expect(fetch).toHaveBeenCalledWith("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    });
  });
});
