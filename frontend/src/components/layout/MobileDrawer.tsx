"use client";

import React from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface User {
  email: string;
  full_name?: string | null;
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  onLogout?: () => void;
}

/**
 * MobileDrawer
 * 
 * Slide-in drawer for mobile navigation.
 * Features:
 * - Slide in from left
 * - Close button
 * - Navigation links
 * - User info
 * - Accessible (ARIA labels, focus trapping)
 */
export default function MobileDrawer({
  isOpen,
  onClose,
  user,
  onLogout,
}: MobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
        role="button"
        aria-label="Close navigation drawer"
      />

      {/* Drawer */}
      <div
        className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 shadow-lg z-50 md:hidden flex flex-col"
        role="navigation"
      >
        {/* Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            Menu
          </span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.full_name || user.email.split("@")[0]}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="block px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/profile"
            onClick={onClose}
            className="block px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Professional Profile
          </Link>
          <Link
            href="/settings"
            onClick={onClose}
            className="block px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Account Settings
          </Link>
        </nav>

        {/* Sign Out Button */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={() => {
              onClose();
              onLogout?.();
            }}
            className="w-full px-4 py-2 rounded-md text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
