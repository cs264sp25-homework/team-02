import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { ProfileUpdateType } from "convex/profiles";
import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import { toast } from "sonner";

export function useMutationProfile(
  profileId: string | undefined,
  userId: string,
) {
  const mutation = useMutation(api.profiles.updateProfile);
  const profile = useQuery(api.profiles.getProfileByUserId, { userId });

  const editProfile = useCallback(
    async (profile: ProfileUpdateType): Promise<boolean> => {
      try {
        await mutation({
          profileId: profileId as Id<"profiles">,
          userId,
          ...profile,
        });
        return true;
      } catch (error) {
        toast((error as Error).message || "Please try again later");
        return false;
      }
    },
    [mutation, profileId, userId],
  );

  const clearNonRequiredFields = useCallback(async (): Promise<boolean> => {
    try {
      if (!profile) {
        toast.error("Cannot clear profile: Profile not found");
        return false;
      }

      const clearedProfile: ProfileUpdateType = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        socialLinks: profile.socialLinks || [],

        // Clear professional history and skills
        education: [],
        workExperience: [],
        projects: [],
        skills: [],
      };

      await mutation({
        profileId: profileId as Id<"profiles">,
        userId,
        ...clearedProfile,
      });

      toast.success("Profile has been reset");
      return true;
    } catch (error) {
      toast.error((error as Error).message || "Failed to reset profile");
      return false;
    }
  }, [mutation, profileId, userId, profile]);

  return {
    edit: editProfile,
    clearNonRequiredFields,
  };
}
