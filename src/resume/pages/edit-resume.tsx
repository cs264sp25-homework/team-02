import Layout from "@/resume/layout";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useRouter } from "@/core/hooks/use-router";
import { Id } from "convex/_generated/dataModel";
import { useQueryResume } from "../hooks/use-query-resume";
import PdfViewer from "../components/pdf-viewer";
import { CodeEditor } from "../components/code-editor";
import { useMutationResume } from "../hooks/use-muatation-resume";
import { Button } from "@/core/components/button";
import {
  File,
  AlertCircle,
  RefreshCcw,
  Trash,
  Loader2,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/components/alert-dialog";
import JobDetails from "../components/job-details";
import { ImproveResumeActionType } from "convex/resume/schema";
import ResumeInsights from "../components/resume-insights";
import { Spinner } from "@/linkedin/components/spinner";
import { useDebouncedCallback } from "use-debounce";
const EditResume = () => {
  const { isAuthenticated, user } = useAuth();
  const { redirect, params } = useRouter();
  const {
    compileAndSaveResume,
    restartResumeGeneration,
    deleteResume,
    improveResumeLineWithAI,
    updateResumeLaTeXContent,
  } = useMutationResume();
  const [isCompiling, setIsCompiling] = useState(false);
  const [activeTab, setActiveTab] = useState<"insights" | "job">("insights");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  if (!isAuthenticated) {
    redirect("login");
  }

  const resumeId = params.resumeId as Id<"resumes">;
  const { resume, loading } = useQueryResume(resumeId, user!.id);
  const [latexContent, setLatexContent] = useState(resume?.latexContent || "");
  const [clickedText, setClickedText] = useState<string | null>(null);

  useEffect(() => {
    if (resume && resume.generationStatus !== "completed") {
      redirect("customize_resume_status", { resumeId });
    }
  }, [resume, redirect, resumeId]);

  useEffect(() => {
    handleUpdateResumeLaTeXContent(latexContent);
  }, [latexContent]);

  useEffect(() => {
    if (resume?.latexContent) {
      setLatexContent(resume.latexContent);
    }
  }, [resume?.latexContent]);

  const handleUpdateResumeLaTeXContent = useDebouncedCallback(
    async (latexContent: string) => {
      setIsSaving(true);
      await updateResumeLaTeXContent({
        resumeId,
        latexContent,
      });
      setIsSaving(false);
      setLastSaved(new Date());
    },
    1500,
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">Loading resume...</p>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <p className="mt-4 text-sm text-red-500">Resume not found</p>
      </div>
    );
  }

  const isGenerating = resume.generationStatus !== "completed";

  const handleCompileAndSave = async () => {
    if (isCompiling) return;

    try {
      setIsCompiling(true);
      await compileAndSaveResume({
        userId: user!.id,
        resumeId,
        latexContent,
      });
    } catch (error) {
      console.error("Failed to compile and save resume:", error);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleRegenerate = async () => {
    await restartResumeGeneration({
      resumeId,
      userId: user!.id,
      jobId: resume.jobId,
    });
    redirect("customize_resume_status", { resumeId });
  };

  const handleDelete = async () => {
    await deleteResume({
      resumeId,
      userId: user!.id,
    });
    redirect("home");
  };

  const handleImproveWithAI = (
    lineNumber: number | null,
    action: ImproveResumeActionType,
  ) => {
    if (lineNumber) {
      improveResumeLineWithAI({
        resumeId,
        userId: user!.id,
        lineNumber,
        latexContent,
        action,
      });
    }
  };

  const renderRightPanelContent = () => {
    if (!resume.jobId) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="flex border-b mt-2">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "insights"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("insights")}
          >
            Resume Insights
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "job"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("job")}
          >
            Job Details
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {activeTab === "insights" ? (
            <ResumeInsights userId={user!.id} resumeId={resumeId} />
          ) : (
            <JobDetails jobId={resume.jobId} userId={user!.id} />
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout
      rightPanelContent={renderRightPanelContent()}
      leftPanelContent={
        <div className="flex flex-col h-full">
          <div className="flex justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {isSaving ? (
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </div>
              ) : lastSaved ? (
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Check className="h-4 w-4 mr-2" />
                  Auto Saved {lastSaved.toLocaleTimeString()}
                </div>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCompileAndSave}
                disabled={isCompiling || isGenerating}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <File className="h-4 w-4" />
                {isCompiling ? "Compiling..." : "Recompile"}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleRegenerate}
                      variant="secondary"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Regenerate resume</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this resume? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete resume</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex-1">
            <CodeEditor
              value={latexContent}
              onChange={setLatexContent}
              readOnly={isGenerating}
              onSave={handleCompileAndSave}
              handleImproveWithAI={handleImproveWithAI}
              clickedText={clickedText}
            />
          </div>
        </div>
      }
      middlePanelContent={
        <>
          {isCompiling ? (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900">
                  Compiling Resume
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Please wait while we compile your resume. This may take a few
                  seconds.
                </p>
              </div>
            </div>
          ) : resume.userResumeCompilationErrorMessage ? (
            <div className="flex flex-col h-full">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Compilation Error
                    </h3>
                    <div className="mt-2 text-sm text-red-700 whitespace-pre-wrap font-mono">
                      {resume.userResumeCompilationErrorMessage}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
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
                    PDF Preview Unavailable
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please fix the LaTeX errors and try compiling again
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <PdfViewer
              pdfUrl={resume.compiledResumeUrl || null}
              generationStatus={resume.generationStatus}
              setClickedText={setClickedText}
            />
          )}
        </>
      }
    />
  );
};

export default EditResume;
