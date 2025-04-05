import React from "react";
import { cn } from "@/core/lib/utils";


interface MessageListProps {
  messages: any[];
  user: any;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, user }) => {
  return (
    <div className="space-y-4 py-4">
      {messages.map((message) => {
        const isUser = message.role === "user";
        return (
          <div key={message._id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
            <div className={cn("flex items-start gap-2 max-w-3xl", isUser ? "flex-row-reverse" : "flex-row")}>
              <div
                className={cn(
                  "p-4 rounded-lg",
                  isUser ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-800"
                )}
              >
                {message.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
