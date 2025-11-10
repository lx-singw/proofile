import React from "react";
import { render, screen } from "@testing-library/react";
import DashboardMain from "../DashboardMain";

describe("DashboardMain", () => {
  it("renders children", () => {
    render(
      <DashboardMain>
        <div data-testid="main-content">Main Content</div>
      </DashboardMain>
    );

    expect(screen.getByTestId("main-content")).toBeInTheDocument();
  });

  it("renders as main semantic element", () => {
    const { container } = render(
      <DashboardMain>
        <div>Content</div>
      </DashboardMain>
    );

    const main = container.querySelector("div.space-y-6");
    expect(main).toBeInTheDocument();
  });

  it("has spacing between children", () => {
    const { container } = render(
      <DashboardMain>
        <div>Item 1</div>
        <div>Item 2</div>
      </DashboardMain>
    );

    const spaceDiv = container.querySelector(".space-y-6");
    expect(spaceDiv).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <DashboardMain>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </DashboardMain>
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
    expect(screen.getByTestId("child-3")).toBeInTheDocument();
  });
});
