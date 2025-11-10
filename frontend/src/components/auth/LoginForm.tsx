"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import Link from "next/link";

export const loginSchema = z.object({
  username: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });
  const { login } = useAuth();

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const onSubmit = async (data: FormValues) => {
    try {
      await login({ username: data.username, password: data.password });
    } catch (err: unknown) {
      // Check if account doesn't exist → redirect to signup
      const detail = isRecord(err) && typeof err["detail"] === "string" ? err["detail"] : "";
      
      if (detail === "Incorrect email or password") {
        // Could be either wrong password OR account doesn't exist
        // For better UX, show a friendly message with signup link
        setError("username", {
          type: "server",
          message: "Account not found. Create one to get started.",
        });
        return;
      }

      // Show a generic auth error to avoid enumeration
      const generic = "Invalid email or password";
      const rawFieldErrors = isRecord(err)
        ? (err["errors"] ?? err["field_errors"])
        : undefined;

      if (isRecord(rawFieldErrors)) {
        Object.entries(rawFieldErrors).forEach(([name, messages]) => {
          const firstMessage = Array.isArray(messages) ? messages[0] : messages;
          const resolved = typeof firstMessage === "string" ? firstMessage : generic;
          setError(name as keyof FormValues, { type: "server", message: resolved || generic });
        });
      } else {
        setError("username", { type: "server", message: generic });
        setError("password", { type: "server", message: generic });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-4" noValidate>
      <div>
        <Label htmlFor="username">Email</Label>
        <Input
          id="username"
          placeholder="you@example.com"
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? "username-error" : undefined}
          {...register("username")}
        />
        {errors.username && <ErrorMessage id="username-error">{errors.username.message}</ErrorMessage>}
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
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
          Sign up
        </Link>
      </div>
    </form>
  );
}
