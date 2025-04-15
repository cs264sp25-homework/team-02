import { useState, useCallback } from 'react';
import { useRouter } from '@/core/hooks/use-router';
import { useAuth } from '@/linkedin/hooks/useAuth';
import { useMutationChats } from './use-mutation-chats';
import { useQueryMessages } from './use-query-messages';
import { Id } from 'convex/_generated/dataModel';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export function useChat() {
  const { user } = useAuth();
  const { navigate, params } = useRouter();
  const chatId = params.chatId as Id<"chats">;
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Get chat mutations
  const chatMutations = useMutationChats();
  
  // Get create message mutation
  const createAndGenerateResponse = useMutation(api.messages.createAndGenerateResponse);
  
  // Get messages for the current chat
  const { data: messages, loading: messagesLoading } = useQueryMessages(chatId);

  // Create a new chat
  const createChat = useCallback(async (title: string, description?: string, relatedJobId?: string) => {
    if (!user) {
      toast.error("You must be logged in to create a chat");
      return null;
    }
    
    setIsCreating(true);
    try {
      const newChatId = await chatMutations.add({
        title: title || "New Conversation",
        description,
        ...(relatedJobId && { relatedJobId }),
      });
      
      if (newChatId) {
        // Navigate to the new chat
        navigate("chat", { chatId: newChatId });
        return newChatId;
      }
      return null;
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to create new chat");
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user, chatMutations, navigate]);

  // Send a message in the current chat
  const sendMessage = useCallback(async (content: string) => {
    if (!chatId || !content.trim() || !user) {
      return false;
    }
    
    setIsSending(true);
    try {
      await createAndGenerateResponse({
        chatId,
        content,
        userId: user.id,
      });
      
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return false;
    } finally {
      setIsSending(false);
    }
  }, [chatId, user, createAndGenerateResponse]);

  return {
    chatId,
    messages,
    messagesLoading,
    isSending,
    isCreating,
    createChat,
    sendMessage
  };
}