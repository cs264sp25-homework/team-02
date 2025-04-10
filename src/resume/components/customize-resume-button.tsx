import { Button } from "@/core/components/button";
import { Download } from "lucide-react";
import { useRouter } from "@/core/hooks/use-router";
import { Id } from "convex/_generated/dataModel";
import { useMutationResume } from "../hooks/use-muatation-resume";
import { useQueryResumeByJob } from "../hooks/use-query-resume-by-job";
import { Skeleton } from "@/core/components/skeleton";
interface CustomizeResumeButtonProps {
  jobId: Id<"jobs">;
  userId: string;
}

function CustomizeResumeButton({ jobId, userId }: CustomizeResumeButtonProps) {
  const { navigate } = useRouter();
  const { resume, loading } = useQueryResumeByJob(userId, jobId);
  const { startResumeGeneration } = useMutationResume();

  if (loading) {
    return <Skeleton className="h-4 w-4" />;
  }

  const handleCustomizeResume = async (jobId: Id<"jobs">) => {
    if (resume) {
      navigate("edit_resume", { resumeId: resume._id });
      return;
    } else {
      const resumeId = await startResumeGeneration({
        userId,
        jobId,
      });
      navigate("customize_resume_status", { resumeId });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        handleCustomizeResume(jobId);
      }}
    >
      <Download className="mr-2 h-4 w-4" />
      Customize Resume
    </Button>
  );
}

export default CustomizeResumeButton;
