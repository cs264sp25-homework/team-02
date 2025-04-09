import Layout from "@/resume/layout";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useRouter } from "@/core/hooks/use-router";
import { Id } from "convex/_generated/dataModel";
import { useQueryResume } from "../hooks/use-query-resume";
import { PdfViewer } from "../components/pdf-viewer";

const EditResume = () => {
  const { isAuthenticated, user } = useAuth();
  const { redirect, params } = useRouter();

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

  return (
    <Layout
      leftPanelContent={<div>Left Panel</div>}
      middlePanelContent={
        <PdfViewer
          pdfUrl={resume.compiledResumeUrl || null}
          generationStatus={resume.generationStatus}
        />
      }
      rightPanelContent={null}
    />
  );
};

export default EditResume;
