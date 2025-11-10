"use client";

import React from "react";
import { Bell } from "lucide-react";

interface NotificationBellProps {
  unreadCount?: number;
  onClick?: () => void;
}

/**
 * NotificationBell
 * 
 * Bell icon button with unread badge.
 * Features:
 * - Unread count badge
 * - Animated pulse for new notifications
 * - Accessible (ARIA labels)
 */
export default function NotificationBell({
  unreadCount = 0,
  onClick,
}: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      aria-haspopup="true"
    >
      <Bell className="w-5 h-5" />

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <>
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>

          {/* Pulse Animation */}
          <span className="absolute top-0 right-0 inline-flex h-3 w-3 animate-pulse rounded-full bg-red-500 opacity-75 transform translate-x-1/2 -translate-y-1/2"></span>
        </>
      )}
    </button>
  );
}
