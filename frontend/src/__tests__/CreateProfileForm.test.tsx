import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Profile } from "@/services/profileService";
import CreateProfileForm from "../components/profile/CreateProfileForm";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

jest.mock("sonner", () => {
  const toast = {
    loading: jest.fn().mockReturnValue("toast-id"),
    success: jest.fn(),
    error: jest.fn(),
  };
  return { __esModule: true, toast };
});

import { toast } from "sonner";

const createProfileMock = jest.fn();

jest.mock("@/services/profileService", () => ({
  __esModule: true,
  default: {
    createProfile: (...args: unknown[]) => createProfileMock(...args),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    uploadAvatar: jest.fn(),
  },
}));

const renderForm = (props?: Partial<React.ComponentProps<typeof CreateProfileForm>>) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateProfileForm {...props} />
    </QueryClientProvider>
  );
};

describe("CreateProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows validation errors", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByTestId("submit-profile"));

    expect(await screen.findByText("Headline must be at least 2 chars")).toBeInTheDocument();
    expect(screen.getByText("Summary must be at least 2 chars")).toBeInTheDocument();
  });

  it("submits successfully and redirects", async () => {
    const user = userEvent.setup();
    const handleSuccess = jest.fn();
    const profile: Profile = {
      id: 1,
      headline: "Jane Doe",
      summary: "A short bio.",
    };

    createProfileMock.mockResolvedValue(profile);

    renderForm({ onSuccess: handleSuccess });

    await user.type(screen.getByTestId("headline"), profile.headline);
    await user.type(screen.getByTestId("summary"), profile.summary);
    await user.click(screen.getByTestId("submit-profile"));

    await waitFor(() => {
      expect(createProfileMock).toHaveBeenCalledWith({
        headline: profile.headline,
        summary: profile.summary,
        avatar: null,
      });
      expect(handleSuccess).toHaveBeenCalledWith(profile);
      expect(replaceMock).toHaveBeenCalledWith("/profile");
      expect(toast.success).toHaveBeenCalledWith("Profile created", { id: "toast-id" });
      expect(screen.getByTestId("profile-success")).toHaveTextContent(
        `Profile created for ${profile.headline}`
      );
    });
  });

  it("surfaces API errors", async () => {
    const user = userEvent.setup();
    createProfileMock.mockRejectedValue({ detail: "Server is on fire" });

    renderForm();

    await user.type(screen.getByTestId("headline"), "Error User");
    await user.type(screen.getByTestId("summary"), "Oops");
    await user.click(screen.getByTestId("submit-profile"));

    await waitFor(() => {
      expect(toast.loading).toHaveBeenCalledWith("Creating profile Error User...");
      expect(toast.error).toHaveBeenCalledWith("Server is on fire", { id: "toast-id" });
      expect(replaceMock).not.toHaveBeenCalled();
    });
  });
});
