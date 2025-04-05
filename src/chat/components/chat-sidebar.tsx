import React from "react";
import { useQueryChats } from "@/chat/hooks/use-query-chats";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";
import { Spinner } from "@/linkedin/components/spinner";
import { PlusIcon, XIcon, MessageSquareIcon, TrashIcon } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { formatDate } from "@/chat/utils/format";
import { Id } from "convex/_generated/dataModel";
import { useMutationChat } from "@/chat/hooks/use-mutation-chat";
import { ChatType } from "@/types/chat";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNewChat }) => {
  const { data: chats, loading } = useQueryChats();
  const { navigate, params } = useRouter();
  const currentChatId = params.chatId as Id<"chats">;

  const handleChatSelect = (chatId: string) => {
    navigate("chat", { chatId });
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-white border-r shadow-lg transition-transform duration-300 transform md:relative md:translate-x-0 md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="md:hidden"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={onNewChat}
              className="w-full justify-start"
              variant="outline"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : chats && chats.length > 0 ? (
              <div className="space-y-1 p-2">
                {chats.map((chat) => (
                  <ChatItem
                    key={chat._id}
                    chat={chat}
                    isActive={chat._id === currentChatId}
                    onClick={() => handleChatSelect(chat._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 p-4">
                No conversations yet
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

interface ChatItemProps {
  chat: ChatType;
  isActive: boolean;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, onClick }) => {
  const chatMutation = useMutationChat(chat._id);
  const { redirect } = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this chat?")) {
      const success = await chatMutation.delete();
      if (success) {
        redirect("chat");
      }
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100",
        isActive && "bg-blue-50 hover:bg-blue-50"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <MessageSquareIcon 
          className={cn(
            "h-4 w-4",
            isActive ? "text-blue-500" : "text-gray-500"
          )} 
        />
        <div className="truncate flex-1">
          <div className="font-medium text-sm truncate">
            {chat.title || "New Chat"}
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(new Date(chat._creationTime))}
          </div>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:text-red-500"
        onClick={handleDelete}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};