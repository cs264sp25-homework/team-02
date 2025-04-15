import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useQuery } from "convex/react";

export function useQueryMessages(chatId: Id<"chats"> | undefined) {
  const messages = useQuery(api.messages.getAll, chatId ? { chatId } : "skip");

  return {
    data: messages,
    loading: messages === undefined && chatId !== undefined,
    error: messages === null,
  };
}