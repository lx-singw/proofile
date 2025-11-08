"use client";

import Link from "next/link";
import Image from "next/image";
import { Profile } from "@/services/profileService";
import { Button } from "../ui/button";

type ProfileViewProps = {
  profile: Profile;
};

export const ProfileView: React.FC<ProfileViewProps> = ({ profile }) => {
  const hasAvatar = Boolean(profile.avatar_url);

  return (
    <section className="space-y-6" aria-labelledby="profile-heading" data-testid="profile-view">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="profile-heading" className="text-3xl font-semibold tracking-tight">
            Profile
          </h1>
          <p className="text-muted-foreground">Manage how employers see you across Proofile.</p>
        </div>
        <Button asChild variant="secondary" size="sm" data-testid="profile-edit">
          <Link href="/profile/edit">Edit profile</Link>
        </Button>
      </header>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {hasAvatar ? (
            <Image
              src={profile.avatar_url ?? ""}
              alt="Profile avatar"
              width={96}
              height={96}
              className="size-24 rounded-full object-cover"
              data-testid="profile-avatar"
              unoptimized
            />
          ) : (
            <div
              className="size-24 rounded-full bg-muted text-center text-3xl font-semibold leading-[6rem] text-muted-foreground"
              data-testid="profile-avatar-placeholder"
            >
              {profile.headline?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
          )}

          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-semibold" data-testid="profile-headline">
                {profile.headline}
              </h2>
              <p className="text-muted-foreground" data-testid="profile-summary">
                {profile.summary || "No summary added yet."}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p data-testid="profile-updated-at">
                Last updated: {profile.updated_at ? new Date(profile.updated_at).toLocaleString() : "Just now"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileView;
