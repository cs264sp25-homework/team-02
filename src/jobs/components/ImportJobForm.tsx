import React from "react";
import { useState } from "react";
import { Button } from "@/core/components/button";
import { Input } from "@/core/components/input";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { useAddJob } from "../hooks/use-mutation-jobs";

interface ImportJobFormProps {
  userId: string;
  onSuccess: (jobId: string) => void;
  onFailure: () => void;
}

const ImportJobForm: React.FC<ImportJobFormProps> = ({
  userId,
  onSuccess,
  onFailure,
}) => {
  const [applicationUrl, setApplicationUrl] = useState("");
  const [postingUrl, setPostingUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { importJob } = useAddJob(userId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const jobId = await importJob(postingUrl, applicationUrl);
      if (jobId) {
        onSuccess(jobId);
      }
    } catch (error) {
      console.log(`Error: ${error}`);
      onFailure();
    } finally {
      setPostingUrl("");
      setApplicationUrl("");
      setIsLoading(false);
    }
  };

  return (
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
  );
};

export default ImportJobForm;
