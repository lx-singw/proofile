"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";

interface WelcomeBannerProps {
  userName?: string;
  isNewUser?: boolean;
  onCreateProfile?: () => void;
  onViewProfile?: () => void;
}

/**
 * WelcomeBanner
 * 
 * Welcome greeting banner with personalized message and CTA.
 * Features:
 * - Dynamic greeting based on time of day or user status
 * - Profile completion CTA
 * - Sparkle animation for new users
 * - Responsive design
 */
export default function WelcomeBanner({
  userName = "there",
  isNewUser = false,
  onCreateProfile,
  onViewProfile,
}: WelcomeBannerProps) {
  const greeting = isNewUser 
    ? `Welcome to Proofile, ${userName}! 🎉` 
    : `Welcome back, ${userName}! ✨`;

  const message = isNewUser
    ? "Get started by creating your professional profile to stand out to employers."
    : "Pick up where you left off and continue building your profile.";

  return (
    <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-900/50 p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Greeting & Message */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isNewUser && <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {greeting}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            {message}
          </p>
        </div>

        {/* Right: CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {isNewUser ? (
            <>
              <button
                onClick={onCreateProfile}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors font-medium whitespace-nowrap"
              >
                Create Profile
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium whitespace-nowrap"
              >
                Learn More
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onViewProfile}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors font-medium whitespace-nowrap"
              >
                View Profile
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium whitespace-nowrap"
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
