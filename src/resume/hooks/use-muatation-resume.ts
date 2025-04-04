import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";

// hook to encapsulate all resume mutations

export const useMutationResume = () => {
  const startResumeGeneration = useMutation(
    api.resume.handlers.startResumeGeneration,
  );
  const restartResumeGeneration = useMutation(
    api.resume.handlers.restartResumeGeneration,
  );

  return {
    startResumeGeneration,
    restartResumeGeneration,
  };
};
