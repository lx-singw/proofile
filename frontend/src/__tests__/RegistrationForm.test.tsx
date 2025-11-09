import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import RegistrationForm, { registrationSchema } from "@/components/auth/RegistrationForm";
import { useAuth } from "@/hooks/useAuth";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

const toastMock = toast as jest.Mocked<typeof toast>;

describe("RegistrationForm", () => {
  const registerMock = jest.fn();
  const loginMock = jest.fn();
  const logoutMock = jest.fn();
  const refreshMock = jest.fn();
  const useAuthMock = useAuth as jest.MockedFunction<typeof useAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
    registerMock.mockReset();
    loginMock.mockReset();
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
    (window as unknown as { dataLayer?: { push?: jest.Mock } }).dataLayer = { push: jest.fn() };
  });

  afterEach(() => {
    delete (window as { dataLayer?: unknown }).dataLayer;
  });

  it("submits valid data", async () => {
    registerMock.mockResolvedValueOnce(undefined);

    render(<RegistrationForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "newuser@example.com");
    await user.type(screen.getByLabelText("Full name"), "New User");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        email: "newuser@example.com",
        full_name: "New User",
        password: "Password123!",
      });
    });
  expect(toastMock.success).toHaveBeenCalledWith("Account created. Please log in.");
  });

  it("prevents submit when validation fails", async () => {
    render(<RegistrationForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "invalid");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("shows field errors returned by the API", async () => {
    registerMock.mockRejectedValueOnce({
      errors: { email: ["Email already exists"] },
    });

    render(<RegistrationForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "duplicate@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/email already exists/i)).toBeInTheDocument();
  expect(toastMock.error).not.toHaveBeenCalled();
  });

  it("surfaces backend detail messages in toast", async () => {
    const detailMessage = "A user with this email already exists.";
    registerMock.mockRejectedValueOnce({ detail: detailMessage });

    render(<RegistrationForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "fail@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(toastMock.error).toHaveBeenCalledWith(detailMessage);
      });
  });
});

describe("registrationSchema", () => {
  it("rejects passwords missing uppercase characters", () => {
    const result = registrationSchema.safeParse({
      email: "check@example.com",
      password: "password123!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("uppercase"))).toBe(true);
    }
  });

  it("accepts valid credentials", () => {
    const result = registrationSchema.safeParse({
      email: "ok@example.com",
      password: "ValidPass123!",
    });

    expect(result.success).toBe(true);
  });
});
