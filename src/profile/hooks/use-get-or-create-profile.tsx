import { api } from "../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

export function useGetOrCreateProfile() {
  const getOrCreate = useMutation(api.profiles.getOrCreateProfile);
  const profile = useQuery(api.profiles.getCurrentUserProfile);

  useEffect(() => {
    if (profile === null) {
      // Profile doesn't exist, create it
      getOrCreate();
    }
  }, [profile, getOrCreate]);

  return {
    data: profile,
    loading: profile === undefined,
    error: false, // We never return error since we auto-create the profile
  };
}
