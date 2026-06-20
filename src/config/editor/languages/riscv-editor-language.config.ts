import { rv_codec, rv_directives, rv_opcode, rv_opcode_pseudo, rv_reg, rv_reg_f } from "@/hardware/rv32/rv32.const";
import type { Monaco } from "@monaco-editor/react";

export function registerRiscvLanguage(monaco: Monaco) {
  monaco.languages.register({ id: "riscv" });

  const instructions = Object.keys(rv_opcode)
    .concat(Object.keys(rv_opcode_pseudo))
    .filter((v) => !!Number.isNaN(+v));
  const directives = Object.keys(rv_directives).filter((v) => !!Number.isNaN(+v));
  const consts: string[] = Object.keys(rv_codec).filter((v) => !!Number.isNaN(+v));
  const registers = Object.keys(rv_reg)
    .concat(Object.keys(rv_reg_f))
    .filter((v) => !!Number.isNaN(+v));

  const keywords = instructions.concat(directives);
  const typeKeywords = consts.concat(registers);

  monaco.languages.setMonarchTokensProvider("riscv", {
    keywords: keywords,
    typeKeywords: typeKeywords,
    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    tokenizer: {
      root: [
        [/^\s*\.?[a-zA-Z0-9_]+:/, { token: "annotation" }], // label

        // eslint-disable-next-line no-useless-escape
        [/[\.%][a-zA-Z_]+/, "keyword"], // directives
        [/[A-Z][0-9A-Z_]+/, "type.identifier"], // consts

        [/[a-z_$][.\w$]*/, { cases: { "@typeKeywords": "keyword", "@keywords": "keyword", "@default": "identifier" } }],

        [/\b0[xX][0-9a-fA-F]+\b/, "number.hex"],
        [/\b0[bB][01]+\b/, "number.binary"],
        [/(\d+?\.)?\d+\b/, "number"],

        [/#.*$/, "comment"],

        [/"([^"\\]|\\.)*$/, "string.invalid"], // non-teminated string
        [/'/, "string.invalid"],
        [/(')(@escapes)(')/, ["string", "string.escape", "string"]],
        [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
        [/'[^\\']'/, "string"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/@escapes/, "string.escape"],
        [/\\./, "string.escape.invalid"],
        [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration("riscv", {
    comments: {
      lineComment: "#",
    },
    brackets: [["(", ")"]],
    autoClosingPairs: [{ open: "(", close: ")" }],
    surroundingPairs: [{ open: "(", close: ")" }],
  });

  monaco.languages.registerCompletionItemProvider("riscv", {
    triggerCharacters: [".", "%"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provideCompletionItems: (model: any, position: any) => {
      const line = model.getLineContent(position.lineNumber);
      let startColumn = position.column;

      while (startColumn > 1 && /[a-zA-Z0-9_.$%]/.test(line[startColumn - 2])) {
        startColumn--;
      }

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn,
        endColumn: position.column,
      };

      return {
        suggestions: [
          ...instructions.map((keyword) => ({
            insertText: keyword,
            label: keyword,
            // label: { label: keyword, detail: " " + (instuctionsManual[keyword]?.usage || "") },
            kind: monaco.languages.CompletionItemKind.Keyword,
            range,
          })),
          ...consts.map((c) => ({
            insertText: c,
            label: c,
            kind: monaco.languages.CompletionItemKind.Constant,
            range,
          })),
          ...directives.map((directive) => ({
            insertText: directive,
            label: directive,
            kind: monaco.languages.CompletionItemKind.EnumMember,
            range,
          })),
          ...registers.map((register, i) => ({
            insertText: register,
            label: register,
            kind: monaco.languages.CompletionItemKind.EnumMember,
            // detail: simulator.manual.registers?.[i]?.alias || "",
            range,
          })),
        ],
      };
    },
  });
}
