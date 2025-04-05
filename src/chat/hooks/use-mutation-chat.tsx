import { UpdateChatType } from "@/chat/types/chat";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { toast } from "sonner";

export function useMutationChat(chatId: string) {
  const { user } = useAuth();
  const updateMutation = useMutation(api.chat.update);
  const deleteMutation = useMutation(api.chat.remove);

  const editChat = async (chat: UpdateChatType): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in to update a chat");
      return false;
    }
    
    try {
      await updateMutation({
        ...chat,
        userId: user.id,
        chatId: chatId as Id<"chats">,
      });
      return true;
    } catch (error) {
      toast.error((error as Error).message || "Failed to update chat");
      return false;
    }
  };

  const deleteChat = async (): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in to delete a chat");
      return false;
    }
    
    try {
      await deleteMutation({
        userId: user.id,
        chatId: chatId as Id<"chats">,
      });
      return true;
    } catch (error) {
      toast.error((error as Error).message || "Failed to delete chat");
      return false;
    }
  };

  return {
    edit: editChat,
    delete: deleteChat,
  };
}