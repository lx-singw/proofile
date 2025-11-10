"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/error-message";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const accountSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  full_name: z.string().max(120, "Keep it under 120 characters"),
  current_password: z.string().min(1, "Current password is required"),
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/(?=.*[a-z])/, "Include a lowercase letter")
    .regex(/(?=.*[A-Z])/, "Include an uppercase letter")
    .regex(/(?=.*\d)/, "Include a number")
    .regex(/(?=.*[!@#$%^&*(),.?":{}|<>_+-])/, "Include a special character")
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof accountSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(accountSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setValue("email", user.email);
      setValue("full_name", user.full_name || "");
    }
  }, [user, setValue]);

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const payload: Record<string, string> = {
        email: data.email,
        full_name: data.full_name,
        current_password: data.current_password,
      };

      // Only include new_password if provided
      if (data.new_password) {
        payload.new_password = data.new_password;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to update settings");
        return;
      }

      toast.success("Account settings updated successfully");
      reset(data);
    } catch (error) {
      toast.error("Failed to update account settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading settings...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader />

      <main className="flex-1 max-w-2xl mx-auto w-full px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-semibold">Account Settings</h1>
            <p className="text-gray-600 mt-1">Manage your email, password, and profile information</p>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border p-6 space-y-5">
            {/* Email Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Email Address</h2>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && <ErrorMessage id="email-error">{errors.email.message}</ErrorMessage>}
              </div>
            </div>

            {/* Profile Section */}
            <div className="border-t pt-5">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  aria-invalid={!!errors.full_name}
                  aria-describedby={errors.full_name ? "full-name-error" : undefined}
                  {...register("full_name")}
                />
                {errors.full_name && <ErrorMessage id="full-name-error">{errors.full_name.message}</ErrorMessage>}
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t pt-5">
              <h2 className="text-lg font-semibold mb-4">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.current_password}
                    aria-describedby={errors.current_password ? "current-password-error" : undefined}
                    {...register("current_password")}
                  />
                  {errors.current_password && (
                    <ErrorMessage id="current-password-error">{errors.current_password.message}</ErrorMessage>
                  )}
                </div>

                <div>
                  <Label htmlFor="new_password">New Password (Optional)</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.new_password}
                    aria-describedby={errors.new_password ? "new-password-error" : undefined}
                    {...register("new_password")}
                  />
                  {errors.new_password && (
                    <ErrorMessage id="new-password-error">{errors.new_password.message}</ErrorMessage>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Leave blank if you don't want to change your password</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t pt-5 flex gap-3">
              <Button type="submit" disabled={isSaving || !isDirty}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
