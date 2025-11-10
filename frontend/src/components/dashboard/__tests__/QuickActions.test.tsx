import React from "react";
import { render, screen } from "@testing-library/react";
import QuickActions from "../QuickActions";

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) {
    return (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

describe("QuickActions", () => {
  it("renders quick actions card title", () => {
    render(<QuickActions />);
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });

  it("renders all quick action items", () => {
    render(<QuickActions />);
    expect(screen.getByText("Add Skill")).toBeInTheDocument();
    expect(screen.getByText("Add Experience")).toBeInTheDocument();
    expect(screen.getByText("Add Education")).toBeInTheDocument();
    expect(screen.getByText("Add Certification")).toBeInTheDocument();
  });

  it("renders action descriptions", () => {
    render(<QuickActions />);
    expect(screen.getByText("Add a new skill")).toBeInTheDocument();
    expect(screen.getByText("Add work experience")).toBeInTheDocument();
    expect(screen.getByText("Add education")).toBeInTheDocument();
    expect(screen.getByText("Add certification")).toBeInTheDocument();
  });

  it("renders correct links for each action", () => {
    render(<QuickActions />);

    const skillLink = screen.getByText("Add Skill").closest("a");
    expect(skillLink).toHaveAttribute("href", "/profile/skills/add");

    const expLink = screen.getByText("Add Experience").closest("a");
    expect(expLink).toHaveAttribute("href", "/profile/experience/add");

    const eduLink = screen.getByText("Add Education").closest("a");
    expect(eduLink).toHaveAttribute("href", "/profile/education/add");

    const certLink = screen.getByText("Add Certification").closest("a");
    expect(certLink).toHaveAttribute("href", "/profile/certifications/add");
  });

  it("has proper card styling", () => {
    const { container } = render(<QuickActions />);
    const card = container.querySelector(".bg-white");
    expect(card).toHaveClass("rounded-lg");
    expect(card).toHaveClass("border");
    expect(card).toHaveClass("p-6");
  });

  it("supports dark mode", () => {
    const { container } = render(<QuickActions />);
    const card = container.querySelector(".bg-white");
    expect(card).toHaveClass("dark:bg-gray-900");
    expect(card).toHaveClass("dark:border-gray-700");
  });

  it("renders icons for each action", () => {
    const { container } = render(<QuickActions />);
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("actions are clickable links", () => {
    const { container } = render(<QuickActions />);
    const links = container.querySelectorAll("a");
    expect(links.length).toBe(4); // 4 quick action links
  });

  it("has hover effects on action items", () => {
    render(<QuickActions />);
    const firstLink = screen.getByText("Add Skill").closest("a");
    expect(firstLink).toHaveClass("hover:bg-gray-50");
    expect(firstLink).toHaveClass("dark:hover:bg-gray-800");
  });
});
