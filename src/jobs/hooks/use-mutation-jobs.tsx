import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { useMutation, useAction, useQuery } from "convex/react";
import { formatProfileBackground } from "../utils/profile";

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
  const profile = useQuery(api.profiles.getProfileByUserId, {
    userId: userId,
  });
  const extractRequiredSkills = useAction(api.jobs.extractRequiredSkills);

  const getAiGeneratedJobQuestions = useAction(api.openai.generateJobQuestions);

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
        questions: jobData.questions,
        postingUrl,
        applicationUrl,
      });

      console.log("description", jobData.description);

      if (
        jobData.description &&
        jobData.description !== "No requirements found"
      ) {
        await extractRequiredSkills({
          jobId: jobId,
          userId,
          requirements: jobData.description,
        });
      }

      return jobId;
    } catch (error) {
      toast.error((error as Error).message || "Failed to import job");
      return null;
    }
  };

  return { importJob, inputJobData };
}
