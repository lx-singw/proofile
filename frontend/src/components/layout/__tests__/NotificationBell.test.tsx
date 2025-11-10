import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NotificationBell from "../NotificationBell";

describe("NotificationBell", () => {
  it("renders bell icon", () => {
    render(<NotificationBell />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("displays unread count badge", () => {
    render(<NotificationBell unreadCount={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("displays 99+ when count exceeds 99", () => {
    render(<NotificationBell unreadCount={150} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("does not show badge when unreadCount is 0", () => {
    render(<NotificationBell unreadCount={0} />);
    // Badge should not be present when count is 0
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("calls onClick callback when clicked", () => {
    const mockOnClick = jest.fn();
    render(<NotificationBell onClick={mockOnClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it("has correct aria-label", () => {
    render(<NotificationBell unreadCount={5} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Notifications (5 unread)");
  });

  it("has correct aria-label when no unread notifications", () => {
    render(<NotificationBell unreadCount={0} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Notifications");
  });

  it("has aria-haspopup attribute", () => {
    render(<NotificationBell />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-haspopup", "true");
  });

  it("shows pulse animation when notifications exist", () => {
    const { container } = render(<NotificationBell unreadCount={1} />);
    const pulse = container.querySelector(".animate-pulse");
    expect(pulse).toBeInTheDocument();
  });

  it("displays badge with red background", () => {
    const { container } = render(<NotificationBell unreadCount={2} />);
    const badge = container.querySelector(".bg-red-600");
    expect(badge).toBeInTheDocument();
  });

  it("updates when unreadCount prop changes", () => {
    const { rerender } = render(<NotificationBell unreadCount={1} />);
    expect(screen.getByText("1")).toBeInTheDocument();

    rerender(<NotificationBell unreadCount={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
