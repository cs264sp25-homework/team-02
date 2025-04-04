import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { Id } from "convex/_generated/dataModel";
import { useQueryResume } from "../hooks/use-query-resume";
import { ResumeGenerationTimeline } from "../components/resume-generation-timeline";
import { CopyButton } from "@/core/components/copy-button";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "latex" | "pdf";

export const CustomizeResumeStatus = () => {
  const { isAuthenticated, user } = useAuth();
  const { params, redirect } = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("latex");

  if (!isAuthenticated) {
    redirect("login");
  }
  const resumeId = params.resumeId as Id<"resumes">;
  const { resume, loading } = useQueryResume(resumeId, user!.id);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!resume) {
    return <div>Resume not found</div>;
  }

  const handleDownloadPdf = async () => {
    if (!resume.compiledResumeStorageId) {
      alert(
        "PDF is not ready yet. Please wait for the generation to complete.",
      );
      return;
    }
    window.open(resume.compiledResumeUrl, "_blank");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Resume Generation Status</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side - Timeline */}
        <div>
          <ResumeGenerationTimeline
            currentStatus={resume.generationStatus}
            error={resume.generationError}
            statusBeforeFailure={resume.statusBeforeFailure}
          />
        </div>

        {/* Right side - Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("latex")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2",
                  activeTab === "latex"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                )}
              >
                LaTeX Source
              </button>
              <button
                onClick={() => setActiveTab("pdf")}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2",
                  activeTab === "pdf"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                )}
              >
                PDF Download
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "latex" ? (
            <>
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Generated LaTeX</h2>
                <CopyButton text={resume.latexContent} />
              </div>
              <div className="p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-md overflow-auto max-h-[600px]">
                  {resume.latexContent}
                </pre>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="max-w-sm mx-auto">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  PDF Download
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {resume.generationStatus === "completed"
                    ? "Your PDF is ready to download"
                    : "Please wait for the generation to complete"}
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={resume.generationStatus !== "completed"}
                    className={cn(
                      "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm",
                      resume.generationStatus === "completed"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed",
                    )}
                  >
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
