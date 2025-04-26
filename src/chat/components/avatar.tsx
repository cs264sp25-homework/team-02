import React from "react";
import { cn } from "@/core/lib/utils";
import { User, Bot } from "lucide-react";

type AvatarRole = "user" | "assistant";

interface AvatarProps {
  role: AvatarRole;
  name: string;
  src?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ role, name, src, className }) => {
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
        "flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium shrink-0",
        getBgColor(),
        className
      )}
    >
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full rounded-full object-cover"
        />
      ) : role === "assistant" ? (
        <Bot className="h-4 w-4" />
      ) : (
        initial ? <span>{initial}</span> : <User className="h-4 w-4" />
      )}
    </div>
  );
};