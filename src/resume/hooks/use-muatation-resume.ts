import { api } from "../../../convex/_generated/api";
import { useMutation, useAction } from "convex/react";

// hook to encapsulate all resume mutations

export const useMutationResume = () => {
  const startResumeGeneration = useMutation(
    api.resume.handlers.startResumeGeneration,
  );
  const restartResumeGeneration = useMutation(
    api.resume.handlers.restartResumeGeneration,
  );
  const compileAndSaveResume = useAction(
    api.resume.handlers.compileAndSaveResume,
  );
  return {
    startResumeGeneration,
    restartResumeGeneration,
    compileAndSaveResume,
  };
};
