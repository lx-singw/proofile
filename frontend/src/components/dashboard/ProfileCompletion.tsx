"use client";

import React from "react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface CompletionStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  href: string;
}

interface ProfileCompletionProps {
  steps?: CompletionStep[];
  completionPercentage?: number;
  onStepClick?: (stepId: string) => void;
}

/**
 * ProfileCompletion
 * 
 * Profile completion progress widget with actionable next steps.
 * Features:
 * - Overall completion percentage
 * - Checklist of completion steps
 * - Completion indicators
 * - Next step CTA
 */
export default function ProfileCompletion({
  steps = [
    {
      id: "headline",
      label: "Add Headline",
      description: "Tell employers about your role and expertise",
      completed: true,
      href: "/profile/edit",
    },
    {
      id: "summary",
      label: "Write Summary",
      description: "Share your professional story in 100-500 words",
      completed: true,
      href: "/profile/edit",
    },
    {
      id: "experience",
      label: "Add Experience",
      description: "List your work history and achievements",
      completed: false,
      href: "/profile/experience/add",
    },
    {
      id: "skills",
      label: "Add Skills",
      description: "Highlight your key professional skills",
      completed: false,
      href: "/profile/skills/add",
    },
    {
      id: "education",
      label: "Add Education",
      description: "Include your degrees and certifications",
      completed: false,
      href: "/profile/education/add",
    },
  ],
  completionPercentage = 40,
  onStepClick,
}: ProfileCompletionProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const nextStep = steps.find((s) => !s.completed);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Resume Completion
          </h3>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {completionPercentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          {completedCount} of {steps.length} sections completed
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-3 mb-6">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => onStepClick?.(step.id)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
              step.completed
                ? "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
                : "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            }`}
          >
            {/* Checkmark or Circle */}
            {step.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 dark:text-gray-600 flex-shrink-0 mt-0.5" />
            )}

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-sm ${
                step.completed
                  ? "text-gray-600 dark:text-gray-400 line-through"
                  : "text-gray-900 dark:text-white"
              }`}>
                {step.label}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {step.description}
              </p>
            </div>

            {/* Arrow */}
            {!step.completed && (
              <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            )}
          </button>
        ))}
      </div>

      {/* Next Step CTA */}
      {nextStep && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Next step to improve your resume:
          </p>
          <a
            href={nextStep.href}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors text-sm font-medium"
          >
            {nextStep.label}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
