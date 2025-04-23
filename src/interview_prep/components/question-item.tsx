import { Button } from "@/core/components/button";
import { Textarea } from "@/core/components/textarea";
import { Loader2, Brain, MessageSquareQuote } from "lucide-react";

interface QuestionItemProps {
  questionId: string;
  questionText: string;
  questionNumber: number;
  questionType: "technical" | "nonTechnical";
  userAnswer: string;
  aiResponse: string;
  isLoadingFeedback: boolean;
  isLoadingSample: boolean;
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

export function QuestionItem({
  questionId,
  questionText,
  questionNumber,
  questionType,
  userAnswer,
  aiResponse,
  isLoadingFeedback,
  isLoadingSample,
  onAnswerChange,
  onGetFeedback,
  onGenerateSample,
}: QuestionItemProps) {
  return (
    <div className="space-y-3 border-b pb-4 last:border-b-0 last:pb-0">
      <p className="font-medium text-sm">
        {questionNumber}. {questionText}
      </p>
      <Textarea
        placeholder="Type your answer here..."
        className="w-full text-sm"
        rows={4}
        value={userAnswer}
        onChange={(e) => onAnswerChange(questionId, e.target.value)}
      />
      <Textarea
        placeholder="AI feedback or sample answer will appear here..."
        className="w-full text-sm bg-muted/50"
        rows={4}
        readOnly
        value={aiResponse}
      />
      <div className="flex space-x-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onGetFeedback(questionId, questionText, questionType)}
          disabled={!userAnswer.trim() || isLoadingFeedback || isLoadingSample}
        >
          {isLoadingFeedback ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Brain className="mr-1.5 h-3.5 w-3.5" />
          )}
          Get Feedback
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onGenerateSample(questionId, questionText, questionType)
          }
          disabled={isLoadingFeedback || isLoadingSample}
        >
          {isLoadingSample ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <MessageSquareQuote className="mr-1.5 h-3.5 w-3.5" />
          )}
          Generate Sample
        </Button>
      </div>
    </div>
  );
}
