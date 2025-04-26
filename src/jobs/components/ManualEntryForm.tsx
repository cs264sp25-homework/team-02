import React, { useState } from "react";
import { Trash } from "lucide-react"; // Import the trash icon
import { Button } from "@/core/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { Input } from "@/core/components/input";
import { Textarea } from "@/core/components/textarea";
import { useAddJob } from "../hooks/use-mutation-jobs";

interface ManualEntryFormProps {
  userId: string;
  onSuccess: (jobId: string) => void;
  onFailure: () => void;
}

const ManualEntryForm: React.FC<ManualEntryFormProps> = ({
  userId,
  onSuccess,
  onFailure,
}) => {
  const { inputJobData } = useAddJob(userId);

  const [jobTitle, setJobTitle] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);

  const handleAddQuestion = () => setQuestions([...questions, ""]);

  const handleQuestionChange = (index: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = value;
    setQuestions(updatedQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const jobId = await inputJobData(jobTitle, jobRequirements, questions);
      if (jobId) {
        onSuccess(jobId);
      }
    } catch (error) {
      console.error("Error adding job:", error);
      onFailure();
    } finally {
      setJobTitle("");
      setJobRequirements("");
      setQuestions([]);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Input Job Details Manually</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <label
              htmlFor="jobTitle"
              className="w-1/3 text-sm font-medium text-left"
            >
              Job Title
            </label>
            <Input
              id="jobTitle"
              type="text"
              placeholder="Enter job title..."
              required
              value={jobTitle}
              onChange={(e) => {
                setJobTitle(e.target.value);
              }}
            ></Input>
          </div>

          <div className="flex items-start gap-4">
            <label
              htmlFor="jobDescription"
              className="w-1/3 text-sm font-medium text-left"
            >
              Job Requirements
            </label>
            <Textarea
              required
              id="jobDescription"
              placeholder="Enter job requirements..."
              rows={4}
              value={jobRequirements}
              onChange={(e) => {
                setJobRequirements(e.target.value);
              }}
            ></Textarea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-left">
              Job Application Questions
            </label>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="flex items-center gap-4">
                  <label className="w-1/3 text-sm text-left">
                    Question {index + 1}
                  </label>
                  <Input
                    type="text"
                    value={question}
                    onChange={(e) =>
                      handleQuestionChange(index, e.target.value)
                    }
                    placeholder="Enter question..."
                  />
                  <Button onClick={() => handleDeleteQuestion(index)}>
                    <Trash />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" className="mt-4" onClick={handleAddQuestion}>
              Add Question
            </Button>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Add Job</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManualEntryForm;
