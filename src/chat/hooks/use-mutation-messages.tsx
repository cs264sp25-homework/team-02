import { CreateMessageType } from "@/chat/types/messages";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

export function useMutationMessages(chatId: string) {
  const createMutation = useMutation(api.messages.create);

  const createMessage = async (
    message: CreateMessageType,
  ): Promise<string | null> => {
    try {
      const messageId = await createMutation({
        content: message.content,
        chatId: chatId as Id<"chats">,
      });
      return messageId as unknown as string;
    } catch (error) {
      toast.error((error as Error).message || "Failed to send message");
      return null;
    }
  };

  return {
    add: createMessage,
  };
}