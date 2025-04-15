import React, { useState } from "react";
import { useQueryChats } from "@/chat/hooks/use-query-chats";
import { useRouter } from "@/core/hooks/use-router";
import { Button } from "@/core/components/button";
import { Spinner } from "@/linkedin/components/spinner";
import { PlusIcon, MessageSquareIcon, TrashIcon } from "lucide-react";
import { cn } from "@/core/lib/utils";
import { formatDate } from "@/chat/utils/format";
import { Id } from "convex/_generated/dataModel";
import { useMutationChat } from "@/chat/hooks/use-mutation-chat";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/alert-dialog";

interface SidebarProps {
  onNewChat: () => void;
  currentChatId?: Id<"chats">;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onNewChat,
  currentChatId
}) => {
  const { data: chats, loading } = useQueryChats();
  const { navigate } = useRouter();

  const handleChatSelect = (chatId: string) => {
    // Navigate to chat with the specific ID
    navigate("chat", { chatId });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Conversations</h2>
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
  );
};

interface ChatItemProps {
  chat: any; // Using any here since we don't have the exact type
  isActive: boolean;
  onClick: () => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, isActive, onClick }) => {
  const chatMutation = useMutationChat(chat._id);
  const { redirect } = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    const success = await chatMutation.delete();
    if (success) {
      redirect("chat");
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 group",
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
          onClick={handleDeleteClick}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this chat?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the chat
              and all associated messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};