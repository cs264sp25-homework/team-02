import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { Id } from "convex/_generated/dataModel";
import { useQueryResume } from "../hooks/use-query-resume";
import { ResumeGenerationTimeline } from "../components/resume-generation-timeline";

export const CustomizeResumeStatus = () => {
  const { isAuthenticated, user } = useAuth();
  const { params, redirect } = useRouter();

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Resume Generation Status</h1>
      <ResumeGenerationTimeline
        currentStatus={resume.generationStatus}
        error={resume.generationError}
      />
    </div>
  );
};
