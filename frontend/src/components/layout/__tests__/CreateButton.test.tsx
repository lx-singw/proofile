import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CreateButton from "../CreateButton";

describe("CreateButton", () => {
  it("renders button with plus icon", () => {
    render(<CreateButton />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("calls onClick callback when clicked", () => {
    const mockOnClick = jest.fn();
    render(<CreateButton onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it("has default aria-label", () => {
    render(<CreateButton />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Create new");
  });

  it("accepts custom aria-label", () => {
    render(<CreateButton ariaLabel="Create new post" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Create new post");
  });

  it("has aria-haspopup attribute", () => {
    render(<CreateButton />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-haspopup", "true");
  });

  it("has blue background styling", () => {
    render(<CreateButton />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-blue-600");
  });

  it("has hover state styling", () => {
    render(<CreateButton />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("hover:bg-blue-700");
  });

  it("displays plus icon correctly", () => {
    const { container } = render(<CreateButton />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
