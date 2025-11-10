"use client";

import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import DashboardHeader from "@/components/layout/DashboardHeader";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import StatsCards from "@/components/dashboard/StatsCards";
import ActivityGraph from "@/components/dashboard/ActivityGraph";
import ProfileCompletion from "@/components/dashboard/ProfileCompletion";
import SuggestedActions from "@/components/dashboard/SuggestedActions";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

type ActivityPoint = {
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

type CompletionStep = {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  href: string;
};

type SuggestedActionItem = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  cta: string;
  href: string;
  priority: "high" | "medium" | "low";
};

type ActivityFeedItem = {
  id: string;
  type:
    | "endorsement"
    | "profile-view"
    | "skill-added"
    | "message"
    | "profile-complete"
    | "connection";
  actor: string;
  actorAvatar?: string;
  title: string;
  description?: string;
  timestamp: Date;
  href: string;
  read: boolean;
};

function createSeed(userId?: number, email?: string | null, username?: string | null) {
  let seed = typeof userId === "number" ? userId * 97 : 42;
  const source = `${email ?? ""}${username ?? ""}`;
  for (let i = 0; i < source.length; i += 1) {
    seed = (seed + source.charCodeAt(i)) % 2147483647;
  }
  return seed || 12345;
}

function createSeededRandom(seedValue: number) {
  let seed = seedValue % 2147483647;
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile({ enabled: Boolean(user) });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

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

  const displayName = user.full_name || user.username || user.email || "there";
  const createdAt = typeof user.created_at === "string" ? new Date(user.created_at) : null;
  const isNewUser = createdAt ? Date.now() - createdAt.getTime() < 5 * 24 * 60 * 60 * 1000 : false;

  const seed = useMemo(() => createSeed(user.id as number | undefined, user.email, user.username), [user.email, user.id, user.username]);
  const random = useMemo(() => createSeededRandom(seed), [seed]);

  const stats = useMemo(() => {
    const baseViews = Math.floor(120 + random() * 180);
    const baseEndorsements = Math.floor(4 + random() * 8);
    const baseVerifications = Math.floor(1 + random() * 4);
    return {
      profileViews: baseViews,
      endorsements: baseEndorsements,
      verifications: baseVerifications,
    };
  }, [random]);

  const activityData = useMemo<ActivityPoint[]>(() => {
    const rng = createSeededRandom(seed + 17);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const days = 7 * 12; // last 12 weeks
    const points: ActivityPoint[] = [];

    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const activityScore = Math.round(rng() * 6);
      const level = (activityScore === 0
        ? 0
        : activityScore <= 1
        ? 1
        : activityScore <= 3
        ? 2
        : activityScore <= 5
        ? 3
        : 4) as ActivityPoint["level"];

      points.push({
        date,
        count: activityScore,
        level,
      });
    }

    return points;
  }, [seed]);

  const completionSteps = useMemo<CompletionStep[]>(() => {
    const steps: CompletionStep[] = [
      {
        id: "headline",
        label: "Add Headline",
        description: "Tell employers about your role and expertise",
        completed: Boolean(profile?.headline),
        href: "/profile/edit",
      },
      {
        id: "summary",
        label: "Write Summary",
        description: "Share your professional story",
        completed: Boolean(profile?.summary),
        href: "/profile/edit",
      },
      {
        id: "avatar",
        label: "Upload Profile Photo",
        description: "Profiles with photos get more views",
        completed: Boolean(profile?.avatar_url),
        href: "/profile/photo",
      },
      {
        id: "experience",
        label: "Add Experience",
        description: "Showcase your work history and achievements",
        completed: false,
        href: "/profile/experience/add",
      },
      {
        id: "skills",
        label: "Add Key Skills",
        description: "Highlight the skills you want to be known for",
        completed: false,
        href: "/profile/skills/add",
      },
    ];

    return steps;
  }, [profile?.avatar_url, profile?.headline, profile?.summary]);

  const completionPercentage = useMemo(() => {
    const total = completionSteps.length;
    const completed = completionSteps.filter((step) => step.completed).length;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }, [completionSteps]);

  const suggestedActions = useMemo<SuggestedActionItem[]>(() => {
    const actions: SuggestedActionItem[] = [];

    if (!profile?.avatar_url) {
      actions.push({
        id: "add-photo",
        title: "Add a Professional Photo",
        description: "Profiles with photos are more likely to be viewed",
        icon: <span role="img" aria-label="camera" className="text-lg">📸</span>,
        cta: "Upload Photo",
        href: "/profile/photo",
        priority: "high",
      });
    }

    if (!profile?.summary) {
      actions.push({
        id: "write-summary",
        title: "Write Your Summary",
        description: "Share your experience and goals to attract employers",
        icon: <span role="img" aria-label="summary" className="text-lg">📝</span>,
        cta: "Write Summary",
        href: "/profile/edit",
        priority: "high",
      });
    }

    actions.push(
      {
        id: "share-profile",
        title: "Share Your Profile",
        description: "Increase visibility by sharing with your network",
        icon: <span role="img" aria-label="share" className="text-lg">🔗</span>,
        cta: "Share Profile",
        href: "/profile/share",
        priority: "medium",
      },
      {
        id: "manage-settings",
        title: "Review Account Settings",
        description: "Ensure your contact details and preferences are up to date",
        icon: <span role="img" aria-label="settings" className="text-lg">⚙️</span>,
        cta: "Open Settings",
        href: "/settings",
        priority: "low",
      }
    );

    return actions;
  }, [profile?.avatar_url, profile?.summary]);

  const activityFeedItems = useMemo<ActivityFeedItem[]>(() => {
    const base = Date.UTC(2025, 0, 10, 12, 0, 0);
    const makeTimestamp = (hoursAgo: number) => new Date(base - hoursAgo * 60 * 60 * 1000);

    return [
      {
        id: "act-1",
        type: "profile-view",
        actor: "Tech Recruiter",
        title: "Viewed your profile",
        description: "Senior recruiter from Innovate Labs explored your profile",
        timestamp: makeTimestamp(6),
        href: "/profile/views",
        read: false,
      },
      {
        id: "act-2",
        type: "endorsement",
        actor: "Sarah Johnson",
        title: "Endorsed you for React",
        description: "Senior Frontend Engineer at BrightApps",
        timestamp: makeTimestamp(18),
        href: "/profile/endorsements",
        read: false,
      },
      {
        id: "act-3",
        type: "skill-added",
        actor: "You",
        title: "Added TypeScript to your skills",
        description: "Your profile completeness improved",
        timestamp: makeTimestamp(56),
        href: "/profile/skills",
        read: true,
      },
      {
        id: "act-4",
        type: "connection",
        actor: "Emma Wilson",
        title: "Connected with you",
        description: "Product Designer at Creative Studio",
        timestamp: makeTimestamp(80),
        href: "/connections",
        read: true,
      },
    ];
  }, []);

  const handleNavigate = (path: string) => () => router.push(path);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950">
      <DashboardHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 space-y-6">
          <WelcomeBanner
            userName={displayName}
            isNewUser={isNewUser}
            onCreateProfile={handleNavigate("/profile/create")}
            onViewProfile={handleNavigate("/profile")}
          />

          <StatsCards
            profileViews={stats.profileViews}
            endorsements={stats.endorsements}
            verifications={stats.verifications}
            onViewStats={handleNavigate("/analytics")}
          />

          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <ActivityGraph
              title="Profile engagement (last 12 weeks)"
              data={activityData}
            />
            <ProfileCompletion
              steps={completionSteps}
              completionPercentage={completionPercentage}
              onStepClick={(stepId) => {
                const target = completionSteps.find((step) => step.id === stepId);
                if (target) router.push(target.href);
              }}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
            <ActivityFeed activities={activityFeedItems} isLoading={profileLoading} />
            <SuggestedActions actions={suggestedActions} />
          </div>
        </div>
      </main>
    </div>
  );
}
