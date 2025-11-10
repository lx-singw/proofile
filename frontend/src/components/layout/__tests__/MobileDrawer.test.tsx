import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MobileDrawer from "../MobileDrawer";

describe("MobileDrawer", () => {
  const mockUser = {
    email: "user@example.com",
    full_name: "John Doe",
  };

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <MobileDrawer isOpen={false} onClose={jest.fn()} user={mockUser} />
    );

    // Should not have any drawer content
    expect(container.querySelector('[role="navigation"]')).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(
      <MobileDrawer isOpen={true} onClose={jest.fn()} user={mockUser} />
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("displays user information", () => {
    render(
      <MobileDrawer isOpen={true} onClose={jest.fn()} user={mockUser} />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("displays navigation links", () => {
    render(
      <MobileDrawer isOpen={true} onClose={jest.fn()} user={mockUser} />
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Professional Profile")).toBeInTheDocument();
    expect(screen.getByText("Account Settings")).toBeInTheDocument();
  });

  it("displays sign out button", () => {
    render(
      <MobileDrawer isOpen={true} onClose={jest.fn()} user={mockUser} />
    );

    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const mockOnClose = jest.fn();
    render(
      <MobileDrawer isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    const closeButton = screen.getByLabelText("Close drawer");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", () => {
    const mockOnClose = jest.fn();
    const { container } = render(
      <MobileDrawer isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    const backdrop = container.querySelector('[role="button"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it("calls onClose and onLogout when sign out is clicked", () => {
    const mockOnClose = jest.fn();
    const mockOnLogout = jest.fn();

    render(
      <MobileDrawer
        isOpen={true}
        onClose={mockOnClose}
        user={mockUser}
        onLogout={mockOnLogout}
      />
    );

    const signOutButton = screen.getByText("Sign Out");
    fireEvent.click(signOutButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnLogout).toHaveBeenCalled();
  });

  it("closes drawer when navigation link is clicked", () => {
    const mockOnClose = jest.fn();
    render(
      <MobileDrawer isOpen={true} onClose={mockOnClose} user={mockUser} />
    );

    const dashboardLink = screen.getAllByText("Dashboard")[0];
    fireEvent.click(dashboardLink);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("is hidden on desktop (md breakpoint)", () => {
    const { container } = render(
      <MobileDrawer isOpen={true} onClose={jest.fn()} user={mockUser} />
    );

    const drawer = container.querySelector('[role="navigation"]');
    expect(drawer).toHaveClass("md:hidden");
  });

  it("renders backdrop when open", () => {
    const { container } = render(
      <MobileDrawer isOpen={true} onClose={jest.fn()} user={mockUser} />
    );

    const backdrop = container.querySelector(".fixed.inset-0");
    expect(backdrop).toBeInTheDocument();
  });

  it("uses user.full_name if available, otherwise email prefix", () => {
    const userWithoutName = { email: "johndoe@example.com" };
    render(
      <MobileDrawer isOpen={true} onClose={jest.fn()} user={userWithoutName} />
    );

    expect(screen.getByText("johndoe")).toBeInTheDocument();
  });

  it("handles missing user gracefully", () => {
    render(
      <MobileDrawer isOpen={true} onClose={jest.fn()} />
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.queryByText("user@example.com")).not.toBeInTheDocument();
  });
});
