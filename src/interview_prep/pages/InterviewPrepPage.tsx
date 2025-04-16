import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/core/components/button";
import { Textarea } from "@/core/components/textarea";
import { Label } from "@/core/components/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { Loader2 } from "lucide-react";

interface GeneratedQuestions {
  technical: string[];
  nonTechnical: string[];
}

export default function InterviewPrepPage() {
  const [jobDetailsText, setJobDetailsText] = useState<string>("");
  const [generatedQuestions, setGeneratedQuestions] =
    useState<GeneratedQuestions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const generateInterviewQuestions = useAction(
    api.interviewPrep.generateQuestions,
  );

  const handleGenerate = async () => {
    if (!jobDetailsText.trim()) {
      toast.error("Please paste the job details first.");
      return;
    }

    setIsLoading(true);
    setGeneratedQuestions(null);

    try {
      const result = await generateInterviewQuestions({ jobDetailsText });
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
      setGeneratedQuestions(null); // Ensure clearing on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Interview Question Generator
      </h1>
      <p className="text-muted-foreground">
        Paste the job description or relevant details below to generate
        potential technical and non-technical interview questions.
      </p>

      <div className="space-y-2">
        <Label htmlFor="job-details">Job Details</Label>
        <Textarea
          id="job-details"
          placeholder="Paste job description, responsibilities, required skills, etc. here..."
          value={jobDetailsText}
          onChange={(e) => setJobDetailsText(e.target.value)}
          rows={10}
          disabled={isLoading}
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isLoading || !jobDetailsText.trim()}
      >
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
