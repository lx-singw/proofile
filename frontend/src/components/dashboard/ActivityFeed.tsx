"use client";

import React from "react";
import {
  Award,
  CheckCircle,
  MessageSquare,
  Share2,
  Eye,
  Heart,
} from "lucide-react";

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

interface ActivityItem {
  id: string;
  type:
    | "endorsement"
    | "profile-view"
    | "skill-added"
    | "message"
    | "profile-complete"
    | "connection";
  actor: string;
  actorAvatar?: string;
  title: string;
  description?: string;
  timestamp: Date;
  href: string;
  read: boolean;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  onActivityClick?: (activityId: string) => void;
  isLoading?: boolean;
}

/**
 * ActivityFeed
 *
 * Recent activity timeline showing profile interactions.
 * Features:
 * - Activity type indicators with icons
 * - Timestamps with relative dates
 * - Actor names and avatars
 * - Links to related content
 * - Read/unread status
 * - Loading state
 */
export default function ActivityFeed({
  activities = [
    {
      id: "act-1",
      type: "endorsement",
      actor: "Sarah Johnson",
      title: "Endorsed you for React",
      description: "Added React to their endorsements",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      href: "/profile/endorsements",
      read: false,
    },
    {
      id: "act-2",
      type: "profile-view",
      actor: "John Tech Corp",
      title: "Viewed your profile",
      description: "Senior Recruiter at Tech Corp",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      href: "/profile/views",
      read: false,
    },
    {
      id: "act-3",
      type: "skill-added",
      actor: "You",
      title: "Added new skill: TypeScript",
      description: "Increased profile completeness by 5%",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      href: "/profile/skills",
      read: true,
    },
    {
      id: "act-4",
      type: "connection",
      actor: "Emma Wilson",
      title: "Connected with you",
      description: "Product Designer at Creative Studio",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      href: "/connections",
      read: true,
    },
    {
      id: "act-5",
      type: "profile-complete",
      actor: "You",
      title: "Profile reached 85% completeness",
      description: "Great progress! Add a few more details",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      href: "/profile",
      read: true,
    },
  ],
  onActivityClick,
  isLoading = false,
}: ActivityFeedProps) {
  const getActivityIcon = (
    type: ActivityItem["type"]
  ): React.ReactNode => {
    switch (type) {
      case "endorsement":
        return <Award className="w-5 h-5 text-blue-500" />;
      case "profile-view":
        return <Eye className="w-5 h-5 text-green-500" />;
      case "skill-added":
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      case "message":
        return <MessageSquare className="w-5 h-5 text-pink-500" />;
      case "profile-complete":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "connection":
        return <Heart className="w-5 h-5 text-red-500" />;
      default:
        return <Share2 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getActivityColor = (type: ActivityItem["type"]) => {
    switch (type) {
      case "endorsement":
        return "bg-blue-50 dark:bg-blue-900/10";
      case "profile-view":
        return "bg-green-50 dark:bg-green-900/10";
      case "skill-added":
        return "bg-purple-50 dark:bg-purple-900/10";
      case "message":
        return "bg-pink-50 dark:bg-pink-900/10";
      case "profile-complete":
        return "bg-emerald-50 dark:bg-emerald-900/10";
      case "connection":
        return "bg-red-50 dark:bg-red-900/10";
      default:
        return "bg-gray-50 dark:bg-gray-900/10";
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>

      {/* Activity List */}
      <div className="space-y-0 divide-y divide-gray-200 dark:divide-gray-700">
        {activities.map((activity) => (
          <a
            key={activity.id}
            href={activity.href}
            onClick={() => onActivityClick?.(activity.id)}
            className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
              !activity.read ? "bg-blue-50 dark:bg-blue-900/5 border-l-2 border-blue-500" : ""
            }`}
          >
            <div className="flex gap-3">
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {activity.actor}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {activity.title}
                </p>

                {activity.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {activity.description}
                  </p>
                )}
              </div>

              {/* Unread Indicator */}
              {!activity.read && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
              )}
            </div>
          </a>
        ))}
      </div>

      {/* Empty State */}
      {activities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No recent activity. Start building your profile!
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <a
          href="/activity"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View all activity →
        </a>
      </div>
    </div>
  );
}
