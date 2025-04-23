import { useState, useRef, useEffect } from "react";
import { useRouter } from "@/core/hooks/use-router";
import { useAuth } from "@/linkedin/hooks/useAuth";
import { Button } from "@/core/components/button";
import { Textarea } from "@/core/components/textarea";
import { Spinner } from "@/linkedin/components/spinner";
import { SendIcon, MenuIcon, XIcon } from "lucide-react";
import { Id } from "convex/_generated/dataModel";
import { useQueryChats } from "@/chat/hooks/use-query-chats";
import { useChat } from "@/chat/hooks/use-chat";
import { MessageList } from "@/chat/components/message-list";
import { Sidebar } from "@/chat/components/chat-sidebar";
import CreateChatDialog from "@/chat/components/CreateChatDialog";
import { useAutosizeTextArea } from "@/chat/hooks/use-autosize-textarea";
import { cn } from "@/core/lib/utils";

const ChatPage = () => {
  const { isAuthenticated, user } = useAuth();
  const { redirect, params } = useRouter();
  const [input, setInput] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatId = params.chatId as Id<"chats">;
  
  const { 
    messages, 
    messagesLoading, 
    isSending,
    sendMessage,
    aiMessageId,
    aiMessageContent
  } = useChat();
  
  const { data: chats } = useQueryChats();
  const selectedChat = chats?.find(chat => chat._id === chatId);
  
  useAutosizeTextArea({
    textAreaRef: textareaRef,
    triggerAutoSize: input,
    minHeight: 24,
    maxHeight: 100
  });
  
  useEffect(() => {
    if (!isAuthenticated) {
      redirect("login");
    }
  }, [isAuthenticated, redirect]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiMessageContent]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNewChat = () => {
    setIsDialogOpen(true);
  };

  const handleChatCreated = (newChatId: Id<"chats">) => {
    redirect("chat", { chatId: newChatId });
    setInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (isSending || !input.trim() || !chatId) return;
    
    const message = input;
    setInput("");
    
    try {
      await sendMessage(message);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex h-screen w-screen">
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={toggleSidebar}
        />
      )}

      <aside 
        className={cn(
          "fixed md:relative h-full overflow-y-auto bg-white border-r z-30 transition-all duration-300 ease-in-out",
          sidebarOpen 
            ? "w-64 translate-x-0" 
            : "w-0 -translate-x-full md:w-0 md:-translate-x-full"
        )}
      >
        <Sidebar onNewChat={handleNewChat} currentChatId={chatId} />
      </aside>

      {/* Main Chat Container - Fixed Layout Structure */}
      <main className="flex flex-col flex-1 h-screen">
        {/* Fixed Header */}
        <header className="flex items-center px-4 py-2 border-b bg-white h-12 shadow-sm z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-1 mr-2"
          >
            {sidebarOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </Button>
            
          <h1 className="text-lg font-semibold truncate max-w-[250px]">
            {chatId ? selectedChat?.title || "Chat" : "JobSync Assistant"}
          </h1>
        </header>

        {/* Main Content Area - Single Scrollable Container */}
        <div className="flex-1 overflow-y-auto"> 
          {!chatId ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="max-w-md">
                <h1 className="text-xl font-semibold mb-2">JobSync Assistant</h1>
                <p className="text-gray-500 mb-4">
                  Start a new conversation to get job application guidance.
                </p>
                <Button onClick={handleNewChat}>New Chat</Button>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <div className="max-w-md">
                <p className="text-gray-500">
                  Ask about job applications, resume tips, or interview prep.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <MessageList 
                messages={messages || []} 
                user={user}
                aiMessageId={aiMessageId || undefined}
                aiMessageContent={aiMessageContent}
              />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Fixed Input Area */}
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
                placeholder={isSending ? "Waiting for response..." : "Message JobSync AI..."}
                className={`min-h-[40px] max-h-[100px] w-full pr-10 resize-none rounded-lg 
                  border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 
                  focus:ring-opacity-50 transition-shadow text-sm
                  ${isSending ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                disabled={isSending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSending || input.trim() === ""}
                className={`absolute right-2 bottom-2 h-8 w-8 transition-colors
                  ${isSending 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {isSending ? <Spinner size="sm" /> : <SendIcon className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        )}
      </main>

      <CreateChatDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
};

export default ChatPage;