import { Id } from "../../../convex/_generated/dataModel";

export interface MessageType {
  _id: Id<"messages">;
  _creationTime: number;
  chatId: Id<"chats">;
  content: string;
  role: "user" | "assistant";
}

export interface CreateMessageType {
  content: string;
}

export interface UpdateMessageType {
  content: string;
}