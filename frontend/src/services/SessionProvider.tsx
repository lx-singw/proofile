"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { refresh } from "@/services/authService";
import { getAccessToken, hydrateAccessTokenFromStorage } from "@/lib/api";

/**
 * This provider is responsible for ensuring the user's session is validated
 * or refreshed when the application first loads in the browser.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Attempt to refresh the session on initial load.
  // This runs only once.
  const { isLoading } = useQuery({
    queryKey: ["session-refresh"],
    queryFn: async () => {
      // Only attempt refresh if a token existed previously.
      // This avoids calling refresh for non-logged-in users.
      if (getAccessToken()) {
        return refresh();
      }
      return null;
    },
    retry: false, // We don't want to retry this on failure.
    refetchOnWindowFocus: false,
    staleTime: Infinity, // This query should only run once.
    gcTime: Infinity,
  });

  // Hydrate the access token from localStorage on mount.
  useEffect(() => {
    hydrateAccessTokenFromStorage();
    setIsHydrated(true);
  }, []);

  // Render a loading state or null until hydration and session check are done.
  if (isLoading || !isHydrated) {
    return null; // Or a full-page loader component
  }

  return <>{children}</>;
}