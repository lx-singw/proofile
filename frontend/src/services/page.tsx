"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth(); // Assuming useAuth provides the current user
  const { data: profile, isLoading, isError } = useProfile();

  useEffect(() => {
    // Wait until the profile query is settled
    if (isLoading) {
      return;
    }

    // If there's no profile and the query didn't error, redirect.
    if (!profile && !isError) {
      router.replace("/profile/create");
    }
  }, [profile, isLoading, isError, router]);

  // Show a loading state while we check for a profile
  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  // If a profile exists, render the dashboard
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p data-testid="dashboard-user">Welcome, {user?.email || "user"}!</p>
      <p>Your profile headline: {profile?.headline}</p>
    </div>
  );
}