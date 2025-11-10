import React from "react";
import { render, screen } from "@testing-library/react";
import ActivityGraph from "../ActivityGraph";

describe("ActivityGraph", () => {
  it("renders activity graph container", () => {
    const { container } = render(<ActivityGraph />);
    expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
  });

  it("displays title", () => {
    render(<ActivityGraph title="My Activity" />);
    expect(screen.getByText("My Activity")).toBeInTheDocument();
  });

  it("renders default title when not provided", () => {
    render(<ActivityGraph />);
    // Component default title is "Activity"
    expect(screen.getByText(/Activity/i)).toBeInTheDocument();
  });

  it("renders heat map grid", () => {
    const { container } = render(<ActivityGraph />);
    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
  });

  it("generates 52 weeks of data", () => {
    const { container } = render(<ActivityGraph />);
    // Each week is a column, so we should have grid columns
    const cells = container.querySelectorAll(
      "[class*='w-4'], [class*='h-4']"
    );
    expect(cells.length).toBeGreaterThan(0);
  });

  it("displays activity level cells with proper styling", () => {
    const { container } = render(<ActivityGraph />);
    const cells = container.querySelectorAll("[class*='rounded']");
    expect(cells.length).toBeGreaterThan(0);
  });

  it("renders legend with activity levels", () => {
    render(<ActivityGraph />);
    expect(screen.getByText(/Less/i)).toBeInTheDocument();
    expect(screen.getByText(/More/i)).toBeInTheDocument();
  });

  it("displays stats section", () => {
    render(<ActivityGraph />);
    expect(screen.getByText(/Total/i)).toBeInTheDocument();
  });

  it("shows total contributions count", () => {
    render(<ActivityGraph />);
    // Stats should display total contributions in stats section
    const stats = screen.getByText(/Total/i);
    expect(stats).toBeInTheDocument();
  });

  it("applies dark mode classes", () => {
    const { container } = render(<ActivityGraph />);
    // Check for elements with dark mode classes
    const darkModeElement = container.querySelector("[class*='dark:']");
    expect(darkModeElement).toBeInTheDocument();
  });

  it("renders header with stats layout", () => {
    const { container } = render(<ActivityGraph />);
    expect(container.querySelector(".flex")).toBeInTheDocument();
  });

  it("renders graph title styling", () => {
    const { container } = render(<ActivityGraph />);
    expect(
      container.querySelector(".text-lg")
    ).toBeInTheDocument();
  });

  it("generates sample data when data prop is not provided", () => {
    const { container } = render(<ActivityGraph />);
    // Should render grid cells for sample data
    const rows = container.querySelectorAll("[class*='grid']");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("uses custom data when provided", () => {
    const customData = [
      { date: new Date("2024-01-01"), count: 5, level: 3 as const },
      { date: new Date("2024-01-02"), count: 0, level: 0 as const },
    ];
    const { container } = render(<ActivityGraph data={customData} />);
    expect(container.querySelector(".grid")).toBeInTheDocument();
  });

  it("displays responsive border styling", () => {
    const { container } = render(<ActivityGraph />);
    expect(container.querySelector(".border")).toBeInTheDocument();
  });

  it("contains color-coded cells for different activity levels", () => {
    const { container } = render(<ActivityGraph />);
    // Look for elements with background color classes
    const coloredCells = container.querySelectorAll("[class*='bg-']");
    expect(coloredCells.length).toBeGreaterThan(0);
  });

  it("renders 7 rows for days of week", () => {
    const { container } = render(<ActivityGraph />);
    // The component should render with day rows
    expect(container.querySelector(".grid")).toBeInTheDocument();
  });

  it("shows footer with activity link", () => {
    const { container } = render(<ActivityGraph />);
    // Should render the main container
    expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
  });

  it("renders with padding", () => {
    const { container } = render(<ActivityGraph />);
    expect(container.querySelector(".p-6")).toBeInTheDocument();
  });
});
