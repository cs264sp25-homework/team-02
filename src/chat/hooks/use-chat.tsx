import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from '@/core/hooks/use-router';
import { useAuth } from '@/linkedin/hooks/useAuth';
import { useMutationChats } from './use-mutation-chats';
import { useQueryMessages } from './use-query-messages';
import { Id } from 'convex/_generated/dataModel';
import { toast } from 'sonner';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export function useChat() {
  const { user } = useAuth();
  const { navigate, params } = useRouter();
  const chatId = params.chatId as Id<"chats">;
  
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [aiMessageId, setAiMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  
  // Polling interval reference
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevContentLengthRef = useRef<number>(0);
  
  // Get chat mutations
  const chatMutations = useMutationChats();
  
  // Get create message mutation
  const createAndGenerateResponse = useMutation(api.messages.createAndGenerateResponse);
  
  // Get messages for the current chat
  const { data: messages, loading: messagesLoading } = useQueryMessages(chatId);
  
  // Get the specific AI message when we're generating a response
  const aiMessage = useQuery(
    api.messages.getMessageById,
    aiMessageId ? { messageId: aiMessageId as Id<"messages"> } : "skip"
  );

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      // Reset streaming state on unmount
      setStreamingContent("");
      prevContentLengthRef.current = 0;
    };
  }, []);

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

  // Start polling for updates to the AI message
  const startPollingForUpdates = useCallback((messageId: string) => {
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Reset streaming content
    setStreamingContent("");
    prevContentLengthRef.current = 0;
    
    // Start polling for updates to the AI message
    const interval = setInterval(() => {
      // Check if we have the AI message content
      if (aiMessage) {
        if (aiMessage.content && aiMessage.content !== streamingContent) {
          const newContent = aiMessage.content;
          
          // Only get the new part of the message since last update
          if (newContent.length > prevContentLengthRef.current) {
            // Update streaming content with the full content
            setStreamingContent(newContent);
            prevContentLengthRef.current = newContent.length;
          }
        }
        
        // If the message seems complete (hasn't changed in a while), stop polling
        if (aiMessage.content && 
            aiMessage.content.length > 0 && 
            streamingContent === aiMessage.content && 
            streamingContent.length > 10) {
          // If the message is complete, stop polling
          clearInterval(interval);
          pollingIntervalRef.current = null;
          setIsSending(false);
          setAiMessageId(null);
        }
      }
    }, 300); // Poll frequently for smoother streaming
    
    pollingIntervalRef.current = interval;
  }, [aiMessage, streamingContent]);

  // Effect to start polling when AI message ID changes
  useEffect(() => {
    if (aiMessageId) {
      startPollingForUpdates(aiMessageId);
    }
  }, [aiMessageId, startPollingForUpdates]);

  // Send a message in the current chat
  const sendMessage = useCallback(async (content: string) => {
    if (!chatId || !content.trim() || !user) {
      return false;
    }
    
    // Set sending state - will disable the input
    setIsSending(true);
    
    try {
      // Send the message and get the result
      const result = await createAndGenerateResponse({
        chatId,
        content,
        userId: user.id,
      });
      
      // If we have an AI message ID, set it for tracking
      if (result && result.aiMessageId) {
        setAiMessageId(result.aiMessageId);
      }
      
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setIsSending(false);
      return false;
    }
  }, [chatId, user, createAndGenerateResponse]);

  return {
    chatId,
    messages,
    messagesLoading,
    isSending,
    isCreating,
    createChat,
    sendMessage,
    aiMessageId,
    aiMessageContent: streamingContent || (aiMessage?.content || "")
  };
}