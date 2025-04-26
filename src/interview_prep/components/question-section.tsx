import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/card";
import { QuestionItem } from "./question-item";

interface QuestionState {
  userAnswer: string;
  aiResponse: string;
  isLoadingFeedback: boolean;
  isLoadingSample: boolean;
}

type QuestionsStateMap = {
  [questionId: string]: QuestionState;
};

interface QuestionSectionProps {
  title: string;
  questions: string[];
  questionType: "technical" | "nonTechnical";
  questionsState: QuestionsStateMap;
  onAnswerChange: (questionId: string, value: string) => void;
  onGetFeedback: (
    questionId: string,
    questionText: string,
    questionType: "technical" | "nonTechnical",
  ) => void;
  onGenerateSample: (
    questionId: string,
    questionText: string,
    questionType: "technical" | "nonTechnical",
  ) => void;
}

export function QuestionSection({
  title,
  questions,
  questionType,
  questionsState,
  onAnswerChange,
  onGetFeedback,
  onGenerateSample,
}: QuestionSectionProps) {
  const prefix = questionType === "technical" ? "tech" : "nontech";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.length > 0 ? (
          questions.map((question, index) => {
            const questionId = `${prefix}-${index}`;
            const questionState = questionsState[questionId] || {
              userAnswer: "",
              aiResponse: "",
              isLoadingFeedback: false,
              isLoadingSample: false,
            };

            return (
              <QuestionItem
                key={questionId}
                questionId={questionId}
                questionText={question}
                questionNumber={index + 1}
                questionType={questionType}
                userAnswer={questionState.userAnswer}
                aiResponse={questionState.aiResponse}
                isLoadingFeedback={questionState.isLoadingFeedback}
                isLoadingSample={questionState.isLoadingSample}
                onAnswerChange={onAnswerChange}
                onGetFeedback={onGetFeedback}
                onGenerateSample={onGenerateSample}
              />
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">
            No {questionType.toLowerCase()} questions generated.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
