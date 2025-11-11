"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { toast } from "sonner";

export const registrationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  full_name: z.string().max(120, "Keep it under 120 characters").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/(?=.*[a-z])/, "Include a lowercase letter")
    .regex(/(?=.*[A-Z])/, "Include an uppercase letter")
    .regex(/(?=.*\d)/, "Include a number")
    .regex(/(?=.*[!@#$%^&*(),.?":{}|<>_+-])/, "Include a special character"),
});

type FormValues = z.infer<typeof registrationSchema>;

export default function RegistrationForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  type DataLayerEvent = Record<string, unknown>;
  type AnalyticsWindow = Window & {
    dataLayer?: {
      push?: (event: DataLayerEvent) => void;
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(registrationSchema), mode: "onSubmit", shouldFocusError: true });

  const onSubmit = async (data: FormValues) => {
    // Debug: surface submission attempt in E2E logs
    if (process.env.NODE_ENV !== "production") {
      try {
        console.log("[registration] submit", { hasEmail: Boolean(data.email), hasPassword: Boolean(data.password) });
      } catch {
        // ignore logging issues (e.g., console disabled)
      }
    }
    try {
      await registerUser({ email: data.email, password: data.password, full_name: data.full_name });
      // lightweight analytics hook if present
      try {
        if (typeof window !== "undefined") {
          const analyticsWindow = window as AnalyticsWindow;
          analyticsWindow.dataLayer?.push?.({ event: "sign_up", method: "credentials" });
        }
      } catch {}
      toast.success("Account created. Please log in.");
      // The registerUser function should handle navigation, but let's ensure it happens
    } catch (err: unknown) {
      // Normalize backend error shapes (detail or field errors)
      const detail = isRecord(err)
        ? (typeof err["detail"] === "string" ? err["detail"] : undefined) ?? (typeof err["message"] === "string" ? err["message"] : undefined)
        : undefined;

      const rawFieldErrors = isRecord(err)
        ? (err["errors"] ?? err["field_errors"])
        : undefined;

      // Check if email already exists → redirect to login
      if (detail?.includes("already exists") || detail?.includes("Email")) {
        setError("email", {
          type: "server",
          message: "Email already in use. Log in instead.",
        });
        return;
      }

      if (isRecord(rawFieldErrors)) {
        Object.entries(rawFieldErrors).forEach(([name, messages]) => {
          const firstMessage = Array.isArray(messages) ? messages[0] : messages;
          const resolved = typeof firstMessage === "string" ? firstMessage : undefined;
          setError(name as keyof FormValues, {
            type: "server",
            message: resolved ?? "Registration failed",
          });
        });
      } else if (detail) {
        toast.error(detail);
      } else {
        toast.error("Registration failed");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-4" noValidate>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && <ErrorMessage id="email-error">{errors.email.message}</ErrorMessage>}
      </div>

      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          placeholder="Optional"
          aria-invalid={!!errors.full_name}
          aria-describedby={errors.full_name ? "full-name-error" : undefined}
          {...register("full_name")}
        />
        {errors.full_name && (
          <ErrorMessage id="full-name-error">{errors.full_name.message}</ErrorMessage>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <ErrorMessage id="password-error">{errors.password.message}</ErrorMessage>
        )}
      </div>

      <div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating…" : "Create account"}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-green-600 hover:text-green-700 dark:text-green-500">
          Sign in
        </Link>
      </div>
    </form>
  );
}
