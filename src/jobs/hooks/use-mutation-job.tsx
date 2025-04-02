import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { Id } from "convex/_generated/dataModel";

export function useMutationJob() {
  const updateAnswerAtIndexMutation = useMutation(api.jobs.updateAnswerAtIndex);

  const updateAnswerAtIndex = async (
    userId: string,
    jobId: Id<"jobs">,
    index: number,
    answer: string,
  ): Promise<boolean | null> => {
    try {
      return await updateAnswerAtIndexMutation({
        userId,
        jobId,
        index,
        answer,
      });
    } catch (error) {
      toast.error((error as Error).message || "Failed to update answer");
      return null;
    }
  };

  return {
    updateAnswer: updateAnswerAtIndex,
  };
}
