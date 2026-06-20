import { editorOptions, handleEditorWillMount } from "@/config/editor/editor.config";
import { useEditor } from "@/lib/contexts/editor.context";
import { Editor, type EditorProps } from "@monaco-editor/react";
import { memo } from "react";

function MemoEditorContainer(props: { handleEditorChange?: () => void }) {
  const { setEditor, setMonaco } = useEditor();

  const handleEditorDidMount: EditorProps["onMount"] = (editor, monaco) => {
    setEditor(editor);
    setMonaco(monaco);
    console.log(editor);
  };

  const handleEditorChange: EditorProps["onChange"] = (value, editor) => {
    void value;
    void editor;
    props?.handleEditorChange?.();
  };

  return (
    <Editor
      width="100%"
      language="riscv"
      theme="rvsim-dark"
      options={editorOptions}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
    />
  );
}

export const EditorContainer = memo(MemoEditorContainer);
