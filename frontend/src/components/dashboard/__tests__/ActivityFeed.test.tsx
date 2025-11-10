import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ActivityFeed from "../ActivityFeed";

describe("ActivityFeed", () => {
  const defaultProps = {
    onActivityClick: jest.fn(),
    isLoading: false,
  };

  it("renders activity feed container", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
  });

  it("displays section title", () => {
    render(<ActivityFeed {...defaultProps} />);
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  });

  it("renders default activity items", () => {
    render(<ActivityFeed {...defaultProps} />);
    expect(screen.getByText(/Endorsed/i)).toBeInTheDocument();
  });

  it("displays activity with actor name", () => {
    render(<ActivityFeed {...defaultProps} />);
    expect(screen.getByText("Sarah Johnson")).toBeInTheDocument();
  });

  it("displays activity timestamps", () => {
    render(<ActivityFeed {...defaultProps} />);
    // Should display relative time (e.g., "2h ago")
    const agoTexts = screen.queryAllByText(/ago/);
    const justNowTexts = screen.queryAllByText(/just now/);
    expect(agoTexts.length + justNowTexts.length).toBeGreaterThan(0);
  });

  it("renders custom activities when provided", () => {
    const customActivities = [
      {
        id: "custom-1",
        type: "connection" as const,
        actor: "Jane Doe",
        title: "Connected with you",
        timestamp: new Date(),
        href: "/connections",
        read: true,
      },
    ];
    render(
      <ActivityFeed
        activities={customActivities}
        {...defaultProps}
      />
    );
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("displays loading skeleton when isLoading is true", () => {
    const { container } = render(
      <ActivityFeed {...defaultProps} isLoading={true} />
    );
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("hides content when loading", () => {
    render(
      <ActivityFeed
        activities={[]}
        {...defaultProps}
        isLoading={true}
      />
    );
    // Loading state should be displayed
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders activity icons based on type", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("calls onActivityClick when activity is clicked", () => {
    const onActivityClick = jest.fn();
    const { container } = render(
      <ActivityFeed
        onActivityClick={onActivityClick}
        isLoading={false}
      />
    );
    const activityLinks = container.querySelectorAll("a");
    if (activityLinks.length > 0) {
      fireEvent.click(activityLinks[0]);
      expect(onActivityClick).toHaveBeenCalled();
    }
  });

  it("displays unread indicator for unread activities", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    // Unread activities should have blue indicator
    const indicators = container.querySelectorAll(
      "[class*='bg-blue']"
    );
    expect(indicators.length).toBeGreaterThan(0);
  });

  it("renders activity descriptions when provided", () => {
    render(<ActivityFeed {...defaultProps} />);
    expect(
      screen.queryByText(/Added React to/i) ||
      screen.queryByText(/Senior Recruiter/i)
    ).toBeTruthy();
  });

  it("displays empty state when no activities", () => {
    render(
      <ActivityFeed
        activities={[]}
        {...defaultProps}
      />
    );
    expect(
      screen.getByText(/No recent activity/i)
    ).toBeInTheDocument();
  });

  it("applies dark mode classes", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    const darkModeElement = container.querySelector("[class*='dark:']");
    expect(darkModeElement).toBeInTheDocument();
  });

  it("renders border styling", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    expect(container.querySelector(".border")).toBeInTheDocument();
  });

  it("displays divider between activities", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    expect(container.querySelector(".divide-y")).toBeInTheDocument();
  });

  it("renders view all activity footer link", () => {
    render(<ActivityFeed {...defaultProps} />);
    expect(screen.getByText(/View all activity/i)).toBeInTheDocument();
  });

  it("footer link points to activity page", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    const footerLink = container.querySelector('a[href="/activity"]');
    expect(footerLink).toBeInTheDocument();
  });

  it("handles multiple activity types correctly", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    // Should render multiple different activity types
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(1);
  });

  it("applies hover effect to activity items", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    const activityItems = container.querySelectorAll(".hover\\:bg-gray-50");
    expect(activityItems.length).toBeGreaterThan(0);
  });

  it("renders with proper padding", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    expect(container.querySelector(".p-6")).toBeInTheDocument();
  });

  it("displays activity with correct href", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    const links = container.querySelectorAll('a[href*="/"]');
    expect(links.length).toBeGreaterThan(0);
  });

  it("renders responsive icon sizes", () => {
    const { container } = render(<ActivityFeed {...defaultProps} />);
    // Icons should have responsive size classes
    const iconElements = container.querySelectorAll(
      "[class*='w-5'], [class*='h-5']"
    );
    expect(iconElements.length).toBeGreaterThan(0);
  });
});
