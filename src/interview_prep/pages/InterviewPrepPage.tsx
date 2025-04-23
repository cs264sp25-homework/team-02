import { Button } from "@/core/components/button";
import { Loader2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { QuestionSection } from "../components/question-section";
import { useMutationInterviewQuestions } from "../hooks/use-mutation-interview-questions";

export default function InterviewPrepPage() {
  const { params } = useRouter();
  const jobId = params.jobId as Id<"jobs"> | undefined;
  const { user } = useAuth();
  const userId = user?.id;

  const {
    job,
    isLoading,
    generatedQuestions,
    questionsState,
    handleGenerate,
    handleAnswerChange,
    handleGetFeedback,
    handleGenerateSample,
  } = useMutationInterviewQuestions(jobId, userId);

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
          <QuestionSection
            title="Technical Questions"
            questions={generatedQuestions.technical}
            questionType="technical"
            questionsState={questionsState}
            onAnswerChange={handleAnswerChange}
            onGetFeedback={handleGetFeedback}
            onGenerateSample={handleGenerateSample}
          />

          <QuestionSection
            title="Non-Technical Questions"
            questions={generatedQuestions.nonTechnical}
            questionType="nonTechnical"
            questionsState={questionsState}
            onAnswerChange={handleAnswerChange}
            onGetFeedback={handleGetFeedback}
            onGenerateSample={handleGenerateSample}
          />
        </div>
      )}
    </div>
  );
}
