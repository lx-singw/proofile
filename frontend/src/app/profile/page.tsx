"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/layout/DashboardHeader";
import ProfileView from "@/components/profile/ProfileView";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile({ enabled: Boolean(user) });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && !profileLoading && !profile) {
      router.replace("/profile/create");
    }
  }, [loading, user, profile, profileLoading, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" data-testid="profile-loading">
        <p className="text-muted-foreground">Loading your resume...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader />
      <main className="flex-1 flex items-center justify-center p-8" data-testid="profile-page">
        <div className="w-full max-w-3xl">
          <ProfileView profile={profile} />
        </div>
      </main>
    </div>
  );
}
