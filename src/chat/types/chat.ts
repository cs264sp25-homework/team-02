import { Id } from "../../../convex/_generated/dataModel";

export interface ChatType {
  _id: Id<"chats">;
  _creationTime: number;
  title: string;
  description?: string;
  userId: string;
  messageCount: number;
}

export interface CreateChatType {
  title: string;
  description?: string;
}

export interface UpdateChatType {
  title?: string;
  description?: string;
}