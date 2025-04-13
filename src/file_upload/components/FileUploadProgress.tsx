import { cn } from "@/core/lib/utils";

export type FileUploadStage =
  | "idle"
  | "uploading"
  | "extracting"
  | "parsing"
  | "updating_profile"
  | "completed"
  | "failed";

interface FileUploadProgressProps {
  currentStage: FileUploadStage;
  error?: string;
}

const STAGES: { stage: FileUploadStage; label: string }[] = [
  { stage: "uploading", label: "Uploading File" },
  { stage: "extracting", label: "Extracting Text" },
  { stage: "parsing", label: "Parsing Resume with AI" },
  { stage: "updating_profile", label: "Updating Profile" },
  { stage: "completed", label: "Completed" },
];

export const FileUploadProgress = ({
  currentStage,
  error,
}: FileUploadProgressProps) => {
  if (currentStage === "idle") {
    return null; // Don't show anything if idle
  }

  let activeIndex = STAGES.findIndex((s) => s.stage === currentStage);
  if (currentStage === "failed") {
    activeIndex = STAGES.findIndex((s) => s.stage === "updating_profile");
  } else if (currentStage === "completed") {
    activeIndex = STAGES.length - 1; // Mark all as completed
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 border rounded-lg my-4">
      <h4 className="text-sm font-medium text-center mb-4">
        Processing Status
      </h4>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200" />

        {/* Timeline items */}
        <div className="space-y-6">
          {STAGES.map((stageInfo, index) => {
            // Determine stage status
            const isCompleted =
              currentStage === "completed" || index < activeIndex;
            const isActive = index === activeIndex && currentStage !== "failed";
            const isFailed = index === activeIndex && currentStage === "failed";

            return (
              <div key={stageInfo.stage} className="relative flex items-start">
                {/* Status indicator */}
                <div
                  className={cn(
                    "absolute left-4 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-colors duration-300",
                    isCompleted && "bg-green-500 border-green-500", // Completed
                    isActive && "bg-blue-500 border-blue-500 animate-pulse", // Active
                    isFailed && "bg-red-500 border-red-500", // Failed
                    !isCompleted &&
                      !isActive &&
                      !isFailed &&
                      "bg-white border-gray-300", // Pending
                  )}
                />

                {/* Content */}
                <div className="ml-8">
                  <h3
                    className={cn(
                      "text-sm font-medium text-left transition-colors duration-300",
                      isCompleted && "text-green-600",
                      isActive && "text-blue-600",
                      isFailed && "text-red-600",
                      !isCompleted && !isActive && !isFailed && "text-gray-500",
                    )}
                  >
                    {stageInfo.label}
                    {isFailed && " (Failed)"}
                  </h3>
                  {isFailed && error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
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
