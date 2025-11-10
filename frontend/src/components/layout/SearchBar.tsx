"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * SearchBar
 * 
 * Search input component with keyboard shortcut support.
 * Features:
 * - Cmd/Ctrl + K shortcut to focus
 * - Visual shortcut hint
 * - Clear button
 * - Responsive design
 */
export default function SearchBar({
  onSearch,
  placeholder = "Search...",
  onFocus,
  onBlur,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isShortcutVisible, setIsShortcutVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle Cmd/Ctrl + K shortcut
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const shortcutKey = isMac ? event.metaKey : event.ctrlKey;

      if (shortcutKey && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch?.("");
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsShortcutVisible(false);
    onFocus?.();
  };

  const handleBlur = () => {
    if (!query) {
      setIsShortcutVisible(true);
    }
    onBlur?.();
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        {/* Search Icon */}
        <Search className="absolute left-3 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-2 rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400 transition-colors"
          aria-label="Search"
        />

        {/* Keyboard Shortcut Hint or Clear Button */}
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : isShortcutVisible ? (
          <div className="absolute right-3 hidden sm:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 pointer-events-none">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
              {/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘" : "Ctrl"}
            </kbd>
            <span>K</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
