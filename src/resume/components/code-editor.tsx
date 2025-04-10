import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-latex";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-language_tools";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/core/components/button";
import { Sparkles } from "lucide-react";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  onSave?: () => void;
  handleImproveWithAI: (lineNumber: number | null) => void;
}

export const CodeEditor = ({
  value,
  onChange,
  readOnly = false,
  onSave,
  handleImproveWithAI,
}: CodeEditorProps) => {
  const editorRef = useRef<AceEditor>(null);
  const [buttonPosition, setButtonPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [improveLineNumber, setImproveLineNumber] = useState<number | null>(
    null,
  );

  const handleClickOutside = (e: Event) => {
    // Don't hide if clicking the button itself
    if ((e.target as HTMLElement).closest(".improve-ai-button")) {
      return;
    }

    setButtonPosition(null);
  };

  const handleScroll = () => {
    setButtonPosition(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }
    };

    document.addEventListener("dblclick", handleDoubleClick);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("dblclick", handleDoubleClick);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);

      // Clean up scroll listener
    };
  }, [onSave, editorRef]);

  const handleDoubleClick = (e: MouseEvent) => {
    if (editorRef.current?.editor) {
      const editor = editorRef.current.editor;
      const cursor = editor.getCursorPosition();

      // Get the mouse x and y
      const mouseX = e.pageX;
      const mouseY = e.pageY - 60;

      const absoluteX = mouseX;
      const absoluteY = mouseY;

      const lineContent = value.split("\n")[cursor.row];

      if (lineContent.trim() === "") {
        return;
      }

      setButtonPosition({ x: absoluteX, y: absoluteY });
      setImproveLineNumber(cursor.row + 1);
    }
  };

  return (
    <div className="h-full w-full relative">
      <AceEditor
        ref={editorRef}
        mode="latex"
        theme="tomorrow"
        onChange={onChange}
        value={value}
        name="latex-editor"
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
          wrap: true,
        }}
        width="100%"
        height="100%"
        readOnly={readOnly}
        fontSize={14}
        onScroll={handleScroll}
      />
      {buttonPosition && (
        <div
          className="absolute z-50"
          style={{
            left: `${buttonPosition.x}px`,
            top: `${buttonPosition.y}px`,
            transform: "translate(-50%, -100%)",
            marginTop: "-8px",
          }}
        >
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 bg-white shadow-sm hover:bg-gray-50 improve-ai-button"
            onClick={() => {
              handleImproveWithAI(improveLineNumber);
              setButtonPosition(null);
            }}
          >
            <Sparkles className="h-3 w-3" />
            Improve Line with AI
          </Button>
        </div>
      )}
    </div>
  );
};
