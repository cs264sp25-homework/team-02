import { CreateChatType } from "@/chat/types/chat";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { toast } from "sonner";

export function useMutationChats() {
  const { user } = useAuth();
  const createMutation = useMutation(api.chat.create);

  const createChat = async (chat: CreateChatType): Promise<string | null> => {
    if (!user) {
      toast.error("You must be logged in to create a chat");
      return null;
    }
    
    try {
      const chatId = await createMutation({
        ...chat,
        userId: user.id,
      });
      return chatId as string;
    } catch (error) {
      toast.error((error as Error).message || "Failed to create chat");
      return null;
    }
  };

  return {
    add: createChat,
  };
}