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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatId = params.chatId as Id<"chats">;
  
  const { 
    messages, 
    messagesLoading, 
    isSending,
    sendMessage,
    aiMessageId,
    aiMessageContent,
    isStreamingDone
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
    const node = messagesEndRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
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

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const toggleSidebarCollapsed = () => setSidebarCollapsed((c) => !c);

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
    <>
      {/* Sidebar: fixed to left, content starts below navbar */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen border-r bg-white z-30 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="pt-12 flex flex-col h-full"> {/* pt-12 = 48px for navbar height */}
          <div className="flex items-center justify-between px-6 py-3 border-b"> {/* px-6/py-4 to match chat header */}
            <span className="font-bold text-lg text-gray-700">{!sidebarCollapsed && "Chats"}</span>
            <Button variant="ghost" size="icon" onClick={toggleSidebarCollapsed}>
              {sidebarCollapsed ? <MenuIcon className="h-5 w-5" /> : <XIcon className="h-5 w-5" />}
            </Button>
          </div>
          {!sidebarCollapsed && <Sidebar onNewChat={handleNewChat} currentChatId={chatId} />}
        </div>
      </aside>
      {/* Main Chat Area: margin left for sidebar, margin top for navbar */}
      <div className={cn(
        "flex flex-col h-screen bg-gray-50",
        sidebarCollapsed ? "md:ml-16" : "md:ml-64",
        "pt-12" // 48px for navbar
      )}>
        {/* Header: fixed below navbar, flush with sidebar */}
        <header
          className="fixed z-40 flex items-center px-6 py-4 border-b bg-white/90 backdrop-blur-md w-full"
          style={{
            left: sidebarCollapsed ? 64 : 256,
            top: 48, // navbar height
            width: `calc(100% - ${(sidebarCollapsed ? 64 : 256)}px)`
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="mr-2 md:hidden"
          >
            {sidebarOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </Button>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 truncate text-left w-full">
            {chatId ? selectedChat?.title || "Chat" : "JobSync Assistant"}
          </h1>
        </header>
        {/* Messages: margin top for header */}
        <div
          className="flex-1 overflow-y-auto px-0 md:px-0 bg-gray-50 scrollbar-none"
          ref={messagesEndRef}
          style={{ minHeight: 0, marginTop: 72 }} // 48px navbar + 24px header
        >
          <div className="max-w-2xl mx-auto pt-6 pb-8">
            {!chatId ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <h1 className="text-2xl font-semibold mb-2">JobSync Assistant</h1>
                <p className="text-gray-500 mb-4">
                  Start a new conversation to get job application guidance.
                </p>
                <Button onClick={handleNewChat}>New Chat</Button>
              </div>
            ) : messagesLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <p className="text-gray-400">
                  Ask about job applications, resume tips, or interview prep.
                </p>
              </div>
            ) : (
              <MessageList 
                messages={messages || []} 
                user={user}
                aiMessageId={aiMessageId || undefined}
                aiMessageContent={aiMessageContent}
              />
            )}
          </div>
        </div>
        {/* Input: fixed to bottom, aligned with chat area only */}
        {chatId && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={cn(
              "fixed bottom-0 border-t bg-white/95 backdrop-blur-md px-4 py-3 z-20 transition-all duration-300",
              sidebarCollapsed ? "md:left-16 md:w-[calc(100%-4rem)]" : "md:left-64 md:w-[calc(100%-16rem)]"
            )}
            style={{ left: sidebarCollapsed ? 64 : 256, width: `calc(100% - ${(sidebarCollapsed ? 64 : 256)}px)` }}
          >
            <div className="max-w-2xl mx-auto flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={isSending && !isStreamingDone ? "Waiting for response..." : "Message JobSync AI..."}
                className={cn(
                  "flex-1 resize-none rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all min-h-[40px] max-h-[120px]",
                  isSending && !isStreamingDone ? "bg-gray-100 text-gray-400" : "bg-gray-50 text-gray-900"
                )}
                disabled={isSending && !isStreamingDone}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSending && !isStreamingDone || input.trim() === ""}
                className={cn(
                  "rounded-full h-10 w-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-md",
                  isSending && !isStreamingDone && "bg-gray-300 cursor-not-allowed hover:bg-gray-300"
                )}
              >
                {isSending ? <Spinner size="sm" /> : <SendIcon className="w-5 h-5" />}
              </Button>
            </div>
          </form>
        )}
        <CreateChatDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onChatCreated={handleChatCreated}
        />
      </div>
    </>
  );
};

export default ChatPage;