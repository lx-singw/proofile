"use client";

import React from "react";

interface DashboardSidebarProps {
  children: React.ReactNode;
}

/**
 * DashboardSidebar
 * 
 * Left sidebar container for dashboard.
 * Features:
 * - Sticky positioning (stays visible on scroll)
 * - Responsive (hidden on mobile, visible on desktop)
 * - Contains profile summary, quick actions, metrics
 */
export default function DashboardSidebar({ children }: DashboardSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 space-y-4">
        {children}
      </div>
    </aside>
  );
}
