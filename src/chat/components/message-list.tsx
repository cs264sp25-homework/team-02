import React from "react";
import { MessageType } from "@/types/message";
import { User } from "@/linkedin/stores/auth-store";
import { cn } from "@/core/lib/utils";
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "@/chat/components/code-block";
import { Avatar } from "@/chat/components/avatar";

interface MessageListProps {
  messages: MessageType[];
  user: User | null;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, user }) => {
  return (
    <div className="space-y-4 py-4">
      {messages.map((message) => (
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
                {message.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <CodeBlock
                            language={match[1]}
                            value={String(children).replace(/\n$/, "")}
                          />
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};