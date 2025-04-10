import Layout from "@/resume/layout";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useRouter } from "@/core/hooks/use-router";
import { Id } from "convex/_generated/dataModel";
import { useQueryResume } from "../hooks/use-query-resume";
import { PdfViewer } from "../components/pdf-viewer";
import { CodeEditor } from "../components/code-editor";
import { useMutationResume } from "../hooks/use-muatation-resume";
import { Button } from "@/core/components/button";
import { Save, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const EditResume = () => {
  const { isAuthenticated, user } = useAuth();
  const { redirect, params } = useRouter();
  const { compileAndSaveResume } = useMutationResume();
  const [isCompiling, setIsCompiling] = useState(false);

  if (!isAuthenticated) {
    redirect("login");
  }

  const resumeId = params.resumeId as Id<"resumes">;
  const { resume, loading } = useQueryResume(resumeId, user!.id);
  const [latexContent, setLatexContent] = useState(resume?.latexContent || "");

  useEffect(() => {
    setLatexContent(resume?.latexContent || "");
  }, [resume?.latexContent]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!resume) {
    return <div>Resume not found</div>;
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
      toast.success("Resume compiled and saved successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to compile and save resume. Please try again.");
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <Layout
      leftPanelContent={
        <div className="flex flex-col h-full">
          <div className="flex justify-end p-4 border-b">
            <Button
              onClick={handleCompileAndSave}
              disabled={isCompiling || isGenerating}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isCompiling ? "Compiling..." : "Compile & Save"}
            </Button>
          </div>
          <div className="flex-1">
            <CodeEditor
              value={latexContent}
              onChange={setLatexContent}
              readOnly={isGenerating}
            />
          </div>
        </div>
      }
      middlePanelContent={
        <>
          {resume.userResumeCompilationErrorMessage ? (
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
            />
          )}
        </>
      }
      rightPanelContent={null}
    />
  );
};

export default EditResume;
