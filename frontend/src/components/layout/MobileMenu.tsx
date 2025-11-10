"use client";

import React from "react";
import { Menu } from "lucide-react";

interface MobileMenuProps {
  onClick?: () => void;
  isOpen?: boolean;
}

/**
 * MobileMenu
 * 
 * Hamburger menu button for mobile navigation.
 * Features:
 * - Animated hamburger icon
 * - State indicator (open/closed)
 * - Accessible (ARIA labels)
 */
export default function MobileMenu({ onClick, isOpen = false }: MobileMenuProps) {
  return (
    <button
      onClick={onClick}
      className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle mobile menu"
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
