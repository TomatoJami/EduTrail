import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = vi.hoisted(() => {
  class MockAxiosError extends Error {
    response?: unknown;

    constructor(message: string, response?: unknown) {
      super(message);
      this.response = response;
    }
  }

  const client = {
    defaults: {
      headers: {
        common: {} as Record<string, string>,
      },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  return {
    client,
    axios: {
      create: vi.fn(() => client),
      post: vi.fn(),
    },
    AxiosError: MockAxiosError,
  };
});

vi.mock("axios", () => ({
  default: axiosMock.axios,
  AxiosError: axiosMock.AxiosError,
}));

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.client.defaults.headers.common = {};
    axiosMock.client.get.mockReset();
    axiosMock.client.post.mockReset();
    axiosMock.client.put.mockReset();
    axiosMock.client.delete.mockReset();
    axiosMock.axios.post.mockReset();
  });

  it("sets and clears the authenticated user header", async () => {
    const { apiClient } = await import("../../src/utils/apiClient");

    apiClient.setUserId("user-1");
    expect(apiClient.getUserId()).toBe("user-1");

    apiClient.setUserId(null);
    expect(apiClient.getUserId()).toBeUndefined();
  });

  it("calls auth login endpoint and returns response data", async () => {
    axiosMock.client.post.mockResolvedValue({
      data: {
        success: true,
        message: "Login successful",
        data: { id: "user-1" },
      },
    });
    const { apiClient } = await import("../../src/utils/apiClient");

    const result = await apiClient.auth.login("student@example.com", "Strong123!");

    expect(axiosMock.client.post).toHaveBeenCalledWith("/auth/login", {
      email: "student@example.com",
      password: "Strong123!",
    });
    expect(result).toEqual({
      success: true,
      message: "Login successful",
      data: { id: "user-1" },
    });
  });

  it("returns API error payloads from Axios errors", async () => {
    axiosMock.client.get.mockRejectedValue(
      new axiosMock.AxiosError("Request failed", {
        data: {
          success: false,
          message: "Failed to fetch courses",
          error: "boom",
        },
      })
    );
    const { apiClient } = await import("../../src/utils/apiClient");

    const result = await apiClient.courses.getAll();

    expect(axiosMock.client.get).toHaveBeenCalledWith("/courses");
    expect(result).toEqual({
      success: false,
      message: "Failed to fetch courses",
      error: "boom",
    });
  });

  it("uploads images through the frontend upload route with user headers", async () => {
    axiosMock.axios.post.mockResolvedValue({
      data: {
        success: true,
        message: "Image uploaded successfully",
        data: {
          imageUrl: "https://cdn.example.com/course.jpg",
          fileName: "course.jpg",
          size: 10,
        },
      },
    });
    const { apiClient } = await import("../../src/utils/apiClient");
    apiClient.setUserId("user-1");

    const result = await apiClient.upload.image(
      new File(["image"], "course.jpg", { type: "image/jpeg" }),
      "courses"
    );

    expect(axiosMock.axios.post).toHaveBeenCalledWith(
      "/api/upload?folder=courses",
      expect.any(FormData),
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-user-id": "user-1",
        },
      }
    );
    expect(result.success).toBe(true);
    expect(result.data?.imageUrl).toBe("https://cdn.example.com/course.jpg");
  });
});
