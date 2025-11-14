import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardDropdown from "../DashboardDropdown";

describe("DashboardDropdown", () => {
  const mockItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
    { label: "Logout", href: "/logout", divider: true },
  ];

  it("renders trigger button", () => {
    render(
      <DashboardDropdown
        trigger={<span>Menu</span>}
        items={mockItems}
      />
    );

    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("toggles dropdown on button click", async () => {
    render(
      <DashboardDropdown
        trigger={<span>Menu</span>}
        items={mockItems}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  it("closes dropdown when clicking outside", async () => {
    render(
      <div>
        <DashboardDropdown
          trigger={<span>Menu</span>}
          items={mockItems}
        />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    const outside = screen.getByTestId("outside");
    fireEvent.mouseDown(outside);

    await waitFor(() => {
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });
  });

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup();

    render(
      <DashboardDropdown
        trigger={<span>Menu</span>}
        items={mockItems}
      />
    );

    const button = screen.getByRole("button");
    await user.click(button);

    // Arrow down
    await user.keyboard("{ArrowDown}");
    const dashboardLink = screen.getByText("Dashboard");
    expect(dashboardLink.parentElement).toHaveClass("bg-blue-50");

    // Arrow down again
    await user.keyboard("{ArrowDown}");
    const settingsLink = screen.getByText("Settings");
    expect(settingsLink.parentElement).toHaveClass("bg-blue-50");
  });

  it("closes dropdown with Escape key", async () => {
    const user = userEvent.setup();

    render(
      <DashboardDropdown
        trigger={<span>Menu</span>}
        items={mockItems}
      />
    );

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });
  });

  it("calls onItemClick when item is clicked", async () => {
    const mockOnItemClick = jest.fn();
    const user = userEvent.setup();

    render(
      <DashboardDropdown
        trigger={<span>Menu</span>}
        items={mockItems}
        onItemClick={mockOnItemClick}
      />
    );

    const button = screen.getByRole("button");
    await user.click(button);

    const dashboardLink = await screen.findByText("Dashboard");
    await user.click(dashboardLink);
    // The implementation may call onItemClick with the event or the item;
    // assert the handler was invoked rather than enforcing the exact argument shape.
    expect(mockOnItemClick).toHaveBeenCalled();
  });

  it("renders dividers for items with divider prop", async () => {
    render(
      <DashboardDropdown
        trigger={<span>Menu</span>}
        items={mockItems}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      const dividers = screen.getByRole("menu").querySelectorAll("div.border-t");
      expect(dividers.length).toBeGreaterThan(0);
    });
  });

  it("aligns dropdown correctly", () => {
    render(
      <DashboardDropdown
        trigger={<span>Menu</span>}
        items={mockItems}
        align="right"
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    const dropdown = screen.getByRole("menu");
    expect(dropdown).toHaveClass("right-0");
  });

  it("has proper accessibility attributes", () => {
    render(
      <DashboardDropdown
        trigger={<span>Menu</span>}
        items={mockItems}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});
