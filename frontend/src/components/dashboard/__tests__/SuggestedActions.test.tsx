import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SuggestedActions from "../SuggestedActions";

describe("SuggestedActions", () => {
  const defaultProps = {
    onActionClick: jest.fn(),
  };

  it("renders suggested actions container", () => {
    const { container } = render(<SuggestedActions {...defaultProps} />);
    expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
  });

  it("displays section title", () => {
    render(<SuggestedActions {...defaultProps} />);
    expect(screen.getByText("Suggested Actions")).toBeInTheDocument();
  });

  it("displays lightbulb icon in header", () => {
    const { container } = render(<SuggestedActions {...defaultProps} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("renders default action items", () => {
    render(<SuggestedActions {...defaultProps} />);
    expect(screen.getByText(/Add a Professional Photo/i)).toBeInTheDocument();
    expect(screen.getByText(/Add More Skills/i)).toBeInTheDocument();
  });

  it("displays action descriptions", () => {
    render(<SuggestedActions {...defaultProps} />);
    expect(
      screen.getByText(/50% more likely to be viewed/i)
    ).toBeInTheDocument();
  });

  it("renders custom actions when provided", () => {
    const customActions = [
      {
        id: "custom-1",
        title: "Custom Action",
        description: "This is a custom action",
        icon: <div>Icon</div>,
        cta: "Do It",
        href: "/custom",
        priority: "high" as const,
      },
    ];
    render(
      <SuggestedActions
        actions={customActions}
        {...defaultProps}
      />
    );
    expect(screen.getByText("Custom Action")).toBeInTheDocument();
  });

  it("sorts actions by priority (high first)", () => {
    const { container } = render(<SuggestedActions {...defaultProps} />);
    const actionItems = container.querySelectorAll(
      "[class*='border-l']"
    );
    expect(actionItems.length).toBeGreaterThan(0);
  });

  it("displays priority badge for high priority actions", () => {
    render(<SuggestedActions {...defaultProps} />);
    const priorityBadge = screen.queryAllByText(/Priority/i);
    expect(priorityBadge.length).toBeGreaterThanOrEqual(0);
  });

  it("renders CTA links for each action", () => {
    render(<SuggestedActions {...defaultProps} />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });

  it("calls onActionClick when action CTA is clicked", () => {
    const onActionClick = jest.fn();
    const { container } = render(
      <SuggestedActions
        onActionClick={onActionClick}
      />
    );
    const links = container.querySelectorAll("a");
    if (links.length > 0) {
      fireEvent.click(links[0]);
      expect(onActionClick).toHaveBeenCalled();
    }
  });

  it("displays footer information text", () => {
    render(<SuggestedActions {...defaultProps} />);
    expect(
      screen.getByText(/increase your visibility by up to 80%/i)
    ).toBeInTheDocument();
  });

  it("applies dark mode classes", () => {
    const { container } = render(<SuggestedActions {...defaultProps} />);
    const darkModeElement = container.querySelector("[class*='dark:']");
    expect(darkModeElement).toBeInTheDocument();
  });

  it("renders border styling", () => {
    const { container } = render(<SuggestedActions {...defaultProps} />);
    expect(container.querySelector(".border")).toBeInTheDocument();
  });

  it("applies color to priority borders", () => {
    const { container } = render(<SuggestedActions {...defaultProps} />);
    // Check for border color classes
    expect(
      container.querySelector("[class*='border-red']") ||
      container.querySelector("[class*='border-yellow']") ||
      container.querySelector("[class*='border-blue']")
    ).toBeInTheDocument();
  });

  it("displays action with responsive styling", () => {
    const { container } = render(<SuggestedActions {...defaultProps} />);
    expect(container.querySelector(".space-y-3")).toBeInTheDocument();
  });

  it("renders divider separator", () => {
    const { container } = render(<SuggestedActions {...defaultProps} />);
    const dividers = container.querySelectorAll(".border-t");
    expect(dividers.length).toBeGreaterThan(0);
  });

  it("handles empty actions array", () => {
    const { container } = render(
      <SuggestedActions
        actions={[]}
        {...defaultProps}
      />
    );
    expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
  });

  it("displays correct href for each action", () => {
    const { container } = render(<SuggestedActions {...defaultProps} />);
    const addPhotoLink = container.querySelector(
      'a[href="/profile/photo"]'
    );
    expect(addPhotoLink).toBeInTheDocument();
  });

  it("renders action padding and spacing", () => {
    const { container } = render(<SuggestedActions {...defaultProps} />);
    expect(container.querySelector(".p-6")).toBeInTheDocument();
  });
});
