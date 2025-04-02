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
import { ProfileType } from "../../../convex/profiles";

export const formatProfileBackground = (
  profile: ProfileType | null | undefined,
) => {
  if (!profile) return "";

  const sections = [];

  // Education
  if (profile.education?.length > 0) {
    sections.push("Education:");
    profile.education.forEach((edu) => {
      sections.push(`- ${edu.degree} in ${edu.field} from ${edu.institution}`);
      if (edu.description) sections.push(`  ${edu.description}`);
    });
  }

  // Work Experience
  if (profile.workExperience?.length > 0) {
    sections.push("\nWork Experience:");
    profile.workExperience.forEach((work) => {
      sections.push(`- ${work.position} at ${work.company}`);
      if (work.description?.length > 0) {
        work.description.forEach((desc) => {
          sections.push(`  ${desc}`);
        });
      }
      if (work.technologies && work.technologies.length > 0) {
        sections.push(`  Technologies: ${work.technologies.join(", ")}`);
      }
    });
  }

  // Projects
  if (profile.projects?.length > 0) {
    sections.push("\nProjects:");
    profile.projects.forEach((project) => {
      sections.push(`- ${project.name}`);
      if (project.description?.length > 0) {
        project.description.forEach((desc) => {
          sections.push(`  ${desc}`);
        });
      }
      if (project.technologies && project.technologies.length > 0) {
        sections.push(`  Technologies: ${project.technologies.join(", ")}`);
      }
      if (project.highlights && project.highlights.length > 0) {
        sections.push(`  Highlights: ${project.highlights.join(", ")}`);
      }
    });
  }

  // Skills
  if (profile.skills?.length > 0) {
    sections.push("\nSkills:");
    sections.push(profile.skills.join(", "));
  }

  // Work Experience
  if (profile.workExperience?.length > 0) {
    // Check if there are any work experiences
    sections.push("\nWork Experience:"); // Add "Work Experience:" as a section header with a newline

    profile.workExperience.forEach((work) => {
      // Loop through each work experience
      sections.push(`- ${work.position} at ${work.company}`); // Add main work entry

      if (work.description?.length > 0) {
        // If there are descriptions
        work.description.forEach((desc) => {
          // Loop through each description
          sections.push(`  ${desc}`); // Add each description with indentation
        });
      }

      if (work.technologies && work.technologies.length > 0) {
        // If there are technologies
        sections.push(`  Technologies: ${work.technologies.join(", ")}`); // Add technologies list
      }
    });
  }

  return sections.join("\n");
};

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
          questions: text.split("\n").filter((line) => line.trim()),
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
                          onSelect={(action) => handleAiAction(index, action)}
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
