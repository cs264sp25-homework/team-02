import { CreateMessageType } from "@/chat/types/messages";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";

export function useMutationMessages(chatId: Id<"chats"> | undefined) {
  // Use the updated createAndGenerateResponse mutation
  const createAndGenerateResponse = useMutation(api.messages.createAndGenerateResponse);

  const createMessage = async (message: CreateMessageType): Promise<string | null> => {
    if (!chatId) {
      console.error("Cannot create message: chatId is undefined");
      toast.error("Chat not found");
      return null;
    }

    try {
      console.log("Calling createAndGenerateResponse with:", {
        chatId: chatId.toString(),
        content: message.content,
      });
      
      const result = await createAndGenerateResponse({
        chatId,
        content: message.content,
        userId: message.userId || "",
      });
      
      console.log("createAndGenerateResponse result:", result);
      return result?.messageId as unknown as string;
    } catch (error) {
      console.error("Error in createMessage:", error);
      toast.error("Failed to send message");
      return null;
    }
  };

  return {
    add: createMessage,
  };
}