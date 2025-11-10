"use client";

import React from "react";
import DashboardHeader from "./DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DashboardLayout
 * 
 * Main layout wrapper for dashboard pages.
 * Features:
 * - Sticky header at top
 * - Responsive container
 * - Consistent spacing
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Sticky Header */}
      <DashboardHeader />

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
