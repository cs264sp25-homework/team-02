import { Id } from "../../../convex/_generated/dataModel";

export interface MessageType {
  _id: Id<"messages">;
  _creationTime: number;
  chatId: Id<"chats">;
  content: string;
  role: "user" | "assistant";
  createdAt?: string;
}

export interface CreateMessageType {
  content: string;
  userId?: string;
}

export interface UpdateMessageType {
  content: string;
}