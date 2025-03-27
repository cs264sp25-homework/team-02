import { useRouter } from "@/core/hooks/use-router";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";
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
import { toast } from "sonner";
import { useState } from "react";
import { useMutationJob } from "../hooks/use-mutation-job";

const JobDetailsPage = () => {
  const { params, navigate } = useRouter();
  const jobId = params.jobId as Id<"jobs">;
  const job = useQuery(api.jobs.getJobById, { jobId });
  const [answers, setAnswers] = useState<string[]>(job?.answers || []);
  const { updateAnswer } = useMutationJob();

  const saveAnswer = async (index: number, answer: string) => {
    const saved = await updateAnswer(job?._id, index, answer);
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
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="whitespace-pre-wrap">{job.description}</p>
          </div>

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
