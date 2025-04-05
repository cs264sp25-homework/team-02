import { useState, useCallback } from 'react';
import { useRouter } from '@/core/hooks/use-router';
import { useAuth } from '@/linkedin/hooks/useAuth';
import { useMutationChats } from './use-mutation-chats';
import { useMutationMessages } from './use-mutation-messages';
import { useQueryMessages } from './use-query-messages';
import { Id } from 'convex/_generated/dataModel';
import { toast } from 'sonner';

export function useChat() {
  const { user } = useAuth();
  const { navigate, params } = useRouter();
  const chatId = params.chatId as Id<"chats">;
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Get chat mutations
  const chatMutations = useMutationChats();
  
  // Get message mutations if we have a chatId
  const messageMutations = useMutationMessages(chatId || "");
  
  // Get messages for the current chat
  const { data: messages, loading: messagesLoading } = useQueryMessages(chatId);

  // Create a new chat
  const createChat = useCallback(async () => {
    if (!user) {
      toast.error("You must be logged in to create a chat");
      return null;
    }
    
    setIsCreating(true);
    try {
      const newChatId = await chatMutations.add({
        title: "New Conversation",
        description: "Started on " + new Date().toLocaleString()
      });
      
      if (newChatId) {
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
  const sendMessage = useCallback(async (content: string, additionalContext: string = "") => {
    if (!chatId || !content.trim()) return false;
    
    setIsSending(true);
    try {
      // Add context if provided
      const messageWithContext = additionalContext 
        ? `${content}${additionalContext}` 
        : content;
      
      const messageId = await messageMutations.add({
        content: messageWithContext,
      });
      
      return !!messageId;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return false;
    } finally {
      setIsSending(false);
    }
  }, [chatId, messageMutations]);

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