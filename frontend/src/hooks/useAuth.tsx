"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import authService, { type CurrentUser, type LoginPayload, type RegisterPayload } from "../services/authService";
import { hydrateAccessTokenFromStorage, clearAccessToken } from "../lib/api";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";

type User = CurrentUser | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ME_QUERY_KEY = ["me"] as const;

const AuthState: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const existingToken = hydrateAccessTokenFromStorage();
        // Only attempt refresh if we DON'T have a token in storage
        // (meaning the browser might have a valid refresh token in cookies)
        if (!existingToken) {
          try {
            await authService.refresh();
          } catch (refreshErr) {
            if (process.env.NODE_ENV !== "production") {
              console.log("[auth] No valid session, user is logged out");
            }
            // This is expected when user is logged out - don't warn
            clearAccessToken();
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[auth] bootstrap failed", err);
        }
        clearAccessToken();
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const { data: user, isLoading: loading } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authService.getCurrentUser,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !bootstrapping,
  });

  const login = async (payload: LoginPayload) => {
    await authService.login(payload);
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    await queryClient.refetchQueries({ queryKey: ME_QUERY_KEY });

    if (process.env.NODE_ENV !== "production") {
      console.log("[auth] login successful, navigating to dashboard");
    }

    setTimeout(() => {
      router.replace("/dashboard");
    }, 100);
  };

  const register = async (payload: RegisterPayload) => {
    await authService.register(payload);
    queryClient.setQueryData(ME_QUERY_KEY, null);
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });

    if (process.env.NODE_ENV !== "production") {
      console.log("[auth] registration successful, navigating to login");
    }

    setTimeout(() => {
      router.replace("/login");
    }, 100);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth] logout service call failed", error);
      }
    } finally {
      queryClient.setQueryData(ME_QUERY_KEY, null);
      clearAccessToken();
      router.push("/home");
    }
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
  };

  const isLoading = bootstrapping || (loading && user !== null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: user ?? null, loading: isLoading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  // Persistence disabled temporarily - packages not in Docker container
  // useEffect(() => {
  //   if (typeof window === "undefined") return;
  //   let cancelled = false;
  //   // ... persistence code
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthState>{children}</AuthState>
    </QueryClientProvider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default useAuth;
