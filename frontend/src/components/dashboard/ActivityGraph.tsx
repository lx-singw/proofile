"use client";

import React from "react";

interface ActivityDay {
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = none, 4 = max
}

interface ActivityGraphProps {
  data?: ActivityDay[];
  title?: string;
}

/**
 * ActivityGraph
 * 
 * GitHub-style contribution graph showing activity over time.
 * Features:
 * - Heat map of activity intensity
 * - Weekly rows with color-coded cells
 * - Responsive grid layout
 * - Hover tooltips with date/count
 */
export default function ActivityGraph({
  data,
  title = "Activity",
}: ActivityGraphProps) {
  // Generate sample data for last 52 weeks if not provided
  const generateSampleData = (): ActivityDay[] => {
    const activities: ActivityDay[] = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Random activity (biased towards lower numbers)
      const rand = Math.random();
      let count = 0;
      if (rand > 0.7) count = Math.floor(Math.random() * 10) + 1;
      else if (rand > 0.4) count = Math.floor(Math.random() * 5);
      
      const level = (count === 0 ? 0 : count <= 3 ? 1 : count <= 6 ? 2 : count <= 10 ? 3 : 4) as 0 | 1 | 2 | 3 | 4;
      
      activities.push({ date, count, level });
    }
    
    return activities;
  };

  const activities = data || generateSampleData();

  // Group activities by week
  const weeks: ActivityDay[][] = [];
  let currentWeek: ActivityDay[] = [];

  activities.forEach((day) => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColorClass = (level: 0 | 1 | 2 | 3 | 4): string => {
    switch (level) {
      case 0:
        return "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700";
      case 1:
        return "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/50";
      case 2:
        return "bg-green-300 dark:bg-green-800 hover:bg-green-400 dark:hover:bg-green-700";
      case 3:
        return "bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500";
      case 4:
        return "bg-green-700 dark:bg-green-500 hover:bg-green-800 dark:hover:bg-green-400";
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>

      {/* Activity Grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-4 h-4 rounded-sm cursor-pointer transition-colors ${getColorClass(
                    day.level
                  )} group relative`}
                  title={`${formatDate(day.date)}: ${day.count} activities`}
                >
                  {/* Tooltip on hover */}
                  <div className="invisible group-hover:visible absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                    {formatDate(day.date)}: {day.count}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${getColorClass(level as 0 | 1 | 2 | 3 | 4)}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {activities.reduce((sum, day) => sum + day.count, 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Average</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {Math.round(
                activities.reduce((sum, day) => sum + day.count, 0) /
                  activities.length
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Streak</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
