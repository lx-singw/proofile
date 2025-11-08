"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import profileService, { type Profile, type UpdateProfilePayload } from "@/services/profileService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { useProfileActions } from "@/hooks/useProfile";
import Image from "next/image";

const schema = z.object({
  headline: z.string().min(2, "Headline must be at least 2 chars"),
  summary: z.string().min(2, "Summary must be at least 2 chars").max(500, "Summary too long"),
  avatar: z.instanceof(File).optional().or(z.null()),
});

type FormValues = z.infer<typeof schema>;

type EditProfileFormProps = {
  profile: Profile;
  onSuccess?: (profile: Profile) => void;
};

export const EditProfileForm: React.FC<EditProfileFormProps> = ({ profile, onSuccess }) => {
  const router = useRouter();
  const { setProfileCache, invalidateProfile } = useProfileActions();
  const optimisticToastRef = useRef<string | number | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(profile.avatar_url ?? null);
  const isErrorResponse = (value: unknown): value is { detail?: string } =>
    typeof value === "object" && value !== null && "detail" in value;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      headline: profile.headline ?? "",
      summary: profile.summary ?? "",
      avatar: null,
    },
  });

  const watchedAvatar = watch("avatar");

  useEffect(() => {
    register("avatar");
  }, [register]);

  useEffect(() => {
    reset({ headline: profile.headline ?? "", summary: profile.summary ?? "", avatar: null });
    setPreview(profile.avatar_url ?? null);
  }, [profile, reset]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onSubmit = async (values: FormValues) => {
    optimisticToastRef.current = toast.loading("Saving profile changes...");
    const payload: UpdateProfilePayload = {
      headline: values.headline,
      summary: values.summary,
      avatar: values.avatar || null,
    };

    try {
      const updated = await profileService.updateProfile(profile.id, payload);
      toast.success("Profile updated", { id: optimisticToastRef.current });
      setProfileCache(updated);
      await invalidateProfile();
      onSuccess?.(updated);
      reset({ headline: updated.headline ?? "", summary: updated.summary ?? "", avatar: null });
      setPreview(updated.avatar_url ?? null);
      router.replace("/profile");
      optimisticToastRef.current = undefined;
    } catch (error: unknown) {
      const detail = isErrorResponse(error) && typeof error.detail === "string"
        ? error.detail
        : "Failed to update profile";
      toast.error(detail, { id: optimisticToastRef.current });
      optimisticToastRef.current = undefined;
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setValue("avatar", file, { shouldDirty: true });
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview((prev) => {
        if (prev && prev !== profile.avatar_url) URL.revokeObjectURL(prev);
        return url;
      });
    } else {
      setPreview((prev) => {
        if (prev && prev !== profile.avatar_url) URL.revokeObjectURL(prev);
        return profile.avatar_url ?? null;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-label="edit-profile-form" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="edit_headline" className="text-sm font-medium">
            Headline
          </label>
          <Input id="edit_headline" data-testid="edit_headline" {...register("headline")} />
          {errors.headline && (
            <p role="alert" className="text-sm text-destructive">
              {errors.headline.message}
            </p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="edit_summary" className="text-sm font-medium">
            Summary
          </label>
          <Textarea
            id="edit_summary"
            data-testid="edit_summary"
            {...register("summary")}
          />
          {errors.summary && (
            <p role="alert" className="text-sm text-destructive">
              {errors.summary.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="edit_avatar" className="text-sm font-medium">
            Avatar
          </label>
          <Input id="edit_avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
          {preview && (
            <Image
              src={preview}
              alt="Avatar preview"
              width={96}
              height={96}
              className="mt-2 size-24 rounded-full object-cover"
              data-testid="edit-avatar-preview"
              unoptimized
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting} data-testid="save-profile">
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
        {watchedAvatar ? (
          <span className="text-sm text-muted-foreground" data-testid="avatar-selected">
            Selected avatar: {watchedAvatar.name}
          </span>
        ) : null}
      </div>
    </form>
  );
};

export default EditProfileForm;
