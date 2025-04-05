import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/linkedin/hooks/useAuth";

export function useQueryChats() {
  const { user } = useAuth();
  const userId = user?.id;
  
  const chats = useQuery(
    api.chat.getAll,
    userId ? { userId } : "skip"
  );

  return {
    data: chats,
    loading: chats === undefined && userId !== undefined,
    error: chats === null,
  };
}