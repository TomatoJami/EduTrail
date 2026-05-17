import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseSearch } from "../../src/components/common/CourseSearch";
import { Course } from "../../src/types";

const courses: Course[] = [
  {
    _id: "course-1",
    title: "Math Basics",
    description: "Learn math",
    ageGroup: "10-12",
    course_img: "/math.png",
    subject_id: "subject-1",
  },
  {
    _id: "course-2",
    title: "History Trail",
    description: "Learn history",
    ageGroup: "4-9",
    course_img: "/history.png",
    subject_id: "subject-2",
  },
];

describe("CourseSearch", () => {
  it("filters courses by query", () => {
    render(<CourseSearch courses={courses} />);

    const input = screen.getByPlaceholderText("Search courses...");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "math" } });

    expect(screen.getByRole("link", { name: "Math Basics" })).toHaveAttribute("href", "/courses/course-1");
    expect(screen.queryByRole("link", { name: "History Trail" })).not.toBeInTheDocument();
  });

  it("shows an empty result message", () => {
    render(<CourseSearch courses={courses} />);

    const input = screen.getByPlaceholderText("Search courses...");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "biology" } });

    expect(screen.getByText("No courses found")).toBeInTheDocument();
  });
});
