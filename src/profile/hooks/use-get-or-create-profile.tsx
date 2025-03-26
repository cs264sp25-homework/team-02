import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

export function useGetOrCreateProfile(userId: string) {
  const getOrCreate = useMutation(api.profiles.getOrCreateProfile);
  const profile = useQuery(api.profiles.getCurrentUserProfile, { userId });

  useEffect(() => {
    if (profile === null) {
      // Profile doesn't exist, create it
      getOrCreate({ userId });
    }
  }, [profile, getOrCreate, userId]);

  return {
    data: profile,
    loading: profile === undefined,
    error: false, // We never return error since we auto-create the profile
  };
}
