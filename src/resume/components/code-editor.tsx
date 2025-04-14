import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-latex";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/core/components/button";
import {
  Sparkles,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table,
  Image,
  Link,
  Undo,
  Redo,
  Search,
  Replace,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/dropdown-menu";
import { ImproveResumeActionType } from "convex/resume/schema";
interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  onSave?: () => void;
  handleImproveWithAI: (
    lineNumber: number | null,
    action: ImproveResumeActionType,
  ) => void;
}

export const CodeEditor = ({
  value,
  onChange,
  readOnly = false,
  onSave,
  handleImproveWithAI,
}: CodeEditorProps) => {
  const editorRef = useRef<AceEditor>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  const [buttonPosition, setButtonPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [improveLineNumber, setImproveLineNumber] = useState<number | null>(
    null,
  );

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

    const handleClickOutside = (e: Event) => {
      // If the class is "ace_content", hide the dropdown
      if ((e.target as HTMLElement).closest(".ace_content")) {
        setButtonPosition(null);
      }
      // When the dropdown is open, hide the dropdown when the user clicks outside
      if ((e.target as HTMLElement).tagName === "HTML") {
        const body = document.body;
        if (body.style.pointerEvents !== "none") {
          setButtonPosition(null);
        }
      }
    };

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

    const wrapper = editorWrapperRef.current;
    if (wrapper) {
      wrapper.addEventListener("dblclick", handleDoubleClick);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);

    return () => {
      if (wrapper) {
        wrapper.removeEventListener("dblclick", handleDoubleClick);
      }
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);

      // Clean up scroll listener
    };
  }, [onSave, editorRef, value]);

  const insertText = (before: string, after: string = "") => {
    if (!editorRef.current?.editor || readOnly) return;

    const editor = editorRef.current.editor;
    const selectedText = editor.getSelectedText();

    if (selectedText) {
      // Replace selected text with formatted text
      const range = editor.getSelectionRange();
      editor.replace(`${before}${selectedText}${after}`, {
        needle: selectedText,
        range,
      });
    } else {
      // Insert at cursor position
      editor.insert(`${before}${after}`);
      // Move cursor between the inserted tags
      const cursor = editor.getCursorPosition();
      editor.moveCursorTo(cursor.row, cursor.column - after.length);
    }
  };

  const insertNewLine = (prefix: string) => {
    if (!editorRef.current?.editor || readOnly) return;

    const editor = editorRef.current.editor;

    // Insert new line with prefix
    editor.insert(`\n${prefix}`);
  };

  const insertEnvironment = (environment: string) => {
    if (!editorRef.current?.editor || readOnly) return;

    const editor = editorRef.current.editor;
    const selectedText = editor.getSelectedText();

    if (selectedText) {
      // Wrap selected text in environment
      const range = editor.getSelectionRange();
      editor.replace(
        `\\begin{${environment}}\n${selectedText}\n\\end{${environment}}`,
        {
          needle: selectedText,
          range,
        },
      );
    } else {
      // Insert empty environment
      editor.insert(`\\begin{${environment}}\n\n\\end{${environment}}`);
      // Move cursor inside the environment
      const cursor = editor.getCursorPosition();
      editor.moveCursorTo(
        cursor.row,
        cursor.column - `\\end{${environment}}`.length,
      );
    }
  };

  return (
    <div className="h-full w-full relative flex flex-col">
      <div className="border-b p-2 flex flex-wrap gap-1 bg-gray-50">
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertText("\\textbf{", "}")}
                  disabled={readOnly}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertText("\\textit{", "}")}
                  disabled={readOnly}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertText("\\underline{", "}")}
                  disabled={readOnly}
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Underline</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertNewLine("\\item ")}
                  disabled={readOnly}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertEnvironment("enumerate")}
                  disabled={readOnly}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Numbered List</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertText("\\section{", "}")}
                  disabled={readOnly}
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Section</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertText("\\subsection{", "}")}
                  disabled={readOnly}
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Subsection</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertText("\\subsubsection{", "}")}
                  disabled={readOnly}
                >
                  <Heading3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Subsubsection</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    insertText("\\begin{flushleft}\n", "\n\\end{flushleft}")
                  }
                  disabled={readOnly}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Left</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    insertText("\\begin{center}\n", "\n\\end{center}")
                  }
                  disabled={readOnly}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Center</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    insertText("\\begin{flushright}\n", "\n\\end{flushright}")
                  }
                  disabled={readOnly}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Right</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertEnvironment("tabular")}
                  disabled={readOnly}
                >
                  <Table className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Table</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertText("\\includegraphics{", "}")}
                  disabled={readOnly}
                >
                  <Image className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Image</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => insertText("\\href{", "}{}")}
                  disabled={readOnly}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Link</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (editorRef.current?.editor) {
                      editorRef.current.editor.undo();
                    }
                  }}
                  disabled={readOnly}
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (editorRef.current?.editor) {
                      editorRef.current.editor.redo();
                    }
                  }}
                  disabled={readOnly}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (editorRef.current?.editor) {
                      editorRef.current.editor.execCommand("find");
                    }
                  }}
                  disabled={readOnly}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Find</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (editorRef.current?.editor) {
                      editorRef.current.editor.execCommand("replace");
                    }
                  }}
                  disabled={readOnly}
                >
                  <Replace className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Replace</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex-1" ref={editorWrapperRef}>
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
      </div>

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-white shadow-sm hover:bg-gray-50 improve-ai-button border-black"
              >
                <Sparkles className="h-3 w-3" />
                Improve Line with AI
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  handleImproveWithAI(improveLineNumber, "shorten");
                  setButtonPosition(null);
                }}
              >
                Shorten
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleImproveWithAI(improveLineNumber, "lengthen");
                  setButtonPosition(null);
                }}
              >
                Lengthen
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleImproveWithAI(improveLineNumber, "professional");
                  setButtonPosition(null);
                }}
              >
                Make More Professional
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleImproveWithAI(improveLineNumber, "technical");
                  setButtonPosition(null);
                }}
              >
                Add Technical Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
