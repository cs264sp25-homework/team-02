import React from "react";
import { cn } from "@/core/lib/utils";

interface DividerProps {
  className?: string;
  text?: string;
}

export const Divider: React.FC<DividerProps> = ({ className, text }) => {
  // If there's text, we'll create a divider with text in the middle
  if (text) {
    return (
      <div className={cn("relative w-full my-4", className)}>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {text}
          </span>
        </div>
      </div>
    );
  }

  // Simple divider without text
  return <hr className={cn("w-full border-t my-4", className)} />;
};
