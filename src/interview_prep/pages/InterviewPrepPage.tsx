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
import { Loader2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { Textarea } from "@/core/components/textarea";

interface GeneratedQuestions {
  technical: string[];
  nonTechnical: string[];
}

export default function InterviewPrepPage() {
  const { params } = useRouter();
  const jobId = params.jobId as Id<"jobs"> | undefined;
  const { user } = useAuth();
  const userId = user?.id;

  const [generatedQuestions, setGeneratedQuestions] =
    useState<GeneratedQuestions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const job = useQuery(
    api.jobs.getJobById,
    jobId && userId ? { jobId, userId } : "skip",
  );

  const generateInterviewQuestions = useAction(
    api.interviewPrep.generateQuestions,
  );

  useEffect(() => {
    setGeneratedQuestions(null);
  }, [jobId]);

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

    try {
      const result = await generateInterviewQuestions({
        jobId: jobId,
        userId: userId,
      });
      setGeneratedQuestions(result);
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
          <Card>
            <CardHeader>
              <CardTitle>Technical Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedQuestions.technical.length > 0 ? (
                generatedQuestions.technical.map((q, index) => (
                  <div key={`tech-${index}`} className="space-y-2">
                    <p className="font-medium text-sm">
                      {index + 1}. {q}
                    </p>
                    <Textarea
                      placeholder={`Type your answer for question ${index + 1}...`}
                      className="w-full text-sm"
                      rows={3}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No technical questions generated.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Non-Technical Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedQuestions.nonTechnical.length > 0 ? (
                generatedQuestions.nonTechnical.map((q, index) => (
                  <div key={`nontech-${index}`} className="space-y-2">
                    <p className="font-medium text-sm">
                      {index + 1}. {q}
                    </p>
                    <Textarea
                      placeholder={`Type your answer for question ${index + 1}...`}
                      className="w-full text-sm"
                      rows={3}
                    />
                  </div>
                ))
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
