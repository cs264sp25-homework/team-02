import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const useQueryResumeByJob = (userId: string, jobId: string) => {
  const resume = useQuery(api.resume.handlers.getResumeByJobId, {
    jobId,
    userId,
  });
  return {
    resume,
    loading: resume === undefined,
  };
};
