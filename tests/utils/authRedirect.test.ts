import { beforeEach, describe, expect, it } from "vitest";
import { getPostLoginRedirect } from "../../src/utils/authRedirect";

describe("getPostLoginRedirect", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("sends students with incomplete onboarding to preferences", () => {
    const redirect = getPostLoginRedirect({
      id: "user-1",
      email: "student@example.com",
      name: "Student",
      role: "student",
      hasCompletedOnboarding: false,
    });

    expect(redirect).toBe("/preferences");
    expect(JSON.parse(sessionStorage.getItem("newUserData") || "{}")).toEqual({
      id: "user-1",
      email: "student@example.com",
      name: "Student",
    });
  });

  it("sends completed users home and clears stale onboarding data", () => {
    sessionStorage.setItem("newUserData", JSON.stringify({ id: "old-user" }));

    const redirect = getPostLoginRedirect({
      id: "user-1",
      email: "student@example.com",
      name: "Student",
      role: "student",
      hasCompletedOnboarding: true,
    });

    expect(redirect).toBe("/");
    expect(sessionStorage.getItem("newUserData")).toBeNull();
  });

  it("does not send admins through student onboarding", () => {
    const redirect = getPostLoginRedirect({
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      hasCompletedOnboarding: false,
    });

    expect(redirect).toBe("/");
    expect(sessionStorage.getItem("newUserData")).toBeNull();
  });
});
