import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "../../src/components/MarkdownContent";

describe("MarkdownContent", () => {
  it("renders common markdown blocks", () => {
    render(
      <MarkdownContent
        content={[
          "# Intro",
          "Paragraph with **bold**, *italic*, `code`, and [link](/courses).",
          "> Quote text",
          "- First",
          "- Second",
          "1. One",
          "2. Two",
          "```ts",
          "const answer = 42;",
          "```",
        ].join("\n")}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Intro" })).toBeInTheDocument();
    expect(screen.getByText("bold")).toBeInTheDocument();
    expect(screen.getByText("italic")).toBeInTheDocument();
    expect(screen.getByText("code")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "link" })).toHaveAttribute("href", "/courses");
    expect(screen.getByText("Quote text")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("const answer = 42;")).toBeInTheDocument();
  });

  it("replaces unsafe links and image sources with a safe placeholder", () => {
    render(
      <MarkdownContent
        content={[
          "[bad](javascript:bad)",
          "![Bad image](javascript:bad)",
        ].join("\n")}
      />
    );

    expect(screen.getByRole("link", { name: "bad" })).toHaveAttribute("href", "#");
    expect(screen.getByRole("img", { name: "Bad image" })).toHaveAttribute("src", "#");
  });

  it("renders a fallback when content is empty", () => {
    render(<MarkdownContent content="" />);

    expect(screen.getByText("No content available.")).toBeInTheDocument();
  });
});
