import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';
import { JobType } from 'convex/jobs';
import { useAuth } from '@/linkedin/hooks/useAuth';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/dialog';
import { Button } from '@/core/components/button';
import { Input } from '@/core/components/input';
import { Label } from '@/core/components/label';
import { Textarea } from '@/core/components/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/select';
import { Spinner } from '@/linkedin/components/spinner';
import { cn } from '@/core/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/core/components/tooltip';

// Extended type that includes Convex's _id field
type JobWithId = JobType & { _id: Id<"jobs"> };

interface CreateChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: Id<"chats">) => void;
}

// Constants for validation
const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const TRUNCATE_LENGTH = 30;

const CreateChatDialog = ({ isOpen, onClose, onChatCreated }: CreateChatDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('New Conversation');
  const [description, setDescription] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleExceedsLimit, setTitleExceedsLimit] = useState(false);
  const [descriptionExceedsLimit, setDescriptionExceedsLimit] = useState(false);

  // Get all jobs for the current user
  const jobs = useQuery(
    api.jobs.getAllJobs,
    user?.id ? { userId: user.id } : "skip"
  );

  // Create chat mutation
  const createChat = useMutation(api.chat.create);

  // Reset form on dialog open
  useEffect(() => {
    if (isOpen) {
      setTitle('New Conversation');
      setDescription('');
      setSelectedJobId('none');
      setTitleExceedsLimit(false);
      setDescriptionExceedsLimit(false);
    }
  }, [isOpen]);

  // Function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  // Handle title change with validation
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    if (newTitle.length > MAX_TITLE_LENGTH) {
      if (!titleExceedsLimit) {
        toast.warning(`Title should be ${MAX_TITLE_LENGTH} characters or less`);
        setTitleExceedsLimit(true);
      }
    } else {
      setTitleExceedsLimit(false);
    }
  };

  // Handle description change with validation
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    
    if (newDescription.length > MAX_DESCRIPTION_LENGTH) {
      if (!descriptionExceedsLimit) {
        toast.warning(`Description should be ${MAX_DESCRIPTION_LENGTH} characters or less`);
        setDescriptionExceedsLimit(true);
      }
    } else {
      setDescriptionExceedsLimit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a chat');
      return;
    }
    
    if (!title.trim()) {
      toast.error('Chat title is required');
      return;
    }
    
    // Check length constraints before submitting
    if (title.length > MAX_TITLE_LENGTH) {
      toast.error(`Title exceeds maximum length of ${MAX_TITLE_LENGTH} characters`);
      return;
    }
    
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      toast.error(`Description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // If a job is selected, include it in the description
      let finalDescription = description;
      const jobId = selectedJobId === 'none' ? undefined : selectedJobId;
      
      if (jobId) {
        const selectedJob = jobs?.find((job: JobWithId) => job._id === jobId);
        if (selectedJob) {
          finalDescription = `${description ? description + '\n\n' : ''}Related to job: ${selectedJob.title}`;
        }
      }
      
      const chatId = await createChat({
        userId: user.id,
        title,
        description: finalDescription,
        relatedJobId: jobId
      });
      
      toast.success('Chat created successfully');
      onChatCreated(chatId as Id<"chats">);
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
            <DialogDescription>
              Create a new conversation. You can optionally link it to a job in your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <div className="col-span-3">
                <Input
                  id="title"
                  value={title}
                  onChange={handleTitleChange}
                  className={cn(
                    "w-full",
                    titleExceedsLimit && "border-red-500 focus-visible:ring-red-500/50"
                  )}
                  required
                  maxLength={MAX_TITLE_LENGTH + 10} // Allow typing a bit more for better UX
                />
                <p className={cn(
                  "text-xs mt-1",
                  titleExceedsLimit ? "text-red-500" : "text-gray-500"
                )}>
                  {title.length}/{MAX_TITLE_LENGTH} characters
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  value={description}
                  onChange={handleDescriptionChange}
                  className={cn(
                    "resize-none",
                    descriptionExceedsLimit && "border-red-500 focus-visible:ring-red-500/50"
                  )}
                  placeholder="Optional description"
                  maxLength={MAX_DESCRIPTION_LENGTH + 50} // Allow typing a bit more for better UX
                />
                <p className={cn(
                  "text-xs mt-1",
                  descriptionExceedsLimit ? "text-red-500" : "text-gray-500"
                )}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH} characters
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="job" className="text-right">
                Related Job
              </Label>
              <div className="col-span-3">
                {jobs === undefined ? (
                  <div className="flex items-center justify-center p-2">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a job (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {jobs && jobs.map((job: JobWithId) => (
                        <TooltipProvider key={job._id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SelectItem 
                                value={job._id}
                                className="truncate max-w-[300px]"
                              >
                                {truncateText(job.title, TRUNCATE_LENGTH)}
                              </SelectItem>
                            </TooltipTrigger>
                            {job.title.length > TRUNCATE_LENGTH && (
                              <TooltipContent>
                                <p>{job.title}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || titleExceedsLimit || descriptionExceedsLimit}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Chat'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChatDialog;