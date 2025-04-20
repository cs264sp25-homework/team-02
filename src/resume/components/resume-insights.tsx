import { useQueryResumeInsights } from "../hooks/use-query-resume-insights";
import { useMutationResume } from "../hooks/use-muatation-resume";
import { Button } from "@/core/components/button";
import { Spinner } from "@/linkedin/components/spinner";
import { RefreshCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Id } from "convex/_generated/dataModel";

function ResumeInsights({
  userId,
  resumeId,
}: {
  userId: string;
  resumeId: string;
}) {
  const { resumeInsights, isLoading } = useQueryResumeInsights(
    resumeId,
    userId,
  );
  const { generateResumeInsights } = useMutationResume();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    try {
      setIsRegenerating(true);
      await generateResumeInsights({
        resumeId: resumeId as Id<"resumes">,
        userId,
      });
    } catch (error) {
      console.error("Failed to generate resume insights:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Loading insights...</p>
      </div>
    );
  }

  if (!resumeInsights) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-2"
        >
          {isRegenerating ? (
            <>
              <Spinner size="sm" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
              Generate Insights
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-2"
        >
          {isRegenerating ? (
            <>
              <Spinner size="sm" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
              Regenerate
            </>
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {resumeInsights
          .sort((a) => (a.match === "match" ? 1 : -1))
          .map((insight) => (
            <div
              key={insight.requirement}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {insight.match === "match" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {insight.match === "match"
                        ? "Match Found"
                        : "Gap Identified"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{insight.requirement}</p>
                  {insight.comments && (
                    <p className="text-sm text-gray-500 italic">
                      {insight.comments}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default ResumeInsights;
