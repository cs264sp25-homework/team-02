import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { ProfileUpdateType } from "convex/profiles";
import { useMutation } from "convex/react";
import { toast } from "sonner";

export function useMutationProfile(profileId: string) {
  const mutation = useMutation(api.profiles.updateProfile);

  const editProfile = async (profile: ProfileUpdateType): Promise<boolean> => {
    try {
      await mutation({
        profileId: profileId as Id<"profiles">,
        ...profile,
      });
      return true;
    } catch (error) {
      toast((error as Error).message || "Please try again later");
      return false;
    }
  };

  return {
    edit: editProfile,
  };
}
