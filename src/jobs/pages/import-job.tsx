import { useState } from "react";
import { Button } from "@/core/components/button";
import { Input } from "@/core/components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { Loader2 } from "lucide-react";
import { useMutationJobs } from "../hooks/use-mutation-jobs";
import { toast } from "sonner";
import { useRouter } from "@/core/hooks/use-router";

const ImportJobPage = () => {
  const [applicationUrl, setApplicationUrl] = useState("");
  const [postingUrl, setPostingUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { add: addJob } = useMutationJobs();
  const { navigate } = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const jobId = await addJob(postingUrl, applicationUrl);
      console.log("jobId", jobId);
      if (jobId) {
        toast.success("Job added successfully");
        navigate("job_details", { jobId });
      }
    } catch (error) {
      console.error("Error importing job posting:", error);
      toast.error("Error importing job posting");
    } finally {
      setPostingUrl("");
      setApplicationUrl("");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Import Job Posting and Application Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="postingUrl" className="text-sm font-medium">
                Job Posting URL
              </label>
              <Input
                id="postingUrl"
                type="url"
                placeholder="Paste job posting link here..."
                value={postingUrl}
                onChange={(e) => setPostingUrl(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="applicationUrl" className="text-sm font-medium">
                Application URL
              </label>
              <Input
                id="applicationUrl"
                type="url"
                placeholder="Paste application link here..."
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportJobPage;
