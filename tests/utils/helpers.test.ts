import { describe, expect, it } from "vitest";
import { generateErrorMessage, validateEmail, validatePassword } from "../../src/utils/helpers";

describe("helpers", () => {
  it("validates email addresses", () => {
    expect(validateEmail("student@example.com")).toBe(true);
    expect(validateEmail("not-an-email")).toBe(false);
  });

  it("requires a strong password", () => {
    expect(validatePassword("weak").valid).toBe(false);
    expect(validatePassword("Strong123!").valid).toBe(true);
  });

  it("formats unknown errors consistently", () => {
    expect(generateErrorMessage("boom")).toBe("An unknown error occurred");
    expect(generateErrorMessage(new Error("boom"))).toBe("boom");
  });
});
