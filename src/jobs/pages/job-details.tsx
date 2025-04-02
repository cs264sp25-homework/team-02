import { useRouter } from "@/core/hooks/use-router";
import { api } from "../../../convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { Button } from "@/core/components/button";
import { ArrowLeft, Save } from "lucide-react";
import { Textarea } from "@/core/components/textarea";
import AiDropdownMenu from "../components/AiDropdownMenu";
import { ImageUpload } from "../components/ImageUpload";
import { toast } from "sonner";
import { useState } from "react";
import { useMutationJob } from "../hooks/use-mutation-job";
import { useAuth } from "@/linkedin/hooks/useAuth";
import Tesseract from "tesseract.js";

const JobDetailsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { params, navigate, redirect } = useRouter();

  if (!isAuthenticated) {
    redirect("login");
  }
  const jobId = params.jobId as Id<"jobs">;
  const job = useQuery(api.jobs.getJobById, { jobId, userId: user!.id });
  const [answers, setAnswers] = useState<string[]>(job?.answers || []);
  const { updateAnswer } = useMutationJob();
  const updateJob = useMutation(api.jobs.updateJob);

  const handleImageUpload = async (
    file: File,
    imageContentType: "requirements" | "questions",
  ) => {
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(
        file,
        "eng", // Language (English in this case)
      );
      console.log(text);

      let updatedJob: Id<"jobs"> | null;

      if (imageContentType === "requirements") {
        // update the job description
        updatedJob = await updateJob({
          userId: user!.id,
          jobId: job!._id,
          description: text,
        });
      } else {
        // update the job questions
        updatedJob = await updateJob({
          userId: user!.id,
          jobId: job!._id,
          questions: text.split("\n").filter((line) => line.trim()),
        });
      }

      if (updatedJob) {
        toast.success("Image parsed and job updated successfully");
      }
    } catch (error) {
      toast.error("Failed to parse image or update job");
      console.error("Error:", error);
    }
  };

  const saveAnswer = async (index: number, answer: string) => {
    const saved = await updateAnswer(user!.id, jobId, index, answer);
    if (saved) {
      toast.success("Answer saved");
    } else {
      toast.error("Failed to save answer");
    }
  };

  const handleAiAction = (index: number, action: string) => {
    switch (action) {
      case "improve":
        toast.info("Improving your answer...");
        // TODO: Implement AI improvement
        break;
      case "generate":
        toast.info("Generating new answer...");
        // TODO: Implement AI generation
        break;
    }
  };

  if (!job) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("import_job")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Import
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{job.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Requirements</h3>
            {job.description && job.description !== "No requirements found" && (
              <p className="whitespace-pre-wrap">{job.description}</p>
            )}
            {job.description === "No requirements found" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Unable to extract job requirements from provided link. Please
                  upload screenshot of the job requirements.
                </p>
                <ImageUpload
                  onImageUpload={(file) =>
                    handleImageUpload(file, "requirements")
                  }
                />
              </div>
            )}
          </div>

          {job.questions.length == 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Application Questions
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Unable to extract application questions from provided link.
                Please upload screenshot of the questions.
              </p>
              <ImageUpload
                onImageUpload={(file) => handleImageUpload(file, "questions")}
              />
            </div>
          )}

          {job.questions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Application Questions
              </h3>
              <ul className="space-y-4">
                {job.questions.map((question, index) => (
                  <li key={index} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-medium flex-1 text-left">
                        {question}
                      </span>
                      <div className="flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => saveAnswer(index, answers[index])}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      </div>
                      <div className="flex-shrink-0">
                        <AiDropdownMenu
                          onSelect={(action) => handleAiAction(index, action)}
                        />
                      </div>
                    </div>
                    <Textarea
                      value={answers[index] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [index]: e.target.value,
                        }))
                      }
                      placeholder="This will contain auto-generated answers. To be implemented."
                      className="mt-2"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobDetailsPage;
