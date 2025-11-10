import React from "react";
import { render, screen } from "@testing-library/react";
import DashboardContent from "../DashboardContent";

describe("DashboardContent", () => {
  it("renders children", () => {
    render(
      <DashboardContent>
        <div data-testid="test-content">Test Content</div>
      </DashboardContent>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("has responsive grid layout", () => {
    const { container } = render(
      <DashboardContent>
        <div>Content</div>
      </DashboardContent>
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-1");
    expect(grid).toHaveClass("lg:grid-cols-4");
  });

  it("has max-width container", () => {
    const { container } = render(
      <DashboardContent>
        <div>Content</div>
      </DashboardContent>
    );

    const maxWidthContainer = container.querySelector(".max-w-7xl");
    expect(maxWidthContainer).toBeInTheDocument();
  });

  it("has proper spacing and padding", () => {
    const { container } = render(
      <DashboardContent>
        <div>Content</div>
      </DashboardContent>
    );

    const wrapper = container.querySelector(".max-w-7xl");
    expect(wrapper).toHaveClass("px-4");
    expect(wrapper).toHaveClass("sm:px-6");
    expect(wrapper).toHaveClass("lg:px-8");
    expect(wrapper).toHaveClass("py-8");
  });

  it("creates gap between sidebar and main content", () => {
    const { container } = render(
      <DashboardContent>
        <div>Content</div>
      </DashboardContent>
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("gap-6");
  });

  it("main content takes 3 columns on large screens", () => {
    const { container } = render(
      <DashboardContent>
        <div>Content</div>
      </DashboardContent>
    );

    const main = container.querySelector("main");
    expect(main).toHaveClass("lg:col-span-3");
  });
});
