import { GenerationStatusType } from "../../../convex/resume/schema";
import { cn } from "@/core/lib/utils";

const STATUS_STAGES: { status: GenerationStatusType; label: string }[] = [
  { status: "started", label: "Generation Started" },
  { status: "fetching profile", label: "Fetching Profile" },
  { status: "fetching job description", label: "Fetching Job Description" },
  {
    status: "generating tailored profile",
    label: "Generating Tailored Profile",
  },
  { status: "generating tailored resume", label: "Generating Tailored Resume" },
  { status: "enhancing resume with AI", label: "Enhancing Resume with AI" },
  { status: "compiling resume", label: "Compiling Resume" },
  { status: "completed", label: "Completed" },
];

interface ResumeGenerationTimelineProps {
  currentStatus: GenerationStatusType;
  error?: string;
}

export const ResumeGenerationTimeline = ({
  currentStatus,
  error,
}: ResumeGenerationTimelineProps) => {
  const currentIndex = STATUS_STAGES.findIndex(
    (stage) => stage.status === currentStatus,
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200" />

        {/* Timeline items */}
        <div className="space-y-8">
          {STATUS_STAGES.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFailed =
              currentStatus === "failed" && index === currentIndex;

            return (
              <div key={stage.status} className="relative flex items-start">
                {/* Status indicator */}
                <div
                  className={cn(
                    "absolute left-4 -translate-x-1/2 w-4 h-4 rounded-full border-2",
                    isCompleted && "bg-green-500 border-green-500",
                    isCurrent && !isFailed && "bg-blue-500 border-blue-500",
                    isFailed && "bg-red-500 border-red-500",
                    !isCompleted &&
                      !isCurrent &&
                      !isFailed &&
                      "bg-white border-gray-300",
                  )}
                />

                {/* Content */}
                <div className="ml-8">
                  <h3
                    className={cn(
                      "text-sm font-medium",
                      isCompleted && "text-green-600",
                      isCurrent && !isFailed && "text-blue-600",
                      isFailed && "text-red-600",
                      !isCompleted &&
                        !isCurrent &&
                        !isFailed &&
                        "text-gray-500",
                    )}
                  >
                    {stage.label}
                  </h3>
                  {isFailed && error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
