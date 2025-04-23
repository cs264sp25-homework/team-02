import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/core/components/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { Loader2, Brain, MessageSquareQuote } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { Textarea } from "@/core/components/textarea";

interface GeneratedQuestions {
  technical: string[];
  nonTechnical: string[];
}

// Track user answers and AI responses for each question
interface QuestionState {
  userAnswer: string;
  aiResponse: string;
  isLoadingFeedback: boolean;
  isLoadingSample: boolean;
}

type QuestionsStateMap = {
  [questionId: string]: QuestionState;
};

export default function InterviewPrepPage() {
  const { params } = useRouter();
  const jobId = params.jobId as Id<"jobs"> | undefined;
  const { user } = useAuth();
  const userId = user?.id;

  const [generatedQuestions, setGeneratedQuestions] =
    useState<GeneratedQuestions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // State for all questions' user answers and AI responses
  const [questionsState, setQuestionsState] = useState<QuestionsStateMap>({});

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

  useEffect(() => {
    setGeneratedQuestions(null);
    // Reset answers and feedback when job changes
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
        jobId: jobId,
        userId: userId,
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

  if (!userId || !jobId) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl text-center">
        <p>
          {!jobId
            ? "Missing Job ID. Please navigate from the job list."
            : "User not authenticated. Please log in."}
        </p>
      </div>
    );
  }

  const jobIsLoading = job === undefined;
  const jobTitle = job ? job.title : "Loading job details...";

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Interview Question Generator
      </h1>
      <p className="text-muted-foreground">
        Generating potential interview questions for job:
        <span className="font-medium ml-1">{jobTitle}</span>
        {job ? ` (ID: ${job._id.substring(0, 6)}...)` : ""}
      </p>

      <Button onClick={handleGenerate} disabled={isLoading || jobIsLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : jobIsLoading ? (
          "Loading Job Details..."
        ) : (
          "Generate New Questions"
        )}
      </Button>

      {generatedQuestions && (
        <div className="grid gap-6 md:grid-cols-1">
          {/* Technical Questions Section */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedQuestions.technical.length > 0 ? (
                generatedQuestions.technical.map((q, index) => {
                  const questionId = `tech-${index}`;
                  const questionState = questionsState[questionId] || {
                    userAnswer: "",
                    aiResponse: "",
                    isLoadingFeedback: false,
                    isLoadingSample: false,
                  };

                  return (
                    <div
                      key={questionId}
                      className="space-y-3 border-b pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="font-medium text-sm">
                        {index + 1}. {q}
                      </p>
                      <Textarea
                        placeholder={`Type your answer here...`}
                        className="w-full text-sm"
                        rows={4}
                        value={questionState.userAnswer}
                        onChange={(e) =>
                          handleAnswerChange(questionId, e.target.value)
                        }
                      />
                      <Textarea
                        placeholder="AI feedback or sample answer will appear here..."
                        className="w-full text-sm bg-muted/50"
                        rows={4}
                        readOnly
                        value={questionState.aiResponse}
                      />
                      <div className="flex space-x-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleGetFeedback(questionId, q, "technical")
                          }
                          disabled={
                            !questionState.userAnswer.trim() ||
                            questionState.isLoadingFeedback ||
                            questionState.isLoadingSample
                          }
                        >
                          {questionState.isLoadingFeedback ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Brain className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Get Feedback
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleGenerateSample(questionId, q, "technical")
                          }
                          disabled={
                            questionState.isLoadingFeedback ||
                            questionState.isLoadingSample
                          }
                        >
                          {questionState.isLoadingSample ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MessageSquareQuote className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Generate Sample
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No technical questions generated.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Non-Technical Questions Section */}
          <Card>
            <CardHeader>
              <CardTitle>Non-Technical Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedQuestions.nonTechnical.length > 0 ? (
                generatedQuestions.nonTechnical.map((q, index) => {
                  const questionId = `nontech-${index}`;
                  const questionState = questionsState[questionId] || {
                    userAnswer: "",
                    aiResponse: "",
                    isLoadingFeedback: false,
                    isLoadingSample: false,
                  };

                  return (
                    <div
                      key={questionId}
                      className="space-y-3 border-b pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="font-medium text-sm">
                        {index + 1}. {q}
                      </p>
                      <Textarea
                        placeholder={`Type your answer here...`}
                        className="w-full text-sm"
                        rows={4}
                        value={questionState.userAnswer}
                        onChange={(e) =>
                          handleAnswerChange(questionId, e.target.value)
                        }
                      />
                      <Textarea
                        placeholder="AI feedback or sample answer will appear here..."
                        className="w-full text-sm bg-muted/50"
                        rows={4}
                        readOnly
                        value={questionState.aiResponse}
                      />
                      <div className="flex space-x-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleGetFeedback(questionId, q, "nonTechnical")
                          }
                          disabled={
                            !questionState.userAnswer.trim() ||
                            questionState.isLoadingFeedback ||
                            questionState.isLoadingSample
                          }
                        >
                          {questionState.isLoadingFeedback ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Brain className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Get Feedback
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleGenerateSample(questionId, q, "nonTechnical")
                          }
                          disabled={
                            questionState.isLoadingFeedback ||
                            questionState.isLoadingSample
                          }
                        >
                          {questionState.isLoadingSample ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MessageSquareQuote className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Generate Sample
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No non-technical questions generated.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
