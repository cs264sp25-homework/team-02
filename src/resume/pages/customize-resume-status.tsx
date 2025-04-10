import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { Id } from "convex/_generated/dataModel";
import { useQueryResume } from "../hooks/use-query-resume";
import { ResumeGenerationTimeline } from "../components/resume-generation-timeline";
import { CopyButton } from "@/core/components/copy-button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useMutationResume } from "../hooks/use-muatation-resume";
import { ProfileType } from "convex/profiles";

export const CustomizeResumeStatus = () => {
  const { isAuthenticated, user } = useAuth();
  const { params, redirect } = useRouter();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { restartResumeGeneration } = useMutationResume();

  if (!isAuthenticated) {
    redirect("login");
  }
  const resumeId = params.resumeId as Id<"resumes">;
  const { resume, loading } = useQueryResume(resumeId, user!.id);

  // Auto-switch to PDF tab when PDF becomes available
  useEffect(() => {
    if (resume && resume.generationStatus === "completed") {
      setTimeout(() => {
        redirect("edit_resume", { resumeId: resume._id });
      }, 1000);
    }
  }, [resume, redirect]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!resume) {
    return <div>Resume not found</div>;
  }

  const handleRegenerate = async () => {
    if (isRegenerating) return;

    try {
      setIsRegenerating(true);
      await restartResumeGeneration({
        resumeId,
        userId: user!.id,
        jobId: resume.jobId,
      });
    } catch (error) {
      console.error("Failed to regenerate resume:", error);
      alert("Failed to regenerate resume. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Resume Generation Status</h1>
        <button
          onClick={handleRegenerate}
          disabled={
            resume.generationStatus !== "completed" &&
            resume.generationStatus !== "failed"
          }
          className={cn(
            "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm",
            resume.generationStatus === "failed"
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white",
            (isRegenerating ||
              (resume.generationStatus !== "completed" &&
                resume.generationStatus !== "failed")) &&
              "opacity-50 cursor-not-allowed",
          )}
        >
          {isRegenerating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Regenerating...
            </>
          ) : (
            <>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {resume.generationStatus === "failed"
                ? "Retry Generation"
                : "Regenerate Resume"}
            </>
          )}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Timeline */}
        <div>
          <ResumeGenerationTimeline
            currentStatus={resume.generationStatus}
            error={resume.generationError}
            statusBeforeFailure={resume.statusBeforeFailure}
            tailoredProfile={resume.tailoredProfile as ProfileType}
          />
        </div>

        {/* Right side - Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Generated LaTeX</h2>
            <CopyButton text={resume.latexContent} />
          </div>
          <div className="p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-md overflow-auto max-h-[600px] text-left">
              {resume.latexContent}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
