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
  const improveResumeLineWithAI = useAction(
    api.resume.handlers.improveResumeLineWithAI,
  );
  const deleteResume = useMutation(api.resume.handlers.deleteResume);
  const generateResumeInsights = useAction(
    api.resume.handlers.generateResumeInsights,
  );
  const updateResumeLaTeXContent = useMutation(
    api.resume.handlers.updateResumeLaTeXContent,
  );
  return {
    startResumeGeneration,
    restartResumeGeneration,
    compileAndSaveResume,
    deleteResume,
    improveResumeLineWithAI,
    generateResumeInsights,
    updateResumeLaTeXContent,
  };
};
