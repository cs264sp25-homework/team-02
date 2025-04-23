import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/core/components/button";
import { Label } from "@/core/components/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { Loader2 } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/select";
import { useAuth } from "@/linkedin/hooks/useAuth";

interface GeneratedQuestions {
  technical: string[];
  nonTechnical: string[];
}

export default function InterviewPrepPage() {
  const [selectedJobId, setSelectedJobId] = useState<Id<"jobs"> | null>(null);
  const [generatedQuestions, setGeneratedQuestions] =
    useState<GeneratedQuestions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { user } = useAuth();
  const userId = user?.id;

  const jobs = useQuery(api.jobs.getAllJobs, !userId ? "skip" : { userId });

  const generateInterviewQuestions = useAction(
    api.interviewPrep.generateQuestions,
  );

  const handleGenerate = async () => {
    if (!selectedJobId) {
      toast.error("Please select a job first.");
      return;
    }

    if (!userId) {
      toast.error("User ID not found. Please ensure you are logged in.");
      return;
    }

    setIsLoading(true);
    setGeneratedQuestions(null);

    try {
      const result = await generateInterviewQuestions({
        jobId: selectedJobId,
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

  if (!userId) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl text-center">
        <p>Please log in to use the Interview Question Generator.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Interview Question Generator
      </h1>
      <p className="text-muted-foreground">
        Select a job from your list to generate potential technical and
        non-technical interview questions based on its details.
      </p>

      <div className="space-y-2">
        <Label htmlFor="job-select">Select Job</Label>
        <Select
          value={selectedJobId ?? undefined}
          onValueChange={(value) => setSelectedJobId(value as Id<"jobs">)}
          disabled={isLoading || !jobs}
        >
          <SelectTrigger id="job-select" className="w-full">
            <SelectValue placeholder="Select a job..." />
          </SelectTrigger>
          <SelectContent>
            {!jobs ? (
              <SelectItem value="" disabled>
                Loading jobs...
              </SelectItem>
            ) : jobs.length === 0 ? (
              <SelectItem value="" disabled>
                No jobs found. Please add a job first.
              </SelectItem>
            ) : (
              jobs.map((job) => (
                <SelectItem key={job._id} value={job._id}>
                  {job.title} (ID: {job._id.substring(0, 6)}...)
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleGenerate} disabled={isLoading || !selectedJobId}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Questions"
        )}
      </Button>

      {generatedQuestions && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Technical Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedQuestions.technical.length > 0 ? (
                <ul className="list-disc space-y-2 pl-5 text-sm">
                  {generatedQuestions.technical.map((q, index) => (
                    <li key={`tech-${index}`}>{q}</li>
                  ))}
                </ul>
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
            <CardContent>
              {generatedQuestions.nonTechnical.length > 0 ? (
                <ul className="list-disc space-y-2 pl-5 text-sm">
                  {generatedQuestions.nonTechnical.map((q, index) => (
                    <li key={`nontech-${index}`}>{q}</li>
                  ))}
                </ul>
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
