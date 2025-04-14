import { useState, useRef, useEffect } from "react";
import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { Button } from "@/core/components/button";
import { Textarea } from "@/core/components/textarea";
import { Spinner } from "@/linkedin/components/spinner";
import { SendIcon, PlusIcon } from "lucide-react";
import { Id } from "convex/_generated/dataModel";
import { useQueryChats } from "@/chat/hooks/use-query-chats";
import { useMutationChats } from "@/chat/hooks/use-mutation-chats";
import { useQueryMessages } from "@/chat/hooks/use-query-messages";
import { useMutationMessages } from "@/chat/hooks/use-mutation-messages";
import { useQueryProfile } from "@/profile/hooks/use-query-profile";
import { formatProfileBackground } from "@/jobs/utils/profile";
import { MessageList } from "@/chat/components/message-list";
import { Sidebar } from "@/chat/components/chat-sidebar";
import CreateChatDialog from "@/chat/components/CreateChatDialog";

const ChatPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { redirect, params, navigate } = useRouter();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get chatId from URL
  const chatId = params.chatId as Id<"chats">;
  
  // Queries
  const { data: profile } = useQueryProfile(user?.id);
  const { data: messages, loading: messagesLoading } = useQueryMessages(chatId);
  const { data: chats } = useQueryChats();
  
  // Find selected chat for header title
  const selectedChat = chats?.find(chat => chat._id === chatId);
  
  // Mutations
  const messageMutations = useMutationMessages(chatId);
  const chatMutations = useMutationChats();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      redirect("login");
    }
  }, [isAuthenticated, redirect]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleNewChat = () => {
    setIsDialogOpen(true);
  };

  const handleChatCreated = (newChatId: Id<"chats">) => {
    navigate("chat", { chatId: newChatId });
    setInput("");
  };

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
      
      // Add user profile context to first message
      const userContext = profile ? `\n\nUser Profile Context:\n${formatProfileBackground(profile)}` : "";
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

  return (
    <div className="flex h-screen w-screen">
      {/* Sidebar with its own scroll */}
      <aside className="w-64 border-r bg-white h-full overflow-y-auto">
        <Sidebar onNewChat={handleNewChat} currentChatId={chatId} />
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Header with chat title */}
        <header className="flex items-center px-4 py-2 border-b bg-white h-14">
          <h1 className="text-lg font-semibold">
            {chatId ? selectedChat?.title || "Chat" : "JobSync Assistant"}
          </h1>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {!chatId ? (
            <div className="flex flex-col items-center justify-center h-full">
              <h1 className="text-xl font-semibold mb-2">JobSync Assistant</h1>
              <p className="text-center text-gray-500 max-w-md">
                Start a new conversation to get personalized guidance on job applications,
                resume tips, and career advice.
              </p>
              <Button onClick={handleNewChat} className="mt-4">
                <PlusIcon className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          ) : messagesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-center text-gray-500">
                Ask me about job applications, resume tips, interview prep, or career advice.
              </p>
            </div>
          ) : (
            <MessageList messages={messages} user={user} />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {chatId && (
          <div className="border-t bg-white px-4 py-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative"
            >
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Message JobSync AI..."
                className="min-h-[52px] max-h-[200px] w-full pr-12 resize-none rounded-lg"
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={sending || input.trim() === ""}
                className="absolute right-2 bottom-2 h-9 w-9"
              >
                {sending ? <Spinner size="sm" /> : <SendIcon className="w-4 h-4" />}
              </Button>
            </form>
            <div className="mt-2 text-xs text-center text-gray-400">
              JobSync AI can make mistakes. Verify important information.
            </div>
          </div>
        )}
      </main>

      {/* New Chat Dialog */}
      <CreateChatDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
};

export default ChatPage;