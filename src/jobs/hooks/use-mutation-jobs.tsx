import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { useMutation, useAction } from "convex/react";

export interface JobData {
  title: string;
  description: string;
  questions: string[];
  postingUrl: string;
  applicationUrl: string;
}

export interface ManualJobData {
  title: string;
  requirements: string;
  questions: string[];
}

export function useAddJob(userId: string) {
  const addJob = useMutation(api.jobs.addJob);
  const scrapeJob = useAction(api.scrape.scrapeJob);

  const inputJobData = async (
    jobTitle: string,
    jobRequirements: string,
    questions: string[],
  ) => {
    try {
      const jobId = await addJob({
        userId,
        title: jobTitle,
        description: jobRequirements,
        questions: questions,
      });

      return jobId;
    } catch (error) {
      toast.error((error as Error).message || "Failed to import job");
      return null;
    }
  };

  const importJob = async (postingUrl: string, applicationUrl: string) => {
    try {
      const jobData = await scrapeJob({
        postingUrl,
        applicationUrl,
      });

      const jobId = await addJob({
        userId,
        title: jobData.title,
        description: jobData.description,
        questions: jobData.questions || [],
        postingUrl,
        applicationUrl,
      });

      return jobId;
    } catch (error) {
      toast.error((error as Error).message || "Failed to import job");
      return null;
    }
  };

  return { importJob, inputJobData };
}
