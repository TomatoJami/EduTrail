import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CourseCard } from "../../src/components/CourseCard";
import { Course, CourseProgress } from "../../src/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const course: Course = {
  _id: "course-1",
  title: "Math Basics",
  description: "Learn math",
  ageGroup: "10-12",
  course_img: "/math.png",
  subject_id: "subject-1",
};

const progress: CourseProgress = {
  _id: "progress-1",
  user_id: "user-1",
  course_id: "course-1",
  status: "in_progress",
  is_bookmarked: false,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("CourseCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("alert", vi.fn());
  });

  it("renders course details and a guest view action", () => {
    render(<CourseCard course={course} />);

    expect(screen.getByText("Math Basics")).toBeInTheDocument();
    expect(screen.getByText("Grades 10-12")).toBeInTheDocument();
    expect(screen.getByText("View")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("navigates to the course when starting a course", async () => {
    render(<CourseCard course={course} userId="user-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Get Started" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/courses/course-1");
    });
  });

  it("toggles bookmarks and notifies the parent", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { is_bookmarked: true } }),
    } as Response);
    const onBookmarkChange = vi.fn();

    render(
      <CourseCard
        course={course}
        userId="user-1"
        courseProgress={progress}
        onBookmarkChange={onBookmarkChange}
      />
    );

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/progress/courses/course-1/bookmark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-1",
        },
      });
      expect(onBookmarkChange).toHaveBeenCalledWith("course-1", true);
    });
  });
});
