"use client";

import React, { useRef, useEffect, useState } from "react";

interface DashboardDropdownItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  divider?: boolean;
}

interface DashboardDropdownProps {
  trigger: React.ReactNode;
  items: DashboardDropdownItem[];
  align?: "left" | "right";
  className?: string;
  onItemClick?: (item: DashboardDropdownItem) => void;
}

/**
 * DashboardDropdown
 * 
 * Reusable dropdown component for navigation menus.
 * Features:
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Click outside to close
 * - Accessible (ARIA labels, role attributes)
 * - Mobile-friendly
 */
export default function DashboardDropdown({
  trigger,
  items,
  align = "left",
  className = "",
  onItemClick,
}: DashboardDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;
        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0 && items[highlightedIndex]) {
            const item = items[highlightedIndex];
            onItemClick?.(item);
            window.location.href = item.href;
            setIsOpen(false);
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        default:
          break;
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, highlightedIndex, items, onItemClick]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setHighlightedIndex(-1);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={toggleDropdown}
        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          <div className="py-1">
            {items.map((item, index) => (
              <React.Fragment key={`${item.label}-${index}`}>
                {item.divider && (
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                )}
                <a
                  href={item.href}
                  className={`block px-4 py-2 text-sm ${
                    highlightedIndex === index
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  } transition-colors flex items-center gap-2`}
                  role="menuitem"
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => {
                    onItemClick?.(item);
                    setIsOpen(false);
                  }}
                >
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  <span>{item.label}</span>
                </a>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
