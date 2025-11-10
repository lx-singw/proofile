"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/layout/DashboardHeader";
import EditProfileForm from "@/components/profile/EditProfileForm";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function EditProfilePage() {
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
      <div className="min-h-screen flex items-center justify-center p-8" data-testid="edit-profile-loading">
        <p className="text-muted-foreground">Preparing edit form...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" data-testid="edit-profile-page">
      <DashboardHeader />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Edit profile</h1>
            <p className="text-muted-foreground">Keep your details up to date to stay noticed.</p>
          </div>
          <EditProfileForm profile={profile} />
        </div>
      </main>
    </div>
  );
}
