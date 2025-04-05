import { useEffect } from "react";

interface UseAutosizeTextAreaProps {
  textAreaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  minHeight?: number;
  maxHeight?: number;
  triggerAutoSize: string;
}

export const useAutosizeTextArea = ({
  textAreaRef,
  triggerAutoSize,
  maxHeight = 200,
  minHeight = 24,
}: UseAutosizeTextAreaProps) => {
  useEffect(() => {
    // Check if textAreaRef and textAreaRef.current exist before trying to access properties
    if (!textAreaRef || !textAreaRef.current) return;
    
    const textArea = textAreaRef.current;
    
    // Reset height to get the correct scrollHeight
    textArea.style.height = `${minHeight}px`;
    
    const scrollHeight = textArea.scrollHeight;
    
    // Apply the height constraints
    if (scrollHeight > maxHeight) {
      textArea.style.height = `${maxHeight}px`;
    } else if (scrollHeight < minHeight) {
      textArea.style.height = `${minHeight}px`;
    } else {
      textArea.style.height = `${scrollHeight}px`;
    }
  }, [textAreaRef, triggerAutoSize, maxHeight, minHeight]);
};