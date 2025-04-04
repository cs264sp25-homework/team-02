import { useEffect, useState } from "react";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { Skeleton } from "@/core/components/skeleton";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { JobType } from "convex/jobs";
import { PlusCircle, FileText, Download, Trash2 } from "lucide-react";
import { Id } from "convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/alert-dialog";
import { toast } from "sonner";
import { useMutationResume } from "@/resume/hooks/use-muatation-resume";

// Extended type that includes Convex's _id field
type JobWithId = JobType & { _id: Id<"jobs"> };

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const { navigate } = useRouter();
  const [jobs, setJobs] = useState<JobWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jobToDelete, setJobToDelete] = useState<Id<"jobs"> | null>(null);
  const { startResumeGeneration } = useMutationResume();
  // Use a query hook to get all jobs for the current user
  const allJobs = useQuery(
    api.jobs.getAllJobs,
    user?.id ? { userId: user.id } : "skip",
  );

  // Mutation to delete a job
  const deleteJobMutation = useMutation(api.jobs.deleteJob);

  useEffect(() => {
    if (allJobs !== undefined) {
      setJobs(allJobs || []);
      setIsLoading(false);
    }
  }, [allJobs]);

  // Handle job import
  const handleImportJob = () => {
    navigate("import_job");
  };

  // Handle job deletion
  const handleDeleteJob = async () => {
    if (!jobToDelete || !user) return;

    try {
      await deleteJobMutation({
        jobId: jobToDelete,
        userId: user.id,
      });

      // Update local state
      setJobs(jobs.filter((job) => job._id !== jobToDelete));
      toast.success("Job deleted successfully");
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    } finally {
      // Close the dialog
      setJobToDelete(null);
    }
  };

  const handleCustomizeResume = async (jobId: Id<"jobs">) => {
    const resumeId = await startResumeGeneration({
      userId: user!.id,
      jobId,
    });
    navigate("customize_resume_status", { resumeId });
  };

  // If user is not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <h2 className="text-xl font-semibold">Welcome to JobSync</h2>
            <p className="text-muted-foreground text-center max-w-md">
              JobSync helps you manage job applications, generate tailored
              resumes, and prepare responses for application questions.
            </p>
            <Button onClick={() => navigate("login")}>
              Sign in to continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Jobs</h1>
        <Button onClick={handleImportJob}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Import Job
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <h2 className="text-xl font-semibold">No jobs found</h2>
            <p className="text-muted-foreground text-center">
              You haven't imported any jobs yet. Import your first job to get
              started.
            </p>
            <Button onClick={handleImportJob}>Import Job</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Job Title</th>
                    <th className="px-4 py-2 text-left">Date Added</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job._id.toString()}
                      className="border-b hover:bg-muted/50 cursor-pointer relative"
                      onClick={() =>
                        navigate("job_details", { jobId: job._id })
                      }
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mr-2 h-8 w-8 p-0 text-muted-foreground hover:text-red-500 absolute left-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setJobToDelete(job._id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <span className="ml-8">{job.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("job_details", { jobId: job._id });
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Job Application Questions
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCustomizeResume(job._id);
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Customize Resume
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!jobToDelete}
        onOpenChange={() => setJobToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this job?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJob}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HomePage;
