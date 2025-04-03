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
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { JobType } from "convex/jobs";
import { PlusCircle, FileText, Download } from "lucide-react";
import { Id } from "convex/_generated/dataModel";

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const { navigate } = useRouter();
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use a query hook to get all jobs for the current user
  const allJobs = useQuery(api.jobs.getAllJobs, user?.id ? { userId: user.id } : "skip");

  useEffect(() => {
    if (allJobs !== undefined) {
      setJobs(allJobs || []);
      setIsLoading(false);
    }
  }, [allJobs]);

  // Handle navigation to job details page
  const handleViewJobDetails = (jobId: Id<"jobs">) => {
    navigate("job_details", { jobId });
  };

  // Handle navigation to resume generation page
  const handleCustomizeResume = (jobId: Id<"jobs">) => {
    // For now, we'll just navigate to job details
    // This will be updated later when we implement resume customization
    navigate("job_details", { jobId });
  };

  // Handle job import
  const handleImportJob = () => {
    navigate("import_job");
  };

  // If user is not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <h2 className="text-xl font-semibold">Welcome to JobSync</h2>
            <p className="text-muted-foreground text-center max-w-md">
              JobSync helps you manage job applications, generate tailored resumes, and prepare
              responses for application questions.
            </p>
            <Button onClick={() => navigate("login")}>Sign in to continue</Button>
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
              You haven't imported any jobs yet. Import your first job to get started.
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
                    <tr key={job._id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">{job.title}</td>
                      <td className="px-4 py-3">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewJobDetails(job._id)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Job Application Questions
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCustomizeResume(job._id)}
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
    </div>
  );
};

export default HomePage;