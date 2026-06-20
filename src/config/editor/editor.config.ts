import type { EditorProps } from "@monaco-editor/react";
import { registerRiscvLanguage } from "./languages/riscv-editor-language.config";

export const editorOptions: EditorProps["options"] = {
  automaticLayout: true,
  scrollBeyondLastLine: false,
  fontSize: 20,
  glyphMargin: true,
  language: "riscv",
  theme: "rvsim-dark",
};

export const handleEditorWillMount: EditorProps["beforeMount"] = (monaco) => {
  monaco.editor.defineTheme("rvsim-dark", {
    base: "vs-dark",
    inherit: true,
    colors: {
      // "editor.foreground": "#f8f8f2",
      // "editor.background": "#282a36",
    },

    rules: [
      { token: "comment", foreground: "#6272a4", fontStyle: "bold" },
      { token: "keyword", foreground: "#bd93f9" },
      { token: "identifier", foreground: "#8be9fd" },
      { token: "number", foreground: "#ff79c6" },
      { token: "string", foreground: "#ffb86c" },
    ],
  });

  registerRiscvLanguage(monaco);
};
