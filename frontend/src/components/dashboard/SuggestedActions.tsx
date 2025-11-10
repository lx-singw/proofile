"use client";

import React from "react";
import { Lightbulb, ArrowRight } from "lucide-react";

interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  cta: string;
  href: string;
  priority: "high" | "medium" | "low";
}

interface SuggestedActionsProps {
  actions?: SuggestedAction[];
  onActionClick?: (actionId: string) => void;
}

/**
 * SuggestedActions
 * 
 * Personalized action suggestions to improve profile visibility.
 * Features:
 * - Priority-based ordering
 * - Icon + description
 * - Call-to-action buttons
 * - Responsive list layout
 */
export default function SuggestedActions({
  actions = [
    {
      id: "add-photo",
      title: "Add a Professional Photo",
      description: "Profiles with photos are 50% more likely to be viewed",
      icon: <Lightbulb className="w-5 h-5" />,
      cta: "Add Photo",
      href: "/profile/photo",
      priority: "high",
    },
    {
      id: "add-skills",
      title: "Add More Skills",
      description: "Increase visibility by adding skills to your profile",
      icon: <Lightbulb className="w-5 h-5" />,
      cta: "Add Skills",
      href: "/profile/skills/add",
      priority: "high",
    },
    {
      id: "get-endorsements",
      title: "Ask for Endorsements",
      description: "Trusted endorsements build credibility with employers",
      icon: <Lightbulb className="w-5 h-5" />,
      cta: "Start Endorsements",
      href: "/profile/endorsements",
      priority: "medium",
    },
    {
      id: "share-profile",
      title: "Share Your Profile",
      description: "Grow your network by sharing your profile on social media",
      icon: <Lightbulb className="w-5 h-5" />,
      cta: "Share",
      href: "/profile/share",
      priority: "medium",
    },
  ],
  onActionClick,
}: SuggestedActionsProps) {
  // Sort by priority
  const sortedActions = [...actions].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10";
      case "medium":
        return "border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
      default:
        return "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10";
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Suggested Actions
        </h3>
      </div>

      {/* Actions List */}
      <div className="space-y-3">
        {sortedActions.map((action) => (
          <div
            key={action.id}
            className={`rounded-lg p-4 transition-colors ${getPriorityColor(
              action.priority
            )}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {action.description}
                </p>
              </div>
              {action.priority === "high" && (
                <span className="text-xs font-semibold px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded whitespace-nowrap">
                  Priority
                </span>
              )}
            </div>

            {/* CTA */}
            <a
              href={action.href}
              onClick={() => onActionClick?.(action.id)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-2"
            >
              {action.cta}
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Following these suggestions can increase your visibility by up to 80%.
        </p>
      </div>
    </div>
  );
}
