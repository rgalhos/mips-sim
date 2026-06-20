import type { Monaco } from "@monaco-editor/react";
import { createContext, useContext, useState } from "react";

const EditorContext = createContext(
  {} as {
    editor: any;
    monaco: Monaco;
    setEditor: (editor: any) => void;
    setMonaco: (monaco: Monaco) => void;
  }
);

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [editor, setEditor] = useState<any | null>(null);
  const [monaco, setMonaco] = useState<Monaco | null>(null);

  return (
    <EditorContext.Provider
      value={{
        editor,
        setEditor,
        monaco,
        setMonaco,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => useContext(EditorContext);
