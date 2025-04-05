import { useState, useRef, useEffect } from "react";
import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { useQueryMessages } from "@/chat/hooks/use-query-messages";
import { useMutationMessages } from "@/chat/hooks/use-mutation-messages";
import { useQueryChats } from "@/chat/hooks/use-query-chats";
import { useMutationChats } from "@/chat/hooks/use-mutation-chats";
import { useQueryProfile } from "@/profile/hooks/use-query-profile";
import { Button } from "@/core/components/button";
import { Textarea } from "@/core/components/textarea";
import { Spinner } from "@/linkedin/components/spinner";
import { useAutosizeTextArea } from "@/chat/hooks/use-autosize-textarea";
import { formatProfileBackground } from "@/jobs/utils/profile";
import { Sidebar } from "@/chat/components/chat-sidebar";
import { MessageList } from "@/chat/components/message-list";
import { Id } from "convex/_generated/dataModel";
import { SendIcon, MenuIcon, PlusIcon } from "lucide-react";
import { cn } from "@/core/lib/utils";

const ChatPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { redirect, params } = useRouter();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatId = params.chatId as Id<"chats">;
  
  // Get user profile for context
  const { data: profile } = useQueryProfile(user?.id);
  
  // Get messages for current chat
  const { data: messages, loading: messagesLoading } = useQueryMessages(chatId);
  
  // Setup mutations
  const messageMutations = useMutationMessages(chatId || "");
  const chatMutations = useMutationChats();
  
  // Auto-resize textarea based on content
  useAutosizeTextArea({
    textAreaRef,
    triggerAutoSize: input,
    minHeight: 24,
    maxHeight: 200
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      redirect("login");
    }
  }, [isAuthenticated, redirect]);

  // Scroll to bottom of messages when new message arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Create a new chat if none is selected
  useEffect(() => {
    const createNewChat = async () => {
      if (!chatId && user) {
        setIsLoading(true);
        const newChatId = await chatMutations.add({
          title: "New Conversation",
          description: "Started on " + new Date().toLocaleString()
        });
        
        if (newChatId) {
          redirect("chat", { chatId: newChatId });
        }
        setIsLoading(false);
      }
    };
    
    createNewChat();
  }, [chatId, user, chatMutations, redirect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (sending || !input.trim() || !chatId) return;
    
    try {
      setSending(true);
      
      // Add user profile context to the message
      const userContext = profile ? `\n\nUser Profile Context:\n${formatProfileBackground(profile)}` : "";
      
      // We'll only add the context to the first message in a chat
      const shouldAddContext = messages?.length === 0;
      const messageContent = shouldAddContext ? input + userContext : input;
      
      await messageMutations.add({
        content: messageContent,
      });
      
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleNewChat = () => {
    redirect("chat");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-svh">
      {/* Chat Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Chat Header */}
        <header className="flex items-center justify-between px-4 py-2 border-b h-14 bg-white">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="mr-2 md:hidden"
            >
              <MenuIcon className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleNewChat}
              className="flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto pb-32">
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full mt-32">
              <h1 className="mb-4 text-xl font-semibold">JobSync Assistant</h1>
              <p className="text-center text-gray-500 max-w-md">
                Ask me about job applications, resume tips, interview preparation,
                or career advice. I'll use your profile information to provide
                personalized guidance.
              </p>
            </div>
          ) : (
            <MessageList messages={messages} user={user} />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="fixed bottom-0 left-0 right-0 py-4 border-t bg-white">
          <div className="max-w-3xl px-4 mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message JobSync AI..."
                className="min-h-[52px] max-h-[200px] w-full pr-12 resize-none rounded-lg overflow-y-auto"
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={sending || input.trim() === ""}
                className="absolute right-2 bottom-1.5 h-9 w-9"
              >
                {sending ? (
                  <Spinner size="sm" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
              </Button>
            </form>
            <div className="mt-2 text-xs text-center text-gray-400">
              JobSync AI can make mistakes. Verify important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;