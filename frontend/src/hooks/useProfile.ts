"use client";

import { useQuery, useQueryClient, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import profileService, { type Profile } from "@/services/profileService";

export const PROFILE_QUERY_KEY = ["profile", "me"] as const;

type ProfileQueryData = Profile | null;
type ProfileQueryError = unknown;

type UseProfileOptions = Omit<
  UseQueryOptions<ProfileQueryData, ProfileQueryError, ProfileQueryData, typeof PROFILE_QUERY_KEY>,
  "queryKey" | "queryFn"
>;

export function useProfile(options?: UseProfileOptions): UseQueryResult<ProfileQueryData, ProfileQueryError> {
  return useQuery<ProfileQueryData, ProfileQueryError, ProfileQueryData, typeof PROFILE_QUERY_KEY>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: profileService.getProfile,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    ...options,
  });
}

export function useProfileActions() {
  const queryClient = useQueryClient();

  const setProfileCache = (profile: Profile | null) => {
    queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
  };

  const invalidateProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
  };

  return { setProfileCache, invalidateProfile };
}
