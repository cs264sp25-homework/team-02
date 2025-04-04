import { useState, useRef, useEffect } from "react";
import { Button } from "@/core/components/button";
import { Textarea } from "@/core/components/textarea";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useRouter } from "@/core/hooks/use-router";
import { SendIcon, PlusIcon } from "lucide-react";
import { cn } from "@/core/lib/utils";

// Define message types
type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

const ChatPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { redirect } = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    redirect("login");
  }

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto first to handle deletions
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading || input.trim() === "") return;
    
    // Generate a unique ID for the message
    const uniqueId = Date.now().toString();
    
    // Add user message to the chat
    const userMessage: Message = {
      id: uniqueId,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    try {
      // Simulate AI response with a delay (replace with actual API call later)
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "This is a simulated response from the AI assistant. In the next phase, this will be replaced with an actual API call to process your message and generate a meaningful response.",
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, aiResponse]);
        setLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error sending message:", error);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift key
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-svh bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-white border-b h-14">
        <Button variant="ghost" onClick={handleNewChat} className="flex items-center">
          <PlusIcon className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </header>

      {/* Chat messages container */}
      <div className="flex-1 pt-16 pb-32 overflow-y-auto">
        <div className="max-w-3xl px-4 mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full mt-32">
              <h1 className="mb-4 text-xl font-semibold">JobSync Assistant</h1>
              <p className="text-center text-gray-500">
                Ask me any questions about job applications, resume building, or interview preparation.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "py-6",
                  message.role === "assistant" ? "bg-white" : "bg-transparent"
                )}
              >
                <div className="max-w-3xl mx-auto">
                  <div className="flex space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-primary">
                      {message.role === "assistant" ? "AI" : user?.firstName?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {message.role === "assistant" ? "JobSync AI" : `${user?.firstName} ${user?.lastName}`}
                      </div>
                      <div className="mt-1 whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input area */}
      <div className="fixed bottom-0 left-0 right-0 py-4 bg-white border-t">
        <div className="max-w-3xl px-4 mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message JobSync AI..."
              className="min-h-[52px] max-h-[200px] w-full pr-12 resize-none rounded-lg overflow-y-auto"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || input.trim() === ""}
              className="absolute right-2 bottom-1.5 h-9 w-9"
            >
              <SendIcon className="w-4 h-4" />
            </Button>
          </form>
          <div className="mt-2 text-xs text-center text-gray-400">
            JobSync AI can make mistakes. Verify important information.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;