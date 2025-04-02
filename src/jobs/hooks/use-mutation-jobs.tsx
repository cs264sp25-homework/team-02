import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { useMutation, useAction, useQuery } from "convex/react";
import { formatProfileBackground } from "../pages/job-details";

export interface JobData {
  title: string;
  description: string;
  questions: string[];
  postingUrl: string;
  applicationUrl: string;
}

export function useAddJob(userId: string) {
  const addJob = useMutation(api.jobs.addJob);
  const scrapeJob = useAction(api.scrape.scrapeJob);
  const profile = useQuery(api.profiles.getProfileByUserId, {
    userId: userId,
  });

  const getAiGeneratedJobQuestions = useAction(api.openai.generateJobQuestions);

  const importJob = async (postingUrl: string, applicationUrl: string) => {
    try {
      const jobData = await scrapeJob({
        postingUrl,
        applicationUrl,
      });

      const answersFromAi = await getAiGeneratedJobQuestions({
        jobTitle: jobData.title,
        jobRequirements: jobData.description,
        jobQuestions: jobData.questions,
        userBackground: formatProfileBackground(profile),
      });

      const jobId = await addJob({
        userId,
        title: jobData.title,
        description: jobData.description,
        questions: jobData.questions,
        answers: answersFromAi,
        postingUrl,
        applicationUrl,
      });

      return jobId;
    } catch (error) {
      toast.error((error as Error).message || "Failed to import job");
      return null;
    }
  };

  return { importJob };
}
