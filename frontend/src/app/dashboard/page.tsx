"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile({ enabled: Boolean(user) });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[dashboard] effect state", {
        loading,
        hasUser: Boolean(user),
        profileLoading,
        profile,
      });
    }
    if (!loading && user && !profileLoading && profile === null) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[dashboard] redirecting to /profile/create");
      }
      router.replace("/profile/create");
    }
  }, [loading, user, profile, profileLoading, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-lg" aria-live="polite">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p data-testid="unauthenticated-message" aria-live="polite">
          Redirecting to login...
        </p>
      </div>
    );
  }

  const primaryName = user.full_name || user.username || user.email || "your account";
  const shouldShowEmail = Boolean(user.email && user.email !== primaryName);

  if (profile == null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" data-testid="dashboard-profile-redirect">
        <p className="text-muted-foreground">Let&apos;s create your profile to unlock the dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <Button onClick={logout} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
        <p data-testid="dashboard-user" className="text-muted-foreground">
          Signed in as {primaryName}
          {shouldShowEmail ? ` (${user.email})` : ""}
        </p>
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4" data-testid="dashboard-profile-summary">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Your profile</h2>
            <p className="text-muted-foreground">
              {profile.summary || "Add a short summary to help employers get to know you."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href="/profile">View profile</Link>
            </Button>
            <Button asChild size="sm" variant="outline" data-testid="dashboard-edit-profile">
              <Link href="/profile/edit">Edit profile</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
