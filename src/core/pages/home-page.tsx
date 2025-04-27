import { useEffect, useState } from "react";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardFooter,
} from "@/core/components/card";
import { Skeleton } from "@/core/components/skeleton";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { JobType } from "convex/jobs";
import { 
  PlusCircle, 
  FileText, 
  Trash2, 
  HelpCircle, 
  Calendar, 
  MoreVertical,
  ExternalLink 
} from "lucide-react";
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/core/components/dropdown-menu";
import { toast } from "sonner";
import EditableJobTitle from "@/jobs/components/EditableJobTitle";
import CustomizeResumeButton from "@/resume/components/customize-resume-button";

// Extended type that includes Convex's _id field
type JobWithId = JobType & { _id: Id<"jobs"> };

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const { navigate } = useRouter();
  const [jobs, setJobs] = useState<JobWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jobToDelete, setJobToDelete] = useState<Id<"jobs"> | null>(null);
  
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

  // Format date to more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  // Truncate text with ellipsis
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
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
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Jobs</h1>
        <Button onClick={handleImportJob}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Import Job
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-72">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card 
              key={job._id.toString()} 
              className="group transition-shadow hover:shadow-md cursor-pointer h-full flex flex-col"
              onClick={() => navigate("job_details", { jobId: job._id })}
            >
              <CardHeader className="pb-2 relative">
                <div className="absolute right-2 top-2 z-10" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => navigate("job_details", { jobId: job._id })}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Application Questions
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(job.postingUrl, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Job Posting
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => navigate("interview_prep")}
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Prepare for Interview
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setJobToDelete(job._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Job
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <EditableJobTitle
                    jobId={job._id}
                    userId={user!.id}
                    initialTitle={job.title}
                  />
                </div>
                <CardDescription className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(job.createdAt)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 pb-4">
                <div className="bg-gray-50 rounded-md p-3 mb-4 max-h-32 overflow-y-auto">
                  <h4 className="text-sm font-medium mb-1">Job Requirements</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-4">
                    {job.description === "No requirements found" 
                      ? "No requirements provided" 
                      : truncateText(job.description, 150)}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Questions:</span>{" "}
                  {job.questions.length > 0 
                    ? `${job.questions.length} application questions` 
                    : "No questions found"}
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 pb-4 flex flex-wrap gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("job_details", { jobId: job._id });
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Questions
                </Button>
                <div onClick={(e) => e.stopPropagation()}>
                  <CustomizeResumeButton
                    jobId={job._id}
                    userId={user!.id}
                  />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
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