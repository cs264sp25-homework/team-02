import { useRouter } from "@/core/hooks/use-router";
import { api } from "../../../convex/_generated/api";
import { useQuery, useMutation, useAction } from "convex/react";
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
import { useState, useEffect } from "react";
import { useMutationJob } from "../hooks/use-mutation-job";
import { useAuth } from "@/linkedin/hooks/useAuth";
import Tesseract from "tesseract.js";
import { formatProfileBackground } from "../utils/profile";
import { extractQuestions } from "../utils/clean";

const JobDetailsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { params, navigate, redirect } = useRouter();

  if (!isAuthenticated) {
    redirect("login");
  }
  const jobId = params.jobId as Id<"jobs">;
  const job = useQuery(api.jobs.getJobById, { jobId, userId: user!.id });
  const [answers, setAnswers] = useState<string[]>([]);
  const { updateAnswer } = useMutationJob();
  const updateJob = useMutation(api.jobs.updateJob);
  const profile = useQuery(api.profiles.getProfileByUserId, {
    userId: user!.id,
  });
  const getAiGeneratedJobQuestions = useAction(api.openai.generateJobQuestions);

  // Initialize and update answers when job data changes
  useEffect(() => {
    if (job?.answers) {
      console.log("Updating answers from job:", job.answers);
      setAnswers(job.answers);
    }
  }, [job?.answers]);

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

      let jobUpdated: boolean;

      if (imageContentType === "requirements") {
        // update the job description
        jobUpdated = await updateJob({
          userId: user!.id,
          jobId: job!._id,
          description: text,
        });
      } else {
        // update the job questions
        jobUpdated = await updateJob({
          userId: user!.id,
          jobId: job!._id,
          questions: extractQuestions(text),
        });
      }

      console.log("Updated job:", jobUpdated);

      if (jobUpdated) {
        console.log("Image parsed and job updated successfully");
        toast.success("Image parsed and job updated successfully");
        const answersFromAi = await getAiGeneratedJobQuestions({
          jobTitle: job!.title,
          jobRequirements: job!.description,
          jobQuestions: job!.questions,
          userBackground: formatProfileBackground(profile),
        });
        jobUpdated = await updateJob({
          userId: user!.id,
          jobId: job!._id,
          answers: answersFromAi,
        });
        if (jobUpdated) {
          console.log("Setting AI-generated answers:", answersFromAi);
          setAnswers(answersFromAi);
          toast.success("AI-generated answers updated successfully");
        }
      }
    } catch (error) {
      toast.error("Failed to parse image or update job");
      console.error("Error:", error);
    }
  };

  const saveAnswer = async (index: number, answer: string) => {
    try {
      console.log("Saving answer at index:", index, "Answer:", answer);
      const saved = await updateAnswer(user!.id, jobId, index, answer);
      if (saved) {
        // Update local state immediately for better UX
        setAnswers((prev) => {
          const newAnswers = [...prev];
          newAnswers[index] = answer;
          return newAnswers;
        });
        toast.success("Answer saved");
      } else {
        toast.error("Failed to save answer");
      }
    } catch (error) {
      console.error("Error saving answer:", error);
      toast.error("Error saving answer");
    }
  };

  // index number should be used as the index of the answer to be improved
  const handleAiAction = (action: string) => {
    switch (action) {
      case "refine":
        toast.info("Refining response...");
        break;
      case "generate":
        toast.info("Generating updated response...");
        break;
      case "optimize":
        toast.info("Optimizing response...");
        break;
      case "tone":
        toast.info("Adjusting tone...");
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
                          onClick={() =>
                            saveAnswer(index, answers[index] || "")
                          }
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                      </div>
                      <div className="flex-shrink-0">
                        <AiDropdownMenu
                          onSelect={(action) => handleAiAction(action)}
                        />
                      </div>
                    </div>
                    <Textarea
                      value={answers[index] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => {
                          const newAnswers = [...prev];
                          newAnswers[index] = e.target.value;
                          return newAnswers;
                        })
                      }
                      placeholder="This will contain auto-generated answers. Loading..."
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
