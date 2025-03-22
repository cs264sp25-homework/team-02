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

export function useMutationJobs() {
  const addJobMutation = useMutation(api.jobs.addJob);
  const scrapeJobAction = useAction(api.scrape.scrapeJob);

  const addJob = async (
    postingUrl: string,
    applicationUrl: string,
  ): Promise<string | null> => {
    try {
      const jobData = await scrapeJobAction({
        postingUrl,
        applicationUrl,
      });

      const jobId = await addJobMutation({
        title: jobData.title,
        description: jobData.description,
        questions: jobData.questions,
        postingUrl,
        applicationUrl,
      });

      return jobId;
    } catch (error) {
      toast.error((error as Error).message || "Failed to import job");
      return null;
    }
  };

  return {
    add: addJob,
  };
}
