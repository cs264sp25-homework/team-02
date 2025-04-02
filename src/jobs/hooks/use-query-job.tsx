import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { JobInType } from "convex/jobs";

export function useQueryJob(jobId: string, userId: string) {
  const job = useQuery(api.jobs.getJobById, {
    jobId: jobId as Id<"jobs">,
    userId,
  });

  return {
    data: job as JobInType,
    loading: job === undefined,
    error: job === null,
  };
}
