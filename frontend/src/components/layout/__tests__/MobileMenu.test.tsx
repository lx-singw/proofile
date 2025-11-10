import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MobileMenu from "../MobileMenu";

describe("MobileMenu", () => {
  it("renders hamburger button", () => {
    render(<MobileMenu />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("calls onClick callback when clicked", () => {
    const mockOnClick = jest.fn();
    render(<MobileMenu onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it("has correct aria-label", () => {
    render(<MobileMenu />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Toggle mobile menu");
  });

  it("has aria-expanded attribute", () => {
    render(<MobileMenu isOpen={false} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("updates aria-expanded when isOpen changes", () => {
    const { rerender } = render(<MobileMenu isOpen={false} />);
    let button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");

    rerender(<MobileMenu isOpen={true} />);
    button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("has aria-haspopup attribute", () => {
    render(<MobileMenu />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-haspopup", "true");
  });

  it("is hidden on desktop (md breakpoint)", () => {
    render(<MobileMenu />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("md:hidden");
  });

  it("displays hamburger menu icon", () => {
    const { container } = render(<MobileMenu />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("has hover state styling", () => {
    render(<MobileMenu />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("hover:bg-gray-100");
  });
});
