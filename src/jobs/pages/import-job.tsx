import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import ImportJobForm from "../components/ImportJobForm";
import JobEntryToggle from "../components/JobEntryToggle";
import ManualEntryForm from "../components/ManualEntryForm";

const ImportJobPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { navigate, redirect } = useRouter();

  if (!isAuthenticated) {
    redirect("login");
  }

  const [mode, setMode] = useState<"import" | "manual">("import");

  const handleSuccess = (jobId: string) => {
    toast.success("Job added successfully!");
    navigate("job_details", { jobId });
  };

  const handleError = () => {
    toast.error("Failed to add job.");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-2">
        <div className="flex justify-end">
          <JobEntryToggle mode={mode} setMode={setMode} />
        </div>
        {mode === "import" ? (
          <ImportJobForm
            userId={user!.id}
            onSuccess={handleSuccess}
            onFailure={handleError}
          />
        ) : (
          <ManualEntryForm
            userId={user!.id}
            onSuccess={handleSuccess}
            onFailure={handleError}
          />
        )}
      </div>
    </div>
  );
};

export default ImportJobPage;
