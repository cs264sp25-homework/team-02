import React from "react";
import { cn } from "@/core/lib/utils";

interface MessageListProps {
  messages: any[];
  user: any; 
}

export const MessageList: React.FC<MessageListProps> = ({ messages, user }) => {
  const messageList = messages || [];
  
  return (
    <div className="space-y-4 py-4">
      {messageList.map((message) => (
        <div
          key={message._id}
          className={cn(
            "px-4 py-6",
            message.role === "assistant" ? "bg-gray-50" : "bg-white"
          )}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Avatar
                  role={message.role}
                  name={message.role === "user" ? user?.firstName || "You" : "AI"}
                />
              </div>
              <div className="flex-1 min-w-0 prose max-w-none break-words">
                <div className="font-semibold">
                  {message.role === "assistant" ? "JobSync AI" : `${user?.firstName || "You"} ${user?.lastName || ""}`}
                </div>
                <div className="mt-1 whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Simple Avatar component
const Avatar = ({ role, name }: { role: string, name: string }) => {
  // Get first letter of name for fallback
  const initial = name ? name.charAt(0).toUpperCase() : "";

  // Background colors based on role
  const getBgColor = () => {
    switch (role) {
      case "assistant":
        return "bg-blue-600";
      case "user":
      default:
        return "bg-gray-700";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium",
        getBgColor()
      )}
    >
      <span>{initial}</span>
    </div>
  );
};