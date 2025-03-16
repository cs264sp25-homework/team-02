import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { ProfileType } from "convex/profiles";

export function useQueryProfile() {
  const profile = useQuery(api.profiles.getCurrentUserProfile);

  return {
    data: profile as ProfileType,
    loading: profile === undefined,
    error: profile === null,
  };
}
