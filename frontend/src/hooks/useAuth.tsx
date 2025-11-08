"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import authService, { type CurrentUser, type LoginPayload, type RegisterPayload } from "../services/authService";
import { hydrateAccessTokenFromStorage } from "../lib/api";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

type User = CurrentUser | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (p: LoginPayload) => Promise<void>;
  register: (p: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ME_QUERY_KEY = ["me"] as const;

const AuthState: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    hydrateAccessTokenFromStorage();
  }, []);

  const { data: user, isLoading: loading } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authService.getCurrentUser,
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60_000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const login = async (payload: LoginPayload) => {
    await authService.login(payload);
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    await queryClient.refetchQueries({ queryKey: ME_QUERY_KEY });
    // Use replace to ensure navigation happens
    if (process.env.NODE_ENV !== "production") {
      console.log("[auth] login successful, navigating to dashboard");
    }
    setTimeout(() => {
      router.replace("/dashboard");
    }, 100);
  };

  const register = async (payload: RegisterPayload) => {
    await authService.register(payload);
    // After successful registration, clear auth state and navigate
    queryClient.setQueryData(ME_QUERY_KEY, null);
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    // Use replace to ensure navigation happens
    if (process.env.NODE_ENV !== "production") {
      console.log("[auth] registration successful, navigating to login");
    }
    setTimeout(() => {
      router.replace("/login");
    }, 100);
  };

  const logout = async () => {
    await authService.logout();
    queryClient.setQueryData(ME_QUERY_KEY, null);
    router.push("/login");
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: user ?? null, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  // Set up localStorage persistence (browser only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const PERSIST_KEY = "rq-cache";
      // Only persist specific query key prefixes
      const PERSISTED_QUERY_KEY_PREFIXES: ReadonlyArray<ReadonlyArray<unknown>> = [["me"]];

      const isKeyPrefixMatch = (key: readonly unknown[], prefix: readonly unknown[]) =>
        prefix.every((v, i) => key[i] === v);

      const shouldPersistQuery = (q: { queryKey: readonly unknown[]; state: { status: string } }) => {
        if (q.state.status !== "success") return false;
        return PERSISTED_QUERY_KEY_PREFIXES.some((prefix) => isKeyPrefixMatch(q.queryKey, prefix));
      };

      const safePersister = createSyncStoragePersister({
        key: PERSIST_KEY,
        storage: {
          getItem: (key: string) => {
            try {
              return window.localStorage.getItem(key);
            } catch {
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            try {
              window.localStorage.setItem(key, value);
            } catch {
              // ignore quota/security errors
            }
          },
          removeItem: (key: string) => {
            try {
              window.localStorage.removeItem(key);
            } catch {
              // ignore
            }
          },
        },
        // Defensive JSON handling to avoid hydration failures on malformed cache
        serialize: (client: unknown) => {
          try {
            return JSON.stringify(client);
          } catch {
            return "";
          }
        },
        deserialize: (cachedString: string) => {
          try {
            return JSON.parse(cachedString);
          } catch {
            // If parsing fails, clear the bad cache and skip restore
            try {
              window.localStorage.removeItem(PERSIST_KEY);
            } catch {
              // ignore
            }
            return undefined;
          }
        },
      });

      persistQueryClient({
        queryClient,
        persister: safePersister,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
        maxAge: 1000 * 60 * 60, // 1 hour
      });
    } catch {
      // fail-safe: ignore persistence errors
    }
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthState>{children}</AuthState>
    </QueryClientProvider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default useAuth;
