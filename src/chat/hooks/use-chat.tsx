import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState<string>("");
  
  // Streaming simulation settings
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get chat mutations
  const chatMutations = useMutationChats();
  
  // Get create message mutation
  const createAndGenerateResponse = useMutation(api.messages.createAndGenerateResponse);
  
  // Get messages for the current chat
  const { data: messages, loading: messagesLoading } = useQueryMessages(chatId);

  // Cleanup streaming and polling on unmount
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
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

  // Text streaming implementation
  const simulateTextStreaming = useCallback((messageId: string, fullContent: string) => {
    // Set up streaming state
    setStreamingMessageId(messageId);
    setStreamContent(""); // Start with empty string
    
    let currentPosition = 0;
    
    // Clear any existing interval
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }
    
    // Create a streaming interval with a faster rate
    const streamInterval = setInterval(() => {
      // If we've reached the end of the content
      if (currentPosition >= fullContent.length) {
        clearInterval(streamInterval);
        streamIntervalRef.current = null;
        setStreamingMessageId(null); // Clear streaming state when done
        setIsSending(false); // Important: release the sending state
        return;
      }
      
      // Add 1-3 characters at a time for more natural streaming
      const chunkSize = Math.floor(Math.random() * 3) + 1;
      const nextPosition = Math.min(currentPosition + chunkSize, fullContent.length);
      
      // Get the next chunk
      const nextChunk = fullContent.substring(currentPosition, nextPosition);
      
      // Update streaming content - use functional update
      setStreamContent(prev => prev + nextChunk);
      
      currentPosition = nextPosition;
    }, 30); // 30ms interval
    
    streamIntervalRef.current = streamInterval;
  }, []);

  // Poll for message updates
  useEffect(() => {
    // If we're streaming and messages changes, check if the message content has changed
    if (streamingMessageId && messages) {
      const currentMessage = messages.find(msg => msg._id === streamingMessageId);
      
      if (currentMessage && currentMessage.content !== "Thinking...") {
        // Clear polling if it's running
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Start streaming the actual content
        simulateTextStreaming(streamingMessageId, currentMessage.content);
      }
    }
  }, [messages, streamingMessageId, simulateTextStreaming]);

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
      
      // If we have an AI message ID, set it for streaming
      if (result && result.aiMessageId) {
        setStreamingMessageId(result.aiMessageId);
        setStreamContent("Thinking...");
        
        // Clear any existing polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      } else {
        // If there's no AI message ID, clear sending state
        setIsSending(false);
      }
      
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setIsSending(false); // Make sure to clear sending state on error
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
    streamingMessageId,
    streamContent
  };
}