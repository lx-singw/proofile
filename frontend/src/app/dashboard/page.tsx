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
  }, [loading, user, profile, profileLoading]);

  if (loading) {
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

  // Detect new users (created within last 5 minutes)
  const isNewUser = user.created_at
    ? new Date().getTime() - new Date(user.created_at).getTime() < 5 * 60 * 1000
    : false;
  const greeting = isNewUser ? "Welcome to Proofile!" : `Welcome back, ${primaryName}!`;

  return (
    <div className="min-h-screen flex flex-col p-8">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <Button onClick={logout} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>

        {/* Welcome Section */}
        <div>
          <h2 className="text-xl font-semibold mb-1">{greeting}</h2>
          <p className="text-muted-foreground">
            Signed in as {user.email}
          </p>
        </div>

        {/* Profile Status Banner/Card */}
        {profileLoading ? (
          <div className="p-4 border rounded bg-muted/50">
            <p className="text-muted-foreground">Loading profile status...</p>
          </div>
        ) : !profile ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 space-y-3" data-testid="profile-status-banner">
            <div>
              <h3 className="font-semibold text-blue-900">📝 Complete Your Professional Profile</h3>
              <p className="text-sm text-blue-800 mt-1">
                Stand out to employers by adding your headline, summary, and work experience.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link href="/profile/create">Create Profile</Link>
              </Button>
              <Button variant="ghost" size="sm">
                Maybe Later
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-6 space-y-4" data-testid="profile-status-card">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{profile.headline || "Your Profile"}</h3>
              <p className="text-muted-foreground text-sm line-clamp-2">
                {profile.summary || "No summary yet."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/profile">View Profile</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/profile/edit">Edit Profile</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="font-semibold">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/settings">⚙️ Account Settings</Link>
            </Button>
            {/* Future: Browse jobs, view applications, etc. */}
          </div>
        </div>
      </div>
    </div>
  );
}
