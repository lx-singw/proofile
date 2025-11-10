"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import DashboardDropdown from "./DashboardDropdown";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import CreateButton from "./CreateButton";
import MobileMenu from "./MobileMenu";
import MobileDrawer from "./MobileDrawer";
import { Settings, LogOut, LayoutDashboard, FileText } from "lucide-react";

interface DashboardHeaderProps {
  unreadNotifications?: number;
}

/**
 * DashboardHeader
 * 
 * Main header component for dashboard pages.
 * Features:
 * - Left section: Logo & dropdown menu
 * - Center: Search bar (hidden on mobile)
 * - Right section: Notifications, create button, user menu
 * - Mobile drawer for navigation
 * - Sticky positioning
 */
export default function DashboardHeader({
  unreadNotifications = 0,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setMobileDrawerOpen(false);
    await logout();
  };

  return (
    <>
      {/* Main Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto w-full">
          {/* Left Section: Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <MobileMenu
              onClick={() => setMobileDrawerOpen(true)}
              isOpen={mobileDrawerOpen}
            />
            <Link
              href="/dashboard"
              className="text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Proofile
            </Link>
          </div>

          {/* Center Section: Search Bar (hidden on mobile) */}
          <div className="hidden md:block flex-1 mx-4 lg:mx-8">
            <SearchBar placeholder="Search your profile..." />
          </div>

          {/* Right Section: Notifications, Create Button, User Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications */}
            <NotificationBell unreadCount={unreadNotifications} />

            {/* Create Button */}
            <CreateButton ariaLabel="Create new item" />

            {/* User Menu Dropdown */}
            <DashboardDropdown
              trigger={
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.full_name || user.email.split("@")[0]}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                </div>
              }
              items={[
                {
                  label: "Dashboard",
                  href: "/dashboard",
                  icon: <LayoutDashboard className="w-4 h-4" />,
                },
                {
                  label: "Professional Profile",
                  href: "/profile",
                  icon: <FileText className="w-4 h-4" />,
                },
                {
                  label: "Account Settings",
                  href: "/settings",
                  icon: <Settings className="w-4 h-4" />,
                },
                {
                  label: "Sign Out",
                  href: "/logout",
                  icon: <LogOut className="w-4 h-4" />,
                  divider: true,
                },
              ]}
              align="right"
              onItemClick={(item) => {
                if (item.label === "Sign Out") {
                  handleLogout();
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}
