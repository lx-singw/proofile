import React from "react";
import { render, screen } from "@testing-library/react";
import DashboardSidebar from "../DashboardSidebar";

describe("DashboardSidebar", () => {
  it("renders children", () => {
    render(
      <DashboardSidebar>
        <div data-testid="sidebar-content">Sidebar Content</div>
      </DashboardSidebar>
    );

    expect(screen.getByTestId("sidebar-content")).toBeInTheDocument();
  });

  it("is hidden on mobile", () => {
    const { container } = render(
      <DashboardSidebar>
        <div>Content</div>
      </DashboardSidebar>
    );

    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("hidden");
    expect(aside).toHaveClass("lg:block");
  });

  it("has sticky positioning on desktop", () => {
    const { container } = render(
      <DashboardSidebar>
        <div>Content</div>
      </DashboardSidebar>
    );

    const stickyDiv = container.querySelector(".sticky");
    expect(stickyDiv).toHaveClass("sticky");
    expect(stickyDiv).toHaveClass("top-20");
  });

  it("renders as aside semantic element", () => {
    const { container } = render(
      <DashboardSidebar>
        <div>Content</div>
      </DashboardSidebar>
    );

    const aside = container.querySelector("aside");
    expect(aside).toBeInTheDocument();
  });

  it("has spacing between children", () => {
    const { container } = render(
      <DashboardSidebar>
        <div>Item 1</div>
        <div>Item 2</div>
      </DashboardSidebar>
    );

    const spaceDiv = container.querySelector(".space-y-4");
    expect(spaceDiv).toBeInTheDocument();
  });
});
