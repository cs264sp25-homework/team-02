import { useState, useRef, useEffect } from "react";
import { Button } from "@/core/components/button";
import { Check, Pencil, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface EditableJobTitleProps {
  jobId: Id<"jobs">;
  userId: string;
  initialTitle: string;
}

const EditableJobTitle = ({ jobId, userId, initialTitle }: EditableJobTitleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
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

  const handleSave = async () => {
    if (title.trim() === "") {
      toast.error("Job title cannot be empty");
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

  const handleCancel = () => {
    setTitle(initialTitle);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center">
      {isEditing ? (
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
            data-testid="job-title-input"
          />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSave}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-500" />
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
            onClick={() => setIsEditing(true)}
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