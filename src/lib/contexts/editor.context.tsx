import type { Monaco } from "@monaco-editor/react";
import { createContext, useContext, useState } from "react";

const EditorContext = createContext(
  {} as {
    editor: any;
    monaco: Monaco;
    setEditor: (editor: any) => void;
    setMonaco: (monaco: Monaco) => void;
    focusLine: (line: number) => void;
  }
);

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [editor, setEditor] = useState<any | null>(null);
  const [monaco, setMonaco] = useState<Monaco | null>(null);

  const focusLine = (line: number) => {
    if (!editor) {
      console.warn("EditorProvider: focusLine: no editor!");
      return;
    }

    editor.revealLine(line);
    editor.setPosition({ lineNumber: line, column: 999 });
    editor.focus();
  };

  return (
    <EditorContext.Provider
      value={{
        editor,
        setEditor,
        monaco,
        setMonaco,
        focusLine,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => useContext(EditorContext);
