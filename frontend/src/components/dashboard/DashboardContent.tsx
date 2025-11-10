"use client";

import React from "react";

interface DashboardContentProps {
  children: React.ReactNode;
}

/**
 * DashboardContent
 * 
 * Main content wrapper with responsive 2-column layout.
 * Features:
 * - Sidebar (left): Fixed or sticky profile summary
 * - Main (right): Primary content area
 * - Responsive: 1 column on mobile, 2 columns on desktop
 * - GitHub-inspired layout
 */
export default function DashboardContent({ children }: DashboardContentProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          {/* Sidebar content will be inserted via children or specific sidebar component */}
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">
          {children}
        </main>
      </div>
    </div>
  );
}
