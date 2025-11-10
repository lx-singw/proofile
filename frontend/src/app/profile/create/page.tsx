"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { CreateProfileForm } from "@/components/profile/CreateProfileForm";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function CreateProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile({ enabled: Boolean(user) });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && !profileLoading && profile) {
      router.replace("/profile");
    }
  }, [loading, user, profile, profileLoading, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" data-testid="create-profile-loading">
        <p className="text-muted-foreground">Checking your profile status...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-6" data-testid="create-profile-page">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold" data-testid="create-profile-heading">
              Create your profile
            </h1>
            <p className="text-muted-foreground">
              Tell us about yourself so we can match you with the best opportunities.
            </p>
          </div>
          <CreateProfileForm />
        </div>
      </main>
    </div>
  );
}
