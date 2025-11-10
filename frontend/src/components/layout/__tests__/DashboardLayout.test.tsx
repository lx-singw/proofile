import React from "react";
import { render, screen } from "@testing-library/react";
import DashboardLayout from "../DashboardLayout";

// Mock DashboardHeader
jest.mock("../DashboardHeader", () => {
  return function MockDashboardHeader() {
    return <div data-testid="dashboard-header">Header</div>;
  };
});

describe("DashboardLayout", () => {
  it("renders header and children", () => {
    render(
      <DashboardLayout>
        <div data-testid="content">Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("has proper layout structure", () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const mainElement = container.querySelector("main");
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass("pt-16");
  });

  it("applies dark mode styles", () => {
    const { container } = render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const wrapper = container.querySelector("div");
    expect(wrapper).toHaveClass("dark:bg-slate-950");
  });
});
