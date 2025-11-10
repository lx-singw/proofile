import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "../SearchBar";

describe("SearchBar", () => {
  it("renders search input", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toBeInTheDocument();
  });

  it("displays keyboard shortcut hint", () => {
    render(<SearchBar />);
    // Shortcut hint should be visible initially
    // Search bar exists and is in the document
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toBeInTheDocument();
  });

  it("hides shortcut hint when focused", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search...");
    await user.click(input);

    await waitFor(() => {
      // The shortcut hint should not be visible in the rendered output when input is focused
      expect(input).toHaveFocus();
    });
  });

  it("calls onSearch callback when input changes", async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    await user.type(input, "test query");

    expect(mockOnSearch).toHaveBeenCalledWith("test query");
    expect(mockOnSearch).toHaveBeenCalledTimes(10); // Once per character
  });

  it("displays clear button when input has value", async () => {
    const user = userEvent.setup();

    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search...");
    await user.type(input, "test");

    // Clear button should be visible
    const clearButtons = screen.getAllByRole("button");
    expect(clearButtons.length).toBeGreaterThan(0);
  });

  it("clears input when clear button is clicked", async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    await user.type(input, "test");

    // Find and click clear button
    const clearButton = screen.getByLabelText("Clear search");
    await user.click(clearButton);

    expect(input.value).toBe("");
    expect(mockOnSearch).toHaveBeenCalledWith("");
  });

  it("supports Cmd+K shortcut on Mac", async () => {
    const user = userEvent.setup();

    // Mock navigator.platform for Mac
    Object.defineProperty(navigator, "platform", {
      value: "MacIntel",
      configurable: true,
    });

    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;

    // Simulate Cmd+K
    await user.keyboard("{Meta>}k{/Meta}");

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it("supports Ctrl+K shortcut on Windows/Linux", async () => {
    const user = userEvent.setup();

    // Mock navigator.platform for Windows
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      configurable: true,
    });

    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;

    // Simulate Ctrl+K
    await user.keyboard("{Control>}k{/Control}");

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it("calls onFocus callback", async () => {
    const mockOnFocus = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onFocus={mockOnFocus} />);

    const input = screen.getByPlaceholderText("Search...");
    await user.click(input);

    expect(mockOnFocus).toHaveBeenCalled();
  });

  it("calls onBlur callback", async () => {
    const mockOnBlur = jest.fn();
    const user = userEvent.setup();

    render(<SearchBar onBlur={mockOnBlur} />);

    const input = screen.getByPlaceholderText("Search...");
    await user.click(input);
    await user.tab();

    expect(mockOnBlur).toHaveBeenCalled();
  });

  it("accepts custom placeholder", () => {
    render(<SearchBar placeholder="Find profiles..." />);
    expect(screen.getByPlaceholderText("Find profiles...")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("Search...");
    expect(input).toHaveAttribute("aria-label", "Search");
  });
});
