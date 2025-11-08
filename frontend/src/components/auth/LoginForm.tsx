"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";

const schema = z.object({
  username: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });
  const { login } = useAuth();

  const onSubmit = async (data: FormValues) => {
    try {
      await login({ username: data.username, password: data.password });
    } catch (err: any) {
      // Show a generic auth error to avoid enumeration
      const generic = "Invalid email or password";
      const fieldErrors: Record<string, string[]> | undefined = err?.errors || err?.field_errors;
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([name, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : String(messages);
          setError(name as keyof FormValues, { type: "server", message: msg || generic });
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
    </form>
  );
}
