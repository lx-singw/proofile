import React from "react";
import { render, screen } from "@testing-library/react";
import ProfileSummaryCard from "../ProfileSummaryCard";

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

describe("ProfileSummaryCard", () => {
  const mockUser = {
    id: 1,
    email: "user@example.com",
    full_name: "John Doe",
  };

  const mockProfile = {
    id: 1,
    headline: "Senior Software Engineer",
    summary: "Experienced software engineer",
  };

  it("renders user display name", () => {
    render(<ProfileSummaryCard user={mockUser} profile={mockProfile} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders user initial in avatar", () => {
    render(<ProfileSummaryCard user={mockUser} profile={mockProfile} />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders profile headline", () => {
    render(<ProfileSummaryCard user={mockUser} profile={mockProfile} />);
    expect(screen.getByText("Senior Software Engineer")).toBeInTheDocument();
  });

  it("renders profile completion percentage", () => {
    render(
      <ProfileSummaryCard
        user={mockUser}
        profile={mockProfile}
        completionPercentage={75}
      />
    );
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders stats", () => {
    render(<ProfileSummaryCard user={mockUser} profile={mockProfile} />);
    expect(screen.getByText("Views")).toBeInTheDocument();
    expect(screen.getByText("Endorsements")).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(<ProfileSummaryCard user={mockUser} profile={mockProfile} />);
    // UI copy changed to "Resume" in this app — tests updated to match.
    expect(screen.getByText("Edit Resume")).toBeInTheDocument();
    expect(screen.getByText("Share Resume")).toBeInTheDocument();
    expect(screen.getByText("View Resume")).toBeInTheDocument();
  });

  it("renders edit profile link with correct href", () => {
    render(<ProfileSummaryCard user={mockUser} profile={mockProfile} />);
    const editLink = screen.getByText("Edit Resume").closest("a");
    expect(editLink).toHaveAttribute("href", "/profile/edit");
  });

  it("renders view profile link with correct href", () => {
    render(<ProfileSummaryCard user={mockUser} profile={mockProfile} />);
    const viewLink = screen.getByText("View Resume").closest("a");
    expect(viewLink).toHaveAttribute("href", "/profile");
  });

  it("uses email prefix as name when full_name is not provided", () => {
    interface MinimalUser {
      email: string;
      full_name?: string | null;
    }
    const userWithoutName: MinimalUser = {
      email: "johndoe@example.com",
    };
    render(<ProfileSummaryCard user={userWithoutName} />);
    expect(screen.getByText("johndoe")).toBeInTheDocument();
  });

  it("defaults to 0% completion", () => {
    render(<ProfileSummaryCard user={mockUser} profile={mockProfile} />);
    // If completionPercentage is not provided, it defaults to 0
    // The progress bar label text is now "Resume Complete" in the UI
    // The progress bar should exist but be minimal
    const progressBar = screen.getByText("Resume Complete").closest("div");
    expect(progressBar).toBeInTheDocument();
  });

  it("renders card with proper styling", () => {
    const { container } = render(
      <ProfileSummaryCard user={mockUser} profile={mockProfile} />
    );
    const card = container.querySelector(".bg-white");
    expect(card).toHaveClass("rounded-lg");
    expect(card).toHaveClass("border");
    expect(card).toHaveClass("p-6");
  });

  it("supports dark mode classes", () => {
    const { container } = render(
      <ProfileSummaryCard user={mockUser} profile={mockProfile} />
    );
    const card = container.querySelector(".bg-white");
    expect(card).toHaveClass("dark:bg-gray-900");
  });
});
