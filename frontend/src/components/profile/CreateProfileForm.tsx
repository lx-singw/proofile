"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import profileService, { CreateProfilePayload, Profile } from "@/services/profileService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { useProfileActions } from "@/hooks/useProfile";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  headline: z.string().min(2, "Headline must be at least 2 chars"),
  summary: z.string().min(2, "Summary must be at least 2 chars").max(500, "Summary too long"),
  avatar: z.instanceof(File).optional().or(z.null()),
});

type FormValues = z.infer<typeof schema>;

type CreateProfileFormProps = {
  onSuccess?: (profile: Profile) => void;
};

export const CreateProfileForm: React.FC<CreateProfileFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { setProfileCache, invalidateProfile } = useProfileActions();
  const { register, handleSubmit, formState, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { headline: "", summary: "", avatar: null },
  });
  const { errors, isSubmitting } = formState;
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "success">("idle");
  const optimisticToastRef = useRef<string | number | undefined>(undefined);
  const [optimisticHeadline, setOptimisticHeadline] = useState<string | null>(null);

  useEffect(() => {
    register("avatar");
  }, [register]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const onSubmit = async (values: FormValues) => {
    setStatus("pending");
    setOptimisticHeadline(values.headline);
    optimisticToastRef.current = toast.loading(`Creating profile "${values.headline}"...`);
    const payload: CreateProfilePayload = {
      headline: values.headline,
      summary: values.summary,
      avatar: values.avatar || null,
    };
    try {
      const profile = await profileService.createProfile(payload);
      toast.success("Profile created", { id: optimisticToastRef.current });
      setStatus("success");
      onSuccess?.(profile);
      setProfileCache(profile);
      await invalidateProfile();
      reset({ headline: profile.headline ?? values.headline, summary: profile.summary ?? values.summary, avatar: null });
      setPreview(null);
      router.replace("/profile");
      optimisticToastRef.current = undefined;
    } catch (e: any) {
      const detail = e?.detail || "Failed to create profile";
      toast.error(detail, { id: optimisticToastRef.current });
      setStatus("idle");
      optimisticToastRef.current = undefined;
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("avatar", file, { shouldDirty: true });
      try {
        const url = URL.createObjectURL(file);
        setPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch {
        setPreview(null);
      }
    } else {
      setValue("avatar", null, { shouldDirty: true });
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-label="create-profile-form" className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input id="headline" data-testid="headline" {...register("headline")} />
        {errors.headline && <p role="alert" className="text-sm text-destructive">{errors.headline.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea id="summary" data-testid="summary" {...register("summary")} />
        {errors.summary && <p role="alert" className="text-sm text-destructive">{errors.summary.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatar">Avatar (Optional)</Label>
        <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
        {preview && (
          <img
            src={preview}
            alt="Avatar preview"
            className="mt-2 size-24 rounded-full object-cover"
            data-testid="avatar-preview"
          />
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} data-testid="submit-profile">
        {isSubmitting ? "Saving..." : "Create Profile"}
      </Button>
      <div className="h-5">
        {status === "pending" && optimisticHeadline && (
          <p data-testid="profile-status" className="text-sm text-muted-foreground animate-in fade-in-0">
            Creating profile "{optimisticHeadline}"...
          </p>
        )}
        {status === "success" && optimisticHeadline && (
          <p data-testid="profile-success" className="text-sm text-green-600 animate-in fade-in-0">
            Profile created for {optimisticHeadline}
          </p>
        )}
      </div>
    </form>
  );
};

export default CreateProfileForm;
