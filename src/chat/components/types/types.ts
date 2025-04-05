import { Id } from "convex/_generated/dataModel";

// Chat Types
export interface ChatType {
  _id: Id<"chats">;
  _creationTime: number;
  title: string;
  description?: string;
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

// Message Types
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

// Trace Types
export interface TraceType {
  _id: Id<"traces">;
  chatId: Id<"chats">;
  messageId: Id<"messages">;
  userInput: string;
  assistantResponse: string;
  functionCalls: FunctionCallType[];
  timestamp: number;
}

export interface FunctionCallType {
  name: string;
  args: string;
  result: unknown;
}