import React from "react";
import { cn } from "@/core/lib/utils";
import { formatDate } from "@/chat/utils/format";
import { MessageType } from "@/chat/types/messages";
import { Spinner } from "@/linkedin/components/spinner";

interface MessageListProps {
  messages: MessageType[];
  user: any;
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="space-y-6 py-4">
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const isThinking = message.role === "assistant" && message.content === "Thinking...";
        const showTimestamp = index === 0 || isUser !== (messages[index - 1].role === "user");
        
        return (
          <div key={message._id} className="flex flex-col">
            {/* Show timestamp for first message or when role changes */}
            {showTimestamp && (
              <div className="text-xs text-gray-500 text-center my-2">
                {formatDate(new Date(message._creationTime))}
              </div>
            )}
            
            <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
              <div className={cn(
                "flex items-start gap-3 max-w-3xl", 
                isUser ? "flex-row-reverse" : "flex-row"
              )}>
                
                
                {/* Message bubble */}
                <div className={cn(
                  "px-4 py-3 rounded-lg break-words",
                  isUser 
                    ? "bg-blue-500 text-white rounded-tr-none" 
                    : "bg-gray-100 text-gray-800 rounded-tl-none",
                  isThinking && "animate-pulse"
                )}>
                  {isThinking ? (
                    <div className="flex items-center gap-2">
                      <span>Thinking</span>
                      <Spinner size="sm" />
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};