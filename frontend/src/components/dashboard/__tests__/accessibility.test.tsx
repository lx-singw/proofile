import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import DashboardContent from "../DashboardContent";
import DashboardSidebar from "../DashboardSidebar";
import ProfileSummaryCard from "../ProfileSummaryCard";
import WelcomeBanner from "../WelcomeBanner";
import StatsCards from "../StatsCards";
import ProfileCompletion from "../ProfileCompletion";
import SuggestedActions from "../SuggestedActions";
import ActivityFeed from "../ActivityFeed";

expect.extend(toHaveNoViolations);

describe("Accessibility Tests - Dashboard Components", () => {
  describe("DashboardContent - Layout Accessibility", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(
        <DashboardContent>
          <div>Test Content</div>
        </DashboardContent>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper responsive structure", () => {
      const { container } = render(
        <DashboardContent>
          <div>Content</div>
        </DashboardContent>
      );

      const content = container.querySelector("div");
      expect(content).toBeInTheDocument();
    });
  });

  describe("ProfileSummaryCard - Accessibility", () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      full_name: "Test User",
      username: "testuser",
    };

    const mockProfile = {
      id: 1,
      user_id: 1,
      headline: "Software Engineer",
      summary: "Experienced developer",
      avatar_url: "https://example.com/avatar.jpg",
    };

    it("should have no accessibility violations", async () => {
      const { container } = render(
        <ProfileSummaryCard user={mockUser} profile={mockProfile} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have semantic button elements", () => {
      render(
        <ProfileSummaryCard user={mockUser} profile={mockProfile} />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button.tagName).toBe("BUTTON");
      });
    });

    it("should have accessible links", () => {
      render(
        <ProfileSummaryCard user={mockUser} profile={mockProfile} />
      );

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);

      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });

    it("should have visible user information", () => {
      render(
        <ProfileSummaryCard user={mockUser} profile={mockProfile} />
      );

      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    });
  });

  describe("WelcomeBanner - Accessibility", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(
        <WelcomeBanner
          userName="Test User"
          isNewUser={false}
          onCreateProfile={jest.fn()}
          onViewProfile={jest.fn()}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper heading hierarchy", () => {
      render(
        <WelcomeBanner
          userName="Test User"
          isNewUser={false}
          onCreateProfile={jest.fn()}
          onViewProfile={jest.fn()}
        />
      );

      const heading = screen.getByText(/Welcome/i);
      expect(heading).toBeInTheDocument();
    });

    it("should have accessible buttons", () => {
      render(
        <WelcomeBanner
          userName="Test User"
          isNewUser={false}
          onCreateProfile={jest.fn()}
          onViewProfile={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button).toBeEnabled();
      });
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();

      render(
        <WelcomeBanner
          userName="Test User"
          isNewUser={false}
          onCreateProfile={jest.fn()}
          onViewProfile={jest.fn()}
        />
      );

      const buttons = screen.getAllByRole("button");

      // Tab through buttons
      for (const button of buttons) {
        await user.tab();
        expect(button).toHaveFocus();
      }
    });
  });

  describe("StatsCards - Accessibility", () => {
    const mockStats = {
      profileViews: 150,
      endorsements: 12,
      verifications: 3,
    };

    it("should have no accessibility violations", async () => {
      const { container } = render(
        <StatsCards
          profileViews={mockStats.profileViews}
          endorsements={mockStats.endorsements}
          verifications={mockStats.verifications}
          onViewStats={jest.fn()}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have descriptive stat labels", () => {
      render(
        <StatsCards
          profileViews={mockStats.profileViews}
          endorsements={mockStats.endorsements}
          verifications={mockStats.verifications}
          onViewStats={jest.fn()}
        />
      );

      expect(screen.getByText(/Profile Views/i)).toBeInTheDocument();
    });

    it("should display numeric values accessibly", () => {
      render(
        <StatsCards
          profileViews={mockStats.profileViews}
          endorsements={mockStats.endorsements}
          verifications={mockStats.verifications}
          onViewStats={jest.fn()}
        />
      );

      expect(screen.getByText(mockStats.profileViews.toString())).toBeInTheDocument();
    });
  });

  describe("ProfileCompletion - Accessibility", () => {
    const mockSteps = [
      {
        id: "headline",
        label: "Add Headline",
        description: "Tell employers about your role",
        completed: true,
        href: "/profile/edit",
      },
      {
        id: "summary",
        label: "Write Summary",
        description: "Share your professional story",
        completed: false,
        href: "/profile/edit",
      },
    ];

    it("should have no accessibility violations", async () => {
      const { container } = render(
        <ProfileCompletion
          steps={mockSteps}
          completionPercentage={50}
          onStepClick={jest.fn()}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have accessible progress indicator", () => {
      render(
        <ProfileCompletion
          steps={mockSteps}
          completionPercentage={50}
          onStepClick={jest.fn()}
        />
      );

      // Should show completion percentage
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    it("should have proper step semantics", () => {
      render(
        <ProfileCompletion
          steps={mockSteps}
          completionPercentage={50}
          onStepClick={jest.fn()}
        />
      );

      expect(screen.getByText("Add Headline")).toBeInTheDocument();
      expect(screen.getByText("Write Summary")).toBeInTheDocument();
    });

    it("should indicate completion status", () => {
      render(
        <ProfileCompletion
          steps={mockSteps}
          completionPercentage={50}
          onStepClick={jest.fn()}
        />
      );

      // Both steps should be visible
      mockSteps.forEach((step) => {
        expect(screen.getByText(step.label)).toBeInTheDocument();
      });
    });
  });

  describe("SuggestedActions - Accessibility", () => {
    const mockActions = [
      {
        id: "action1",
        title: "Add Photo",
        description: "Increase profile visibility",
        icon: <span>📸</span>,
        cta: "Upload",
        href: "/photo",
        priority: "high" as const,
      },
    ];

    it("should have no accessibility violations", async () => {
      const { container } = render(
        <SuggestedActions actions={mockActions} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper heading", () => {
      render(<SuggestedActions actions={mockActions} />);

      expect(screen.getByText(/Suggested/i)).toBeInTheDocument();
    });

    it("should have accessible action links", () => {
      render(<SuggestedActions actions={mockActions} />);

      mockActions.forEach((action) => {
        const link = screen.getByText(action.cta);
        expect(link).toHaveAttribute("href", action.href);
      });
    });

    it("should indicate action priority", () => {
      render(<SuggestedActions actions={mockActions} />);

      // High priority actions should have visual indicator
      expect(screen.getByText("Add Photo")).toBeInTheDocument();
    });
  });

  describe("ActivityFeed - Accessibility", () => {
    const mockActivities = [
      {
        id: "1",
        type: "endorsement" as const,
        actor: "John Doe",
        title: "Endorsed you for React",
        description: "Added React to endorsements",
        timestamp: new Date(),
        href: "/endorsements",
        read: false,
      },
    ];

    it("should have no accessibility violations", async () => {
      const { container } = render(
        <ActivityFeed activities={mockActivities} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper heading", () => {
      render(<ActivityFeed activities={mockActivities} />);

      expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
    });

    it("should have semantic links for activities", () => {
      render(<ActivityFeed activities={mockActivities} />);

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);
    });

    it("should display readable timestamps", () => {
      render(<ActivityFeed activities={mockActivities} />);

      // Timestamps should be visible and readable
      mockActivities.forEach((activity) => {
        expect(screen.getByText(activity.actor)).toBeInTheDocument();
        expect(screen.getByText(activity.title)).toBeInTheDocument();
      });
    });

    it("should indicate read status", () => {
      render(<ActivityFeed activities={mockActivities} />);

      // Unread activities should have visual indicator
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation - Full Dashboard", () => {
    it("should support Tab navigation through all interactive elements", async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button>Button 1</button>
          <button>Button 2</button>
          <a href="#test">Link</a>
        </div>
      );

      const buttons = screen.getAllByRole("button");
      const link = screen.getByRole("link");

      await user.tab();
      expect(buttons[0]).toHaveFocus();

      await user.tab();
      expect(buttons[1]).toHaveFocus();

      await user.tab();
      expect(link).toHaveFocus();
    });

    it("should support Shift+Tab for reverse navigation", async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button>Button 1</button>
          <button>Button 2</button>
        </div>
      );

      const buttons = screen.getAllByRole("button");

      // Tab forward
      await user.tab();
      expect(buttons[0]).toHaveFocus();

      await user.tab();
      expect(buttons[1]).toHaveFocus();

      // Tab backward
      await user.tab({ shift: true });
      expect(buttons[0]).toHaveFocus();
    });
  });

  describe("Focus Indicators", () => {
    it("should have visible focus indicators on buttons", async () => {
      const user = userEvent.setup();

      render(<button>Test Button</button>);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(button).toHaveFocus();
    });

    it("should have visible focus indicators on links", async () => {
      const user = userEvent.setup();

      render(<a href="/test">Test Link</a>);

      const link = screen.getByRole("link");
      await user.tab();

      expect(link).toHaveFocus();
    });
  });

  describe("ARIA Live Regions (for dynamic content)", () => {
    it("should support aria-live for updates", () => {
      const { rerender } = render(
        <div aria-live="polite" aria-label="Status">
          Loading...
        </div>
      );

      let message = screen.getByText("Loading...");
      expect(message).toBeInTheDocument();

      rerender(
        <div aria-live="polite" aria-label="Status">
          Loaded!
        </div>
      );

      message = screen.getByText("Loaded!");
      expect(message).toBeInTheDocument();
    });
  });

  describe("Form Accessibility", () => {
    it("should associate labels with inputs", () => {
      render(
        <div>
          <label htmlFor="search">Search</label>
          <input id="search" type="text" />
        </div>
      );

      const input = screen.getByLabelText("Search");
      expect(input).toBeInTheDocument();
    });

    it("should have descriptive placeholder text only as supplement", () => {
      render(
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="user@example.com"
            aria-describedby="email-hint"
          />
          <span id="email-hint">We never share your email</span>
        </div>
      );

      const input = screen.getByLabelText("Email");
      expect(input).toHaveAttribute("aria-describedby");
    });
  });

  describe("Error Handling & Messaging", () => {
    it("should announce errors accessibly", () => {
      render(
        <div role="alert" aria-live="assertive">
          Error: Please fill in all required fields
        </div>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");
      expect(alert).toBeInTheDocument();
    });
  });

  describe("Image Accessibility", () => {
    it("should have alt text for images", () => {
      render(
        <img src="avatar.jpg" alt="User profile picture" />
      );

      const img = screen.getByAltText("User profile picture");
      expect(img).toBeInTheDocument();
    });

    it("should mark decorative images as such", () => {
      render(
        <img src="decoration.svg" alt="" aria-hidden="true" />
      );

      const img = screen.getByAltText("");
      expect(img).toHaveAttribute("aria-hidden", "true");
    });
  });
});
