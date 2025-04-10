import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-latex";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export const CodeEditor = ({
  value,
  onChange,
  readOnly = false,
}: CodeEditorProps) => {
  return (
    <div className="h-full w-full">
      <AceEditor
        mode="latex"
        theme="github"
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
        }}
        width="100%"
        height="100%"
        readOnly={readOnly}
        fontSize={14}
      />
    </div>
  );
};
