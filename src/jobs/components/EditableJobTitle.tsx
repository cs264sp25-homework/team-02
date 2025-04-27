import { useState, useRef, useEffect } from "react";
import { Button } from "@/core/components/button";
import { Check, Pencil, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { cn } from "@/core/lib/utils";

interface EditableJobTitleProps {
  jobId: Id<"jobs">;
  userId: string;
  initialTitle: string;
}

// Maximum character limit for job titles
const MAX_TITLE_LENGTH = 70;

const EditableJobTitle = ({ jobId, userId, initialTitle }: EditableJobTitleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateJob = useMutation(api.jobs.updateJob);

  // Focus input when editing mode is enabled
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newTitle = e.target.value;
    setTitle(newTitle);
    setIsOverLimit(newTitle.length > MAX_TITLE_LENGTH);
    
    // Show warning toast the first time the limit is exceeded
    if (newTitle.length > MAX_TITLE_LENGTH && !isOverLimit) {
      toast.warning(`Job title should be ${MAX_TITLE_LENGTH} characters or less`);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (title.trim() === "") {
      toast.error("Job title cannot be empty");
      return;
    }

    if (title.length > MAX_TITLE_LENGTH) {
      toast.error(`Job title cannot exceed ${MAX_TITLE_LENGTH} characters`);
      return;
    }

    try {
      const success = await updateJob({
        userId,
        jobId,
        title,
      });

      if (success) {
        setIsEditing(false);
        toast.success("Job title updated");
      } else {
        toast.error("Failed to update job title");
      }
    } catch (error) {
      console.error("Error updating job title:", error);
      toast.error("Error updating job title");
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTitle(initialTitle);
    setIsEditing(false);
    setIsOverLimit(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Stop propagation for all keyboard events in the input
    e.stopPropagation();
    
    if (e.key === "Enter") {
      if (!isOverLimit) {
        handleSave(e as unknown as React.MouseEvent);
      }
    } else if (e.key === "Escape") {
      handleCancel(e as unknown as React.MouseEvent);
    }
  };

  const handleStartEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setIsOverLimit(initialTitle.length > MAX_TITLE_LENGTH);
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
      {isEditing ? (
        <div className="flex items-center space-x-2">
          <div className="flex flex-col">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onClick={handleInputClick}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={cn(
                "px-2 py-1 border rounded focus:outline-none focus:ring-2",
                isOverLimit 
                  ? "border-red-500 focus:ring-red-500/50" 
                  : "focus:ring-primary/50"
              )}
              data-testid="job-title-input"
            />
            <span className={cn(
              "text-xs mt-1",
              isOverLimit ? "text-red-500" : "text-gray-500"
            )}>
              {title.length}/{MAX_TITLE_LENGTH} characters
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSave}
            className="h-8 w-8 p-0"
            disabled={isOverLimit || title.trim() === ""}
          >
            <Check className={cn(
              "h-4 w-4",
              isOverLimit ? "text-gray-400" : "text-green-500"
            )} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center group">
          <span className="text-lg font-semibold mr-2">{title}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEditing}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default EditableJobTitle;