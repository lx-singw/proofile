import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WelcomeBanner from "../WelcomeBanner";

describe("WelcomeBanner", () => {
  it("renders welcome message for new users", () => {
    render(
      <WelcomeBanner
        userName="Alice"
        isNewUser={true}
        onCreateProfile={jest.fn()}
        onViewProfile={jest.fn()}
      />
    );

    expect(screen.getByText(/Welcome to Proofile/i)).toBeInTheDocument();
  });

  it("renders welcome back message for returning users", () => {
    render(
      <WelcomeBanner
        userName="Bob"
        isNewUser={false}
        onCreateProfile={jest.fn()}
        onViewProfile={jest.fn()}
      />
    );

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  it("displays user name in greeting", () => {
    render(
      <WelcomeBanner
        userName="Charlie"
        isNewUser={true}
        onCreateProfile={jest.fn()}
        onViewProfile={jest.fn()}
      />
    );

    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
  });

  it("renders create profile button for new users", () => {
    render(
      <WelcomeBanner
        userName="Diana"
        isNewUser={true}
        onCreateProfile={jest.fn()}
        onViewProfile={jest.fn()}
      />
    );

    // Primary action is a link in the UI; match by link role and visible text
    const createLink = screen.getByRole("link", {
      name: /Create professional profile/i,
    });
    expect(createLink).toBeInTheDocument();
  });

  it("renders view profile button", () => {
    render(
      <WelcomeBanner
        userName="Eve"
        isNewUser={false}
        onCreateProfile={jest.fn()}
        onViewProfile={jest.fn()}
      />
    );

    const viewLink = screen.getByRole("link", {
      name: /View profile/i,
    });
    expect(viewLink).toBeInTheDocument();
  });

  it("calls onCreateProfile when create profile button is clicked", () => {
    const onCreateProfile = jest.fn();
    render(
      <WelcomeBanner
        userName="Frank"
        isNewUser={true}
        onCreateProfile={onCreateProfile}
        onViewProfile={jest.fn()}
      />
    );

    const createLink = screen.getByRole("link", {
      name: /Create professional profile/i,
    });
    fireEvent.click(createLink);

    // The component forwards clicks to the provided handler via Link.onClick
    expect(onCreateProfile).toHaveBeenCalledTimes(1);
  });

  it("calls onViewProfile when view profile button is clicked", () => {
    const onViewProfile = jest.fn();
    render(
      <WelcomeBanner
        userName="Grace"
        isNewUser={false}
        onCreateProfile={jest.fn()}
        onViewProfile={onViewProfile}
      />
    );

    const viewLink = screen.getByRole("link", {
      name: /View profile/i,
    });
    fireEvent.click(viewLink);

    expect(onViewProfile).toHaveBeenCalledTimes(1);
  });

  it("applies dark mode classes correctly", () => {
    const { container } = render(
      <WelcomeBanner
        userName="Henry"
        isNewUser={true}
        onCreateProfile={jest.fn()}
        onViewProfile={jest.fn()}
      />
    );

    // Check that the banner div has dark mode related classes in its string
    const bannerDiv = container.querySelector("[class*='dark:']");
    expect(bannerDiv).toBeInTheDocument();
  });

  it("renders responsive layout classes", () => {
    const { container } = render(
      <WelcomeBanner
        userName="Ivy"
        isNewUser={true}
        onCreateProfile={jest.fn()}
        onViewProfile={jest.fn()}
      />
    );

    // Check for responsive classes
    const responsive = container.querySelector("[class*='sm:']");
    expect(responsive).toBeInTheDocument();
  });

  it("contains greeting text", () => {
    render(
      <WelcomeBanner
        userName="Jack"
        isNewUser={true}
        onCreateProfile={jest.fn()}
        onViewProfile={jest.fn()}
      />
    );

    // UI copy changed to focus on building a verified resume
    expect(
      screen.getByText(/Create your verified resume in minutes and stand out to employers\./i)
    ).toBeInTheDocument();
  });
});
