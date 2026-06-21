import { editorOptions, handleEditorWillMount } from "@/config/editor/editor.config";
import { useEditor } from "@/lib/contexts/editor.context";
import { debounce } from "@/lib/utils";
import { Editor, type EditorProps } from "@monaco-editor/react";
import { memo } from "react";

const EDITOR_DRAFT_STORAGE_KEY = "editor_contents";

function MemoEditorContainer(props: { handleEditorChange?: () => void }) {
  const { setEditor, setMonaco } = useEditor();

  const saveEditorContents = (content: string) => {
    localStorage.setItem(EDITOR_DRAFT_STORAGE_KEY, content);
  };

  const saveEditorContentsDebounced = debounce(saveEditorContents, 500);

  const handleEditorDidMount: EditorProps["onMount"] = (editor, monaco) => {
    setEditor(editor);
    setMonaco(monaco);

    const draft = localStorage.getItem(EDITOR_DRAFT_STORAGE_KEY);
    if (!!draft) {
      editor.setValue(draft);
    }
  };

  const handleEditorChange: EditorProps["onChange"] = (value, editor) => {
    void editor;

    if (value) {
      saveEditorContentsDebounced(value);
    }

    props?.handleEditorChange?.();
  };

  return (
    <div className="min-h-0 flex-1">
      <Editor
        width="100%"
        height="100%"
        language="riscv"
        theme="rvsim-dark"
        options={editorOptions}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
      />
    </div>
  );
}

export const EditorContainer = memo(MemoEditorContainer);
