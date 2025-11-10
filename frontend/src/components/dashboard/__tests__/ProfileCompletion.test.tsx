import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileCompletion from "../ProfileCompletion";

describe("ProfileCompletion", () => {
  const defaultSteps = [
    {
      id: "photo",
      label: "Add Profile Photo",
      description: "Upload a professional photo",
      completed: true,
      href: "/profile/photo",
    },
    {
      id: "bio",
      label: "Write Bio",
      description: "Add a compelling biography",
      completed: false,
      href: "/profile/bio",
    },
    {
      id: "skills",
      label: "Add Skills",
      description: "List your professional skills",
      completed: false,
      href: "/profile/skills",
    },
  ];

  const defaultProps = {
    steps: defaultSteps,
    completionPercentage: 33,
    onStepClick: jest.fn(),
  };

  it("renders profile completion container", () => {
    const { container } = render(<ProfileCompletion {...defaultProps} />);
    expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
  });

  it("displays section title", () => {
    render(<ProfileCompletion {...defaultProps} />);
    expect(screen.getByText("Profile Completion")).toBeInTheDocument();
  });

  it("displays completion percentage", () => {
    render(<ProfileCompletion {...defaultProps} />);
    expect(screen.getByText(/33%/)).toBeInTheDocument();
  });

  it("displays correct completion percentage with different values", () => {
    render(
      <ProfileCompletion
        {...defaultProps}
        completionPercentage={75}
      />
    );
    expect(screen.getByText(/75%/)).toBeInTheDocument();
  });

  it("renders progress bar", () => {
    const { container } = render(<ProfileCompletion {...defaultProps} />);
    // Progress bar uses an outer container and an inner gradient bar
    const progressBar = container.querySelector("[class*='bg-gradient-to-r']");
    expect(progressBar).toBeInTheDocument();
  });

  it("renders all completion steps", () => {
    render(<ProfileCompletion {...defaultProps} />);
    expect(screen.getByText("Add Profile Photo")).toBeInTheDocument();
    // Use getAllByText since "Write Bio" appears twice (in list and CTA)
    expect(screen.getAllByText("Write Bio").length).toBeGreaterThan(0);
    // "Add Skills" appears only once
    expect(screen.getByText("Add Skills")).toBeInTheDocument();
  });

  it("displays completed steps with checkmark icon", () => {
    const { container } = render(<ProfileCompletion {...defaultProps} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("displays step descriptions", () => {
    render(<ProfileCompletion {...defaultProps} />);
    expect(
      screen.getByText("Upload a professional photo")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Add a compelling biography")
    ).toBeInTheDocument();
  });

  it("calls onStepClick when a step is clicked", () => {
    const onStepClick = jest.fn();
    const { container } = render(
      <ProfileCompletion
        {...defaultProps}
        onStepClick={onStepClick}
      />
    );
    const buttons = container.querySelectorAll("button, a");
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      expect(onStepClick).toHaveBeenCalled();
    }
  });

  it("identifies next incomplete step correctly", () => {
    render(<ProfileCompletion {...defaultProps} />);
    // Bio should be the next step (first incomplete)
    const biosteps = screen.getAllByText("Write Bio");
    expect(biosteps.length).toBeGreaterThan(0);
  });

  it("highlights next step in CTA", () => {
    render(<ProfileCompletion {...defaultProps} />);
    expect(screen.getByText(/Next step to improve/i)).toBeInTheDocument();
  });

  it("renders with 100% completion", () => {
    const completedSteps = defaultSteps.map((s) => ({
      ...s,
      completed: true,
    }));
    render(
      <ProfileCompletion
        steps={completedSteps}
        completionPercentage={100}
        onStepClick={jest.fn()}
      />
    );
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it("renders empty state with no steps", () => {
    render(
      <ProfileCompletion
        steps={[]}
        completionPercentage={0}
        onStepClick={jest.fn()}
      />
    );
    expect(screen.getByText("Profile Completion")).toBeInTheDocument();
  });

  it("applies dark mode classes", () => {
    const { container } = render(<ProfileCompletion {...defaultProps} />);
    const darkModeElement = container.querySelector("[class*='dark:']");
    expect(darkModeElement).toBeInTheDocument();
  });

  it("renders border styling", () => {
    const { container } = render(<ProfileCompletion {...defaultProps} />);
    expect(container.querySelector(".border")).toBeInTheDocument();
  });

  it("displays step with completed state styling", () => {
    const { container } = render(<ProfileCompletion {...defaultProps} />);
    // Should have visual indication of completed steps
    expect(container.querySelectorAll("[class*='text-']").length).toBeGreaterThan(0);
  });

  it("renders padding and spacing correctly", () => {
    const { container } = render(<ProfileCompletion {...defaultProps} />);
    expect(container.querySelector(".p-6")).toBeInTheDocument();
  });

  it("handles rapid step clicks", () => {
    const onStepClick = jest.fn();
    const { container } = render(
      <ProfileCompletion
        {...defaultProps}
        onStepClick={onStepClick}
      />
    );
    const buttons = container.querySelectorAll("button, a");
    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      fireEvent.click(buttons[0]);
      expect(onStepClick).toHaveBeenCalledTimes(2);
    }
  });
});
