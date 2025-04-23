import { useState, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

// Types
export interface GeneratedQuestions {
  technical: string[];
  nonTechnical: string[];
}

export interface QuestionState {
  userAnswer: string;
  aiResponse: string;
  isLoadingFeedback: boolean;
  isLoadingSample: boolean;
}

export type QuestionsStateMap = {
  [questionId: string]: QuestionState;
};

export function useMutationInterviewQuestions(
  jobId: Id<"jobs"> | undefined,
  userId: string | undefined,
) {
  const [generatedQuestions, setGeneratedQuestions] =
    useState<GeneratedQuestions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [questionsState, setQuestionsState] = useState<QuestionsStateMap>({});

  // Query job data
  const job = useQuery(
    api.jobs.getJobById,
    jobId && userId ? { jobId, userId } : "skip",
  );

  // Convex actions
  const generateInterviewQuestions = useAction(
    api.interviewPrep.generateQuestions,
  );
  const generateFeedback = useAction(api.interviewPrep.generateFeedback);
  const generateSampleAnswer = useAction(
    api.interviewPrep.generateSampleAnswer,
  );

  // Reset questions and state when job changes
  useEffect(() => {
    setGeneratedQuestions(null);
    setQuestionsState({});
  }, [jobId]);

  // Update user answer for a specific question
  const handleAnswerChange = (questionId: string, value: string) => {
    setQuestionsState((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        userAnswer: value,
      },
    }));
  };

  // Generate interview questions
  const handleGenerate = async () => {
    if (!jobId) {
      toast.error("Job ID not found in parameters.");
      return;
    }
    if (!userId) {
      toast.error("User not authenticated. Please log in.");
      return;
    }

    setIsLoading(true);
    setGeneratedQuestions(null);
    setQuestionsState({});

    try {
      const result = await generateInterviewQuestions({
        jobId,
        userId,
      });
      setGeneratedQuestions(result);

      // Initialize question state for each generated question
      const newQuestionsState: QuestionsStateMap = {};
      result.technical.forEach((_, index) => {
        newQuestionsState[`tech-${index}`] = {
          userAnswer: "",
          aiResponse: "",
          isLoadingFeedback: false,
          isLoadingSample: false,
        };
      });
      result.nonTechnical.forEach((_, index) => {
        newQuestionsState[`nontech-${index}`] = {
          userAnswer: "",
          aiResponse: "",
          isLoadingFeedback: false,
          isLoadingSample: false,
        };
      });
      setQuestionsState(newQuestionsState);

      toast.success("Interview questions generated!");
    } catch (error: unknown) {
      console.error("Failed to generate questions:", error);
      let errorMessage = "Failed to generate questions. Please try again.";
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      setGeneratedQuestions(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Get feedback for an answer
  const handleGetFeedback = async (
    questionId: string,
    questionText: string,
    questionType: "technical" | "nonTechnical",
  ) => {
    if (!jobId || !userId || !job) return;

    // Get user's answer
    const userAnswer = questionsState[questionId]?.userAnswer || "";
    if (!userAnswer.trim()) {
      toast.error("Please provide an answer first.");
      return;
    }

    // Set loading state for this specific question
    setQuestionsState((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isLoadingFeedback: true,
      },
    }));

    try {
      const feedback = await generateFeedback({
        jobId,
        userId,
        questionText,
        userAnswer,
        questionType,
      });

      // Update state with feedback
      setQuestionsState((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          aiResponse: feedback,
          isLoadingFeedback: false,
        },
      }));

      toast.success("Feedback generated!");
    } catch (error) {
      console.error("Failed to generate feedback:", error);
      toast.error("Failed to generate feedback. Please try again.");

      // Reset loading state
      setQuestionsState((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          isLoadingFeedback: false,
        },
      }));
    }
  };

  // Generate sample answer
  const handleGenerateSample = async (
    questionId: string,
    questionText: string,
    questionType: "technical" | "nonTechnical",
  ) => {
    if (!jobId || !userId || !job) return;

    // Get user's answer (if any, it's optional for sample generation)
    const userAnswer = questionsState[questionId]?.userAnswer || "";

    // Set loading state for this specific question
    setQuestionsState((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isLoadingSample: true,
      },
    }));

    try {
      const sampleAnswer = await generateSampleAnswer({
        jobId,
        userId,
        questionText,
        userAnswer, // Passing user's answer is optional
        questionType,
      });

      // Update state with sample answer
      setQuestionsState((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          aiResponse: sampleAnswer,
          isLoadingSample: false,
        },
      }));

      toast.success("Sample answer generated!");
    } catch (error) {
      console.error("Failed to generate sample answer:", error);
      toast.error("Failed to generate sample answer. Please try again.");

      // Reset loading state
      setQuestionsState((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          isLoadingSample: false,
        },
      }));
    }
  };

  return {
    job,
    isLoading,
    generatedQuestions,
    questionsState,
    handleGenerate,
    handleAnswerChange,
    handleGetFeedback,
    handleGenerateSample,
  };
}
