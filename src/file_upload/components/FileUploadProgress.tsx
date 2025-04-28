import { cn } from "@/core/lib/utils";

export type FileUploadStage =
  | "idle"
  | "uploading"
  | "extracting"
  | "parsing"
  | "updating_profile"
  | "completed"
  | "failed";

type FileUploadProgressProps = {
  currentStage: FileUploadStage;
  error?: string;
  processingInfo?: {
    current: number;
    total: number;
  };
};

const stages: { key: FileUploadStage; label: string }[] = [
  { key: "uploading", label: "Uploading" },
  { key: "extracting", label: "Extracting Text" },
  { key: "parsing", label: "Parsing Resume Data" },
  { key: "updating_profile", label: "Updating Profile" },
  { key: "completed", label: "Completed" },
];

export function FileUploadProgress({
  currentStage,
  error,
  processingInfo,
}: FileUploadProgressProps) {
  // Calculate the current progress percentage
  const currentStageIndex = stages.findIndex(
    (stage) => stage.key === currentStage,
  );
  const totalStages = stages.length - 1; // Exclude "completed" from progress calculation
  const progress =
    currentStage === "completed"
      ? 100
      : currentStage === "failed"
        ? 100
        : currentStageIndex >= 0
          ? Math.round(
              ((currentStageIndex + (processingInfo?.current || 1)) /
                (totalStages + (processingInfo?.total || 1))) *
                100,
            )
          : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {currentStage === "completed"
            ? "Completed"
            : currentStage === "failed"
              ? "Failed"
              : `${
                  currentStage === "extracting" && processingInfo?.total
                    ? `Extracting (${processingInfo.current}/${processingInfo.total})`
                    : stages.find((stage) => stage.key === currentStage)
                        ?.label || "Processing"
                }`}
        </span>
        <span>{progress}%</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full transition-all duration-500",
            currentStage === "failed"
              ? "bg-destructive"
              : currentStage === "completed"
                ? "bg-primary"
                : "bg-primary animate-pulse",
          )}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
    </div>
  );
}
