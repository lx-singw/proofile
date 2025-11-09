import { api, apiRequest } from "../lib/api";

export type Profile = {
  id: number;
  user_id?: number;
  headline: string;
  summary: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreateProfilePayload = {
  headline: string;
  summary: string;
  avatar?: File | null;
};

export type UpdateProfilePayload = Partial<CreateProfilePayload>;

const PROFILE_BASE_PATH = "/api/v1/profiles";

const PATHS = {
  base: `${PROFILE_BASE_PATH}/`,
  me: `${PROFILE_BASE_PATH}/me`,
  byId: (profileId: string | number) => `${PROFILE_BASE_PATH}/${profileId}`,
};

type ApiErrorShape = {
  status?: number;
  detail?: string;
  message?: string;
};

const isApiError = (error: unknown): error is ApiErrorShape =>
  typeof error === "object" && error !== null;

const isErrorString = (error: unknown): error is string => typeof error === "string";

const shouldReturnNull = (error: ApiErrorShape | string): boolean => {
  const status = typeof error === "object" ? error.status : undefined;
  if (status === 404 || status === 401) {
    return true;
  }

  const detail =
    typeof error === "object"
      ? typeof error.detail === "string"
        ? error.detail
        : typeof error.message === "string"
          ? error.message
          : undefined
      : error;

  const normalizedDetail = detail?.toLowerCase().trim();
  if (!normalizedDetail) {
    return false;
  }

  return (
    normalizedDetail.includes("not found") ||
    normalizedDetail.includes("not authenticated") ||
    normalizedDetail.includes("no profile")
  );
};

export async function getProfile(): Promise<Profile | null> {
  try {
    return await apiRequest<Profile>({ method: "get", url: PATHS.me });
  } catch (error: unknown) {
    if (isApiError(error) && shouldReturnNull(error)) {
      return null;
    }

    if (isErrorString(error) && shouldReturnNull(error)) {
      return null;
    }

    throw error;
  }
}

export async function createProfile(payload: CreateProfilePayload): Promise<Profile> {
  const { avatar, ...profileData } = payload;

  // 1. Create profile with text data
  const createdProfile = await apiRequest<Profile>({
    method: "post",
    url: PATHS.base,
    data: profileData,
  });

  // 2. If an avatar is included, upload it and return the updated profile
  if (avatar) {
    const updatedProfileWithAvatar = await uploadAvatar(avatar);
    return updatedProfileWithAvatar;
  }

  return createdProfile;
}

export async function updateProfile(profileId: string | number, payload: UpdateProfilePayload): Promise<Profile> {
  const url = PATHS.byId(profileId);
  const { avatar, ...profileData } = payload;

  // 1. Update profile with text data if any was provided
  let updatedProfile: Profile;
  if (Object.keys(profileData).length > 0) {
    updatedProfile = await apiRequest<Profile>({ method: "patch", url, data: profileData });
  } else {
    // If only an avatar is being changed, we need the current profile state
    const existingProfile = await getProfile();
    if (!existingProfile) throw new Error("Profile not found for update");
    updatedProfile = existingProfile;
  }

  // 2. If an avatar is included, upload it and return the final updated profile
  if (avatar) {
    const finalProfile = await uploadAvatar(avatar);
    return finalProfile;
  }

  return updatedProfile;
}

export async function uploadAvatar(file: File): Promise<Profile> {
  const fd = new FormData();
  fd.append("file", file);
  
  const response = await api.post<Profile>(`${PROFILE_BASE_PATH}/avatar`, fd, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
}

const profileService = { getProfile, createProfile, updateProfile, uploadAvatar };

export default profileService;
