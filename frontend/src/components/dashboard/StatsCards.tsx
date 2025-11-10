"use client";

import React from "react";
import { Eye, ThumbsUp, Award } from "lucide-react";

interface StatCard {
  icon: React.ReactNode;
  label: string;
  value: number;
  change?: number;
  trend?: "up" | "down" | "neutral";
}

interface StatsCardsProps {
  profileViews?: number;
  endorsements?: number;
  verifications?: number;
  onViewStats?: () => void;
}

/**
 * StatsCards
 * 
 * Grid of stat cards showing profile metrics and performance.
 * Features:
 * - Profile views, endorsements, verifications
 * - Change indicators (up/down/neutral trends)
 * - Responsive grid layout
 * - Icon + value display
 */
export default function StatsCards({
  profileViews = 0,
  endorsements = 0,
  verifications = 0,
  onViewStats,
}: StatsCardsProps) {
  const stats: StatCard[] = [
    {
      icon: <Eye className="w-6 h-6" />,
      label: "Profile Views",
      value: profileViews,
      change: 12,
      trend: "up",
    },
    {
      icon: <ThumbsUp className="w-6 h-6" />,
      label: "Endorsements",
      value: endorsements,
      change: 3,
      trend: "up",
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: "Verifications",
      value: verifications,
      change: 0,
      trend: "neutral",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Icon & Label */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Value & Trend */}
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value.toLocaleString()}
              </div>
              {stat.change !== undefined && stat.change !== 0 && (
                <div
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    stat.trend === "up"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : stat.trend === "down"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {stat.trend === "up" && "↑"}
                  {stat.trend === "down" && "↓"}
                  {Math.abs(stat.change)}
                </div>
              )}
            </div>

            {/* Period */}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              This month
            </p>
          </div>
        ))}
      </div>

      {/* View All Stats Link */}
      <div className="mt-4">
        <button
          onClick={onViewStats}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          View detailed analytics →
        </button>
      </div>
    </div>
  );
}
