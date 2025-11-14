"use client";

import React from "react";
import Link from "next/link";
import { FileText, Edit2, Share2 } from "lucide-react";

interface ProfileSummaryCardProps {
  user?: {
    id?: number;
    email: string;
    full_name?: string | null;
  };
  profile?: {
    id?: number;
    headline?: string;
    summary?: string;
    avatar_url?: string;
  };
  completionPercentage?: number;
}

/**
 * ProfileSummaryCard
 * 
 * Sidebar profile card with user info, stats, and action buttons.
 * Features:
 * - User avatar/initial
 * - Display name and headline
 * - Profile completion percentage
 * - Quick action buttons (Edit, Share, View)
 */
export default function ProfileSummaryCard({
  user,
  profile,
  completionPercentage = 0,
}: ProfileSummaryCardProps) {
  const displayName = user?.full_name || user?.email.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      {/* Avatar */}
      <div className="flex flex-col items-center text-center mb-4">
        <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-3">
          {initial}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {displayName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {profile?.headline || "Career professional"}
        </p>
      </div>

      {/* Resume Completion */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Resume Complete
          </span>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {completionPercentage}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 py-4 border-t border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">0</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Views</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">0</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Endorsements</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Link
          href="/profile/edit"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors text-sm font-medium"
        >
          <Edit2 className="w-4 h-4" />
          Edit Resume
        </Link>
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">
          <Share2 className="w-4 h-4" />
          Share Resume
        </button>
        <Link
          href="/profile"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          <FileText className="w-4 h-4" />
          View Resume
        </Link>
      </div>
    </div>
  );
}
