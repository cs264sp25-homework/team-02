import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";

export const useQueryResume = (resumeId: string, userId: string) => {
  const resume = useQuery(api.resume.handlers.getResumeById, {
    resumeId,
    userId,
  });

  return {
    loading: resume === undefined,
    resume,
  };
};
