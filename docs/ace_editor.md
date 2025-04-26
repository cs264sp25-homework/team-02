# Ace Editor Implementation Documentation

## Overview

This document outlines the implementation of the Ace Editor in the `code-editor.tsx` component. The Ace Editor is a powerful code editor component that provides syntax highlighting, code completion, and other advanced features. In this implementation, it's specifically configured for LaTeX editing with additional features for text formatting and AI-assisted improvements.

## Installation and Setup

The Ace Editor is implemented using the `react-ace` package, which is a React wrapper for the Ace Editor. The following imports are required:

```typescript
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-latex";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";
```

These imports include:

- The main Ace Editor component
- LaTeX syntax highlighting mode
- The "tomorrow" theme
- Language tools extension for autocompletion
- Searchbox extension for find/replace functionality

## Component Props

The `CodeEditor` component accepts the following props:

```typescript
interface CodeEditorProps {
  value: string; // The current content of the editor
  onChange?: (value: string) => void; // Callback when content changes
  readOnly?: boolean; // Whether the editor is read-only
  onSave?: () => void; // Callback when save is triggered
  handleImproveWithAI: (
    // Callback for AI improvements
    lineNumber: number | null,
    action: ImproveResumeActionType,
  ) => void;
  clickedText: string | null; // Text to find in the editor
}
```

## Editor Configuration

The Ace Editor is configured with the following settings:

```typescript
<AceEditor
  ref={editorRef}
  mode="latex"
  theme="tomorrow"
  onChange={(value) => {
    onChange?.(value);
    setOriginalContent(null);
  }}
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
```

Key configuration options:

- `mode`: Set to "latex" for LaTeX syntax highlighting
- `theme`: Uses the "tomorrow" theme
- `editorProps`: Enables block scrolling for better performance
- `setOptions`: Configures autocompletion, line numbers, tab size, and word wrap
- `width` and `height`: Set to 100% to fill the container
- `fontSize`: Set to 14px for readability

## Editor Reference

The editor is accessed using a React ref:

```typescript
const editorRef = useRef<AceEditor>(null);
```

This reference allows direct access to the editor instance and its methods, which is used for various operations like:

- Getting and setting cursor position
- Inserting and replacing text
- Executing editor commands (undo, redo, find, replace)
- Accessing the editor session for line manipulation

## Text Manipulation Functions

### Inserting Text

The `insertText` function handles inserting text at the cursor position or around selected text:

```typescript
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
```

### Inserting New Lines

The `insertNewLine` function adds a new line with a prefix:

```typescript
const insertNewLine = (prefix: string) => {
  if (!editorRef.current?.editor || readOnly) return;

  const editor = editorRef.current.editor;
  editor.insert(`\n${prefix}`);
};
```

### Inserting Environments

The `insertEnvironment` function wraps text in LaTeX environments:

```typescript
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
```

## Event Handling

### Keyboard Events

The component listens for keyboard events to handle save operations:

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    onSave?.();
  }
};
```

### Click Events

The component handles click events to manage the AI improvement dropdown:

```typescript
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
```

### Double-Click Events

Double-clicking on a line triggers the AI improvement dropdown:

```typescript
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
```

### Scroll Events

Scrolling the editor hides the AI improvement dropdown:

```typescript
const handleScroll = () => {
  setButtonPosition(null);
};
```

## AI Integration

The editor includes AI-assisted improvements for LaTeX content:

1. Double-clicking on a line shows an "Improve Line with AI" dropdown
2. The dropdown offers options to:
   - Shorten the line
   - Lengthen the line
   - Make the line more professional
   - Add technical details
3. When an improvement is applied, the original content is stored for potential reversion
4. A "Revert AI" button appears when AI changes have been made

## Toolbar Functions

The editor includes a toolbar with buttons for common LaTeX formatting operations:

- Text formatting: Bold, Italic, Underline
- Lists: Bullet lists, Numbered lists
- Headings: Section, Subsection, Subsubsection
- Alignment: Left, Center, Right
- Special elements: Tables, Images, Links
- Editor operations: Undo, Redo, Find, Replace

Each button uses the appropriate text manipulation function to insert the corresponding LaTeX markup.

## Best Practices

1. **Accessing the Editor Instance**: Always check if the editor reference exists before accessing it:

   ```typescript
   if (editorRef.current?.editor) {
     // Access editor methods
   }
   ```

2. **Handling Read-Only Mode**: Check the `readOnly` prop before performing operations:

   ```typescript
   if (!editorRef.current?.editor || readOnly) return;
   ```

3. **Cursor Positioning**: After inserting text, position the cursor appropriately:

   ```typescript
   const cursor = editor.getCursorPosition();
   editor.moveCursorTo(cursor.row, cursor.column - after.length);
   ```

4. **Event Cleanup**: Remove event listeners in the cleanup function of useEffect:
   ```typescript
   return () => {
     if (wrapper) {
       wrapper.removeEventListener("dblclick", handleDoubleClick);
     }
     document.removeEventListener("keydown", handleKeyDown);
     document.removeEventListener("click", handleClickOutside);
   };
   ```

## Conclusion

The Ace Editor implementation in the `code-editor.tsx` component provides a powerful and feature-rich LaTeX editor with AI-assisted improvements. The editor is configured for optimal performance and usability, with a comprehensive toolbar for common LaTeX operations.
