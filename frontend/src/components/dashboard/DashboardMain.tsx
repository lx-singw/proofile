"use client";

import React from "react";

interface DashboardMainProps {
  children: React.ReactNode;
}

/**
 * DashboardMain
 * 
 * Main content area wrapper.
 * Features:
 * - Full width on mobile, 3-column width on desktop (lg:col-span-3)
 * - Contains welcome banner, stats, activity feed, etc.
 */
export default function DashboardMain({ children }: DashboardMainProps) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  );
}
