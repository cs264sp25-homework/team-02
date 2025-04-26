import { ProfileType } from "convex/profiles";
import { GenerationStatusType } from "../../../convex/resume/schema";
import { cn } from "@/core/lib/utils";
import TailoredProfileInsights from "./tailored-profile-insights";
interface ResumeGenerationTimelineProps {
  currentStatus: GenerationStatusType;
  error?: string;
  statusBeforeFailure?: GenerationStatusType;
  tailoredProfile?: ProfileType;
}

export const ResumeGenerationTimeline = ({
  currentStatus,
  error,
  statusBeforeFailure,
  tailoredProfile,
}: ResumeGenerationTimelineProps) => {
  const STATUS_STAGES: { status: GenerationStatusType; label: string }[] = [
    { status: "started", label: "Generation Started" },
    { status: "fetching profile", label: "Fetching Profile" },
    { status: "fetching job description", label: "Fetching Job Description" },
    {
      status: "generating tailored profile",
      label: "Generating Tailored Profile",
    },
    {
      status: "generating tailored resume",
      label: "Generating Tailored Resume",
    },
    { status: "enhancing resume with AI", label: "Enhancing Resume with AI" },
    { status: "providing resume insights", label: "Providing Resume Insights" },
    { status: "compiling resume", label: "Compiling Resume" },
    { status: "completed", label: "Completed" },
  ];

  let currentIndex;
  if (currentStatus === "failed" && statusBeforeFailure) {
    currentIndex = STATUS_STAGES.findIndex(
      (stage) => stage.status === statusBeforeFailure,
    );
  } else {
    currentIndex = STATUS_STAGES.findIndex(
      (stage) => stage.status === currentStatus,
    );
  }
  if (currentStatus === "failed" && statusBeforeFailure) {
    const failedStageIndex = STATUS_STAGES.findIndex(
      (stage) => stage.status === statusBeforeFailure,
    );
    STATUS_STAGES[failedStageIndex].label += " (Failed)";
    STATUS_STAGES[failedStageIndex].status = "failed";
  }

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
                    "absolute left-4 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-colors duration-300",
                    isCompleted && "bg-green-500 border-green-500",
                    isCurrent &&
                      !isFailed &&
                      "bg-blue-500 border-blue-500 animate-pulse",
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
                      "text-sm font-medium text-left",
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
                  {stage.status === "generating tailored profile" &&
                    isCompleted &&
                    tailoredProfile && (
                      <TailoredProfileInsights
                        tailoredProfile={tailoredProfile}
                      />
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
