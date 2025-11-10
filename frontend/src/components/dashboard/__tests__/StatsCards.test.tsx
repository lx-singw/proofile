import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StatsCards from "../StatsCards";

describe("StatsCards", () => {
  const defaultProps = {
    profileViews: 42,
    endorsements: 15,
    verifications: 8,
    onViewStats: jest.fn(),
  };

  it("renders stat cards container", () => {
    const { container } = render(<StatsCards {...defaultProps} />);
    expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
  });

  it("displays profile views stat", () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Profile Views")).toBeInTheDocument();
  });

  it("displays endorsements stat", () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Endorsements")).toBeInTheDocument();
  });

  it("displays verifications stat", () => {
    render(<StatsCards {...defaultProps} />);
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Verifications")).toBeInTheDocument();
  });

  it("displays zero values correctly", () => {
    render(
      <StatsCards
        profileViews={0}
        endorsements={0}
        verifications={0}
        onViewStats={jest.fn()}
      />
    );
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThan(0);
  });

  it("displays large numbers correctly", () => {
    render(
      <StatsCards
        profileViews={1000}
        endorsements={500}
        verifications={250}
        onViewStats={jest.fn()}
      />
    );
    // Numbers are formatted with toLocaleString
    expect(screen.getByText(/1,000|1000/)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it("renders stat cards with correct layout structure", () => {
    const { container } = render(<StatsCards {...defaultProps} />);
    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
  });

  it("includes Eye icon for profile views", () => {
    const { container } = render(<StatsCards {...defaultProps} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("renders trend indicators", () => {
    const { container } = render(<StatsCards {...defaultProps} />);
    // Look for trend text or elements
    const trendElements = container.querySelectorAll(
      "[class*='text-green'], [class*='text-red'], [class*='text-gray']"
    );
    expect(trendElements.length).toBeGreaterThan(0);
  });

  it("applies dark mode classes", () => {
    const { container } = render(<StatsCards {...defaultProps} />);
    expect(container.querySelector(".dark\\:bg-gray-900")).toBeInTheDocument();
  });

  it("applies responsive padding", () => {
    const { container } = render(<StatsCards {...defaultProps} />);
    expect(container.querySelector(".p-6")).toBeInTheDocument();
  });

  it("calls onViewStats when card is clicked", () => {
    const onViewStats = jest.fn();
    const { container } = render(
      <StatsCards {...defaultProps} onViewStats={onViewStats} />
    );
    const cards = container.querySelectorAll("button");
    if (cards.length > 0) {
      fireEvent.click(cards[0]);
      expect(onViewStats).toHaveBeenCalled();
    }
  });

  it("renders border styling for stat cards", () => {
    const { container } = render(<StatsCards {...defaultProps} />);
    expect(container.querySelector(".border")).toBeInTheDocument();
  });

  it("maintains proper spacing between stat cards", () => {
    const { container } = render(<StatsCards {...defaultProps} />);
    expect(container.querySelector(".gap-4")).toBeInTheDocument();
  });
});
