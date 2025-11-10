"use client";

import React from "react";
import Link from "next/link";
import {
  Award,
  Briefcase,
  BookOpen,
  Zap,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

/**
 * QuickActions
 * 
 * Sidebar card with quick action buttons for common tasks.
 * Features:
 * - Add skills, experience, education, certifications, etc.
 * - Icon + label for each action
 * - Responsive grid layout
 */
export default function QuickActions() {
  const actions: QuickAction[] = [
    {
      id: "add-skill",
      label: "Add Skill",
      href: "/profile/skills/add",
      icon: <Zap className="w-5 h-5" />,
      description: "Add a new skill",
    },
    {
      id: "add-experience",
      label: "Add Experience",
      href: "/profile/experience/add",
      icon: <Briefcase className="w-5 h-5" />,
      description: "Add work experience",
    },
    {
      id: "add-education",
      label: "Add Education",
      href: "/profile/education/add",
      icon: <BookOpen className="w-5 h-5" />,
      description: "Add education",
    },
    {
      id: "add-certification",
      label: "Add Certification",
      href: "/profile/certifications/add",
      icon: <Award className="w-5 h-5" />,
      description: "Add certification",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
          >
            <div className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {action.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {action.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {action.description}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
