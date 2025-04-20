import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
export const useQueryResumeInsights = (resumeId: string, userId: string) => {
  const resumeInsights = useQuery(api.resume.handlers.getResumeInsights, {
    resumeId: resumeId as Id<"resumes">,
    userId,
  });

  return {
    resumeInsights,
    isLoading: resumeInsights === undefined,
  };
};
