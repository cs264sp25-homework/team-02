/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { cn } from "@/core/lib/utils";
import { MessageType } from "@/chat/types/messages";
import { Spinner } from "@/linkedin/components/spinner";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'; // For tables, strikethrough, etc.

interface MessageListProps {
  messages: MessageType[];
  user: unknown;
  streamingMessageId?: string;
  streamContent?: string;
}

// No need for the CodeComponent import if we're simplifying

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  streamingMessageId,
  streamContent 
}) => {
  return (
    <div className="space-y-4 py-3">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const isThinking = message.role === "assistant" && message.content === "Thinking...";
        const isStreaming = message.role === "assistant" && message._id === streamingMessageId;
        
        
        // Use streaming content if this message is currently streaming
        const displayContent = isStreaming ? streamContent : message.content;
        
        return (
          <div key={message._id} className="flex flex-col">
            
            
            <div className={cn(
              "flex", 
              isUser ? "justify-end" : "justify-start",
              "px-4"
            )}>
              <div className={cn(
                "max-w-[85%]",
                isUser ? "text-right" : "text-left"
              )}>
                <div className={cn(
                  "px-4 py-3 rounded-lg",
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
                    <div className={cn(
                      "markdown-content",
                      isUser ? "text-white" : "text-gray-800"
                    )}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-6 mb-4" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-5 mb-3" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-md font-bold mt-4 mb-2" {...props} />,
                          h4: ({node, ...props}) => <h4 className="font-bold mt-3 mb-1" {...props} />,
                          a: ({node, ...props}) => <a className={`hover:underline ${isUser ? "text-blue-200" : "text-blue-600"}`} target="_blank" rel="noopener noreferrer" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 pl-4 italic my-4" {...props} />,
                          hr: ({node, ...props}) => <hr className="my-4" {...props} />,
                          // Simple code component without the inline check
                          code: ({className, children, ...props}) => (
                            <code className={`${isUser ? "bg-blue-600" : "bg-gray-200"} px-1 py-0.5 rounded text-sm`} {...props}>{children}</code>
                          ),
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-gray-300" {...props} /></div>,
                          thead: ({node, ...props}) => <thead className={`${isUser ? "bg-blue-600" : "bg-gray-200"}`} {...props} />,
                          tbody: ({node, ...props}) => <tbody {...props} />,
                          tr: ({node, ...props}) => <tr className="border-b border-gray-300" {...props} />,
                          th: ({node, ...props}) => <th className="px-4 py-2 text-left font-semibold" {...props} />,
                          td: ({node, ...props}) => <td className="px-4 py-2" {...props} />,
                          img: ({node, ...props}) => <img className="max-w-full h-auto my-4 rounded" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                          em: ({node, ...props}) => <em className="italic" {...props} />,
                          del: ({node, ...props}) => <del className="line-through" {...props} />,
                          br: ({node, ...props}) => <br className="my-2" {...props} />,
                        }}
                      >
                        {displayContent || " "}
                      </ReactMarkdown>
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