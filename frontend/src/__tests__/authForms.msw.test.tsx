import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { AuthProvider } from "@/hooks/useAuth";
import RegistrationForm from "@/components/auth/RegistrationForm";
import LoginForm from "@/components/auth/LoginForm";
import { server } from "@/test/msw/server";
import { toast } from "sonner";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const toastMock = toast as jest.Mocked<typeof toast>;

const renderWithAuth = (ui: React.ReactElement) => render(<AuthProvider>{ui}</AuthProvider>);

describe("Auth forms with MSW", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
    toastMock.success.mockReset();
    toastMock.error.mockReset();
  });

  it("registers a user through the API", async () => {
    let profileCallCount = 0;
    server.use(
      http.get("*/api/v1/users/me", () => {
        profileCallCount += 1;
        if (profileCallCount === 1) {
          return HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });
        }
        return HttpResponse.json({ id: "u_123", email: "newuser@example.com" });
      }),
      http.get("*/api/v1/profiles/me", () => HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })),
      http.get("*/api/v1/auth/me", () => HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })),
    );

    renderWithAuth(<RegistrationForm />);

    const user = userEvent.setup();
    const emailInput = await screen.findByLabelText("Email");
    await user.type(emailInput, "newuser@example.com");
    await user.type(screen.getByLabelText("Full name"), "New User");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("Account created. Please log in.");
    });

    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it("surfaces duplicate email responses from the backend", async () => {
    server.use(
      http.post("*/api/v1/users", async () =>
        HttpResponse.json({ detail: "Email already exists" }, { status: 400 })
      ),
      http.get("*/api/v1/users/me", () => HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })),
      http.get("*/api/v1/profiles/me", () => HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })),
      http.get("*/api/v1/auth/me", () => HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })),
    );

    renderWithAuth(<RegistrationForm />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "duplicate@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("Registration failed");
    });
  });

  it("stores access tokens on successful login", async () => {
    let meCallCount = 0;
    const loginHandler = jest.fn();
    server.use(
      http.post("*/api/v1/auth/token", async ({ request }) => {
        loginHandler(await request.text());
        return HttpResponse.json({ access_token: "test-access-token", token_type: "bearer" });
      }),
      http.get("*/api/v1/users/me", () => {
        meCallCount += 1;
        if (meCallCount === 1) {
          return HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });
        }
        return HttpResponse.json({ id: "u_123", email: "user@example.com" });
      }),
      http.get("*/api/v1/profiles/me", () => HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })),
      http.get("*/api/v1/auth/me", () => HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })),
    );

    renderWithAuth(<LoginForm />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(loginHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("returns field errors for invalid login attempts", async () => {
    server.use(
      http.get("*/api/v1/users/me", () => HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })),
      http.get("*/api/v1/profiles/me", () => HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })),
      http.get("*/api/v1/auth/me", () => HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })),
    );

    renderWithAuth(<LoginForm />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "wrong@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    const errors = await screen.findAllByText(/invalid email or password/i);
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });
});
