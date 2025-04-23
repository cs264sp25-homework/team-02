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
import { Pencil } from "lucide-react";

const JobDetailsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { params, navigate, redirect } = useRouter();

  if (!isAuthenticated) {
    redirect("login");
  }

  const [isEditingTitle, setIsEditingTitle] = useState(false); // Edit mode state
  const [editedTitle, setEditedTitle] = useState(""); // Updated title state

  const handleEditClick = () => {
    setIsEditingTitle(true); // Enable edit mode
    setEditedTitle(job?.title || ""); // Set the current title as the initial value
  };

  const handleSaveTitle = async () => {
    try {
      // Update the title in the backend
      const updated = await updateJob({
        userId: user!.id,
        jobId: jobId,
        title: editedTitle,
      });

      if (updated) {
        toast.success("Job title updated successfully!");
        setIsEditingTitle(false); // Exit edit mode
      } else {
        toast.error("Failed to update job title.");
      }
    } catch (error) {
      console.error("Error updating job title:", error);
      toast.error("Error updating job title.");
    }
  };

  const jobId = params.jobId as Id<"jobs">;
  const job = useQuery(api.jobs.getJobById, { jobId, userId: user!.id });
  const [answers, setAnswers] = useState<string[]>([]);
  const { updateAnswer } = useMutationJob();
  const updateJob = useMutation(api.jobs.updateJob);
  const profile = useQuery(api.profiles.getProfileByUserId, {
    userId: user!.id,
  });
  const getAiGeneratedJobQuestions = useAction(api.openai.generateJobQuestions);
  const extractRequiredSkills = useAction(api.jobs.extractRequiredSkills);

  const refineResponse = useAction(api.openai.refineResponse);
  const regenerateResponse = useAction(api.openai.regenerateResponse);
  const optimizeResponse = useAction(api.openai.optimizeResponse);
  const adjustTone = useAction(api.openai.adjustTone);

  // Initialize and update answers when job data changes
  useEffect(() => {
    if (job?.answers) {
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

      let jobUpdated: boolean;

      if (imageContentType === "requirements") {
        // update the job description
        jobUpdated = await updateJob({
          userId: user!.id,
          jobId: job!._id,
          description: text,
        });

        await extractRequiredSkills({
          jobId: jobId,
          userId: user!.id,
          requirements: text,
        });
      } else {
        // update the job questions
        jobUpdated = await updateJob({
          userId: user!.id,
          jobId: job!._id,
          questions: extractQuestions(text),
        });
      }

      // need to fix this, don't geenerated AI answers if there are not questions, if the questions array is empty

      if (jobUpdated && job!.questions.length > 0) {
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
  const handleAiAction = async (
    action: string,
    question: string,
    index: number,
  ) => {
    const userBackground = formatProfileBackground(profile);
    let newResponse = "";

    switch (action) {
      case "refine":
        toast.info("Refining response...");
        {
          newResponse = await refineResponse({
            jobTitle: job?.title || "",
            jobRequirements: job?.description || "",
            jobQuestion: question,
            userResponse: answers[index] || "",
            userBackground: userBackground,
          });
        }
        break;
      case "generate":
        toast.info("Generating updated response...");
        {
          newResponse = await regenerateResponse({
            jobTitle: job?.title || "",
            jobRequirements: job?.description || "",
            jobQuestion: question,
            userResponse: answers[index] || "",
            userBackground: userBackground,
          });
        }
        break;
      case "optimize":
        toast.info("Optimizing response...");
        {
          newResponse = await optimizeResponse({
            jobTitle: job?.title || "",
            jobRequirements: job?.description || "",
            jobQuestion: question,
            userResponse: answers[index] || "",
            userBackground: userBackground,
          });
        }
        break;
      case "tone":
        toast.info("Adjusting tone...");
        {
          newResponse = await adjustTone({
            jobTitle: job?.title || "",
            jobRequirements: job?.description || "",
            jobQuestion: question,
            userResponse: answers[index] || "",
            userBackground: userBackground,
          });
        }
        break;
    }

    if (newResponse) {
      const updated = await updateAnswer(user!.id, jobId, index, newResponse);
      if (updated) {
        toast.success("Response updated successfully in db");
      } else {
        console.error("Failed to update answer");
        toast.error("Failed to update answer in db");
      }
      // Update the local state immediately for better UX
      setAnswers((prev) => {
        const newAnswers = [...prev];
        newAnswers[index] = newResponse;
        return newAnswers;
      });
      toast.success("Response updated successfully");
    } else {
      toast.error("No response generated, no update");
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
        <div className="flex items-center justify-between px-4 py-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 w-full"
                autoFocus
              />
              <Button variant="outline" size="sm" onClick={handleSaveTitle}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full gap-2">
              <CardTitle className="whitespace-nowrap overflow-hidden text-ellipsis">
                {job.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleEditClick}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
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
                          onSelect={(action) =>
                            handleAiAction(action, question, index)
                          }
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
