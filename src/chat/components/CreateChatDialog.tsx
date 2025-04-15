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

// Extended type that includes Convex's _id field
type JobWithId = JobType & { _id: Id<"jobs"> };

interface CreateChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: Id<"chats">) => void;
}

const CreateChatDialog = ({ isOpen, onClose, onChatCreated }: CreateChatDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('New Conversation');
  const [description, setDescription] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    }
  }, [isOpen]);

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
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Optional description"
              />
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {jobs && jobs.map((job: JobWithId) => (
                        <SelectItem key={job._id} value={job._id}>
                          {job.title}
                        </SelectItem>
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
            <Button type="submit" disabled={isSubmitting}>
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