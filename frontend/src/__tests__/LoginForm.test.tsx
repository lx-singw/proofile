import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm, { loginSchema } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

describe("LoginForm", () => {
  const loginMock = jest.fn();
  const registerMock = jest.fn();
  const logoutMock = jest.fn();
  const refreshMock = jest.fn();
  const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
    loginMock.mockReset();
    registerMock.mockReset();
    logoutMock.mockReset();
    refreshMock.mockReset();

    useAuthMock.mockReturnValue({
      user: null,
      loading: false,
      login: loginMock,
      register: registerMock,
      logout: logoutMock,
      refresh: refreshMock,
    });
  });

  it("submits valid credentials", async () => {
    loginMock.mockResolvedValueOnce(undefined);

    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        username: "user@example.com",
        password: "Password123!",
      });
    });
  });

  it("blocks submission when validation fails", async () => {
    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "invalid");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("maps server field errors", async () => {
    loginMock.mockRejectedValueOnce({
      errors: { username: ["Account disabled"] },
    });

    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/account disabled/i)).toBeInTheDocument();
  });

  it("shows generic error for other failures", async () => {
    loginMock.mockRejectedValueOnce(new Error("Network error"));

    render(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    const errors = await screen.findAllByText(/invalid email or password/i);
    expect(errors).toHaveLength(2);
  });
});

describe("loginSchema", () => {
  it("requires a password", () => {
    const result = loginSchema.safeParse({
      username: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("password"))).toBe(true);
    }
  });

  it("accepts valid values", () => {
    const result = loginSchema.safeParse({
      username: "user@example.com",
      password: "Password123!",
    });

    expect(result.success).toBe(true);
  });
});
