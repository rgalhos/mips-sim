import { useColorMode } from '@chakra-ui/react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useMemo } from 'react';
import SharedData from '../Service/SharedData';
import { useSimulator } from '../hooks/simulator.hook';

function AssemblyEditor(props: { onEditorChange: (value: string | undefined, event: any) => void }) {
  const { simulator } = useSimulator();
  const { colorMode } = useColorMode();

  const consts = useMemo(() => simulator.consts, [simulator]);
  const directives = useMemo(
    () => simulator.directives.concat(simulator.directives.map((v) => v.toUpperCase())),
    [simulator],
  );
  const keywords = useMemo(
    () => simulator.instructionKeywords.concat(simulator.instructionKeywords.map((v) => v.toUpperCase())),
    [simulator],
  );
  const registers = useMemo(() => simulator.registerKeywords, [simulator]);

  const share: SharedData = SharedData.instance;

  function handleEditorWillMount(monaco: Monaco) {
    monaco.languages.register({ id: 'mips' });
    monaco.languages.setMonarchTokensProvider('mips', {
      keywords: keywords.concat(directives),
      typeKeywords: consts,
      escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
      tokenizer: {
        root: [
          [/^\s*\.?[a-zA-Z0-9_]+:/, { token: 'annotation' }], // label

          [/[\.%][a-zA-Z]+/, 'keyword'], // directives
          [/[A-Z][A-Z_+]+/, 'type.identifier'], // consts

          [
            /[a-z_$][\w$]*/,
            { cases: { '@typeKeywords': 'keyword', '@keywords': 'keyword', '@default': 'identifier' } },
          ],

          [/\b0[xX][0-9a-fA-F]+\b/, 'number.hex'],
          [/\b0[bB][01]+\b/, 'number.binary'],
          [/\d+\b/, 'number'],

          [/#.*$/, 'comment'],

          [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
          [/'/, 'string.invalid'],
          [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
          [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
          [/'[^\\']'/, 'string'],
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/@escapes/, 'string.escape'],
          [/\\./, 'string.escape.invalid'],
          [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
        ],
      },
    });

    monaco.editor.defineTheme('mipsdark', {
      base: 'vs-dark',
      inherit: true,
      colors: {
        'editor.foreground': '#f8f8f2',
        'editor.background': '#282a36',
      },

      rules: [
        { token: 'comment', foreground: '#6272a4', fontStyle: 'bold' },
        { token: 'keyword', foreground: '#bd93f9' },
        { token: 'identifier', foreground: '#8be9fd' },
        { token: 'number', foreground: '#ff79c6' },
        { token: 'string', foreground: '#ffb86c' },
      ],
    });

    monaco.editor.defineTheme('mipslight', {
      base: 'vs', // Tema claro como base
      inherit: true,
      colors: {
        'editor.foreground': '#000000', // Texto padrão preto
        'editor.background': '#dfe7f0', // Cor de fundo clara
      },

      rules: [
        { token: 'comment', foreground: '#757575', fontStyle: 'italic' }, // Comentários em cinza e itálico
        { token: 'keyword', foreground: '#0000FF', fontStyle: 'bold' }, // Palavras-chave em azul e negrito
        { token: 'identifier', foreground: '#007ACC' }, // Identificadores em um azul mais claro
        { token: 'number', foreground: '#098658' }, // Números em verde
        { token: 'string', foreground: '#D69D85' }, // Strings em uma cor de tom pêssego
      ],
    });

    monaco.languages.registerCompletionItemProvider('mips', {
      // @ts-expect-error bleeeeeeh
      provideCompletionItems: () => {
        return {
          suggestions: [
            ...keywords.map((keyword) => ({
              insertText: keyword,
              label: keyword,
              kind: monaco.languages.CompletionItemKind.Keyword,
              range: 0,
            })),
            ...consts.map((c) => ({
              insertText: c,
              label: c,
              kind: monaco.languages.CompletionItemKind.Constant,
              range: 0,
            })),
            ...directives.map((directive) => ({
              insertText: directive,
              label: directive,
              kind: monaco.languages.CompletionItemKind.EnumMember, // uuuh....
              range: 0,
            })),
            ...registers.map((register) => ({
              insertText: register,
              label: register,
              kind: monaco.languages.CompletionItemKind.EnumMember, // uuuh....
              range: 0,
            })),
          ],
        };
      },
    });

    const manualMap = Object.fromEntries(
      simulator.manual.instructions
        .map((inst) => [inst.name, [{ value: inst.operation }, { value: inst.description }]])
        .concat(
          simulator.manual.registers.map((reg) => [reg.name, [{ value: `**${reg.kind}** — ${reg.description}` }]]),
        ),
    );

    monaco.languages.registerHoverProvider('mips', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);

        if (word && word.word) {
          const w = word.word.toLowerCase();
          const entry = manualMap[w];

          if (entry) {
            return { contents: entry };
          }
        }
      },
    });
  }

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    share.monacoEditor = editor;
    share.monaco = monaco;

    monaco.editor.setTheme(colorMode === 'dark' ? 'mipsdark' : 'mipslight');

    // makes sure the editor mounts with the right code
    if (!share.code) {
      editor.setValue(share.code);
    } else editor.setValue(defaultcode);

    let layoutRaf = 0;
    const scheduleLayout = () => {
      if (layoutRaf !== 0) return;
      layoutRaf = requestAnimationFrame(() => {
        layoutRaf = 0;
        editor.layout();
      });
    };

    window.addEventListener('resize', scheduleLayout);

    const container = editor.getDomNode()?.parentElement;
    const resizeObserver =
      container &&
      new ResizeObserver(() => {
        scheduleLayout();
      });
    if (container && resizeObserver) {
      resizeObserver.observe(container);
    }

    editor.onDidDispose(() => {
      window.removeEventListener('resize', scheduleLayout);
      if (layoutRaf !== 0) {
        cancelAnimationFrame(layoutRaf);
        layoutRaf = 0;
      }
      resizeObserver?.disconnect();
    });
  }

  const defaultcode = share.defaultCode;

  return (
    <Editor
      onChange={props.onEditorChange}
      height="80vh"
      defaultLanguage="mips"
      theme={colorMode === 'dark' ? 'mipsdark' : 'mipslight'}
      defaultValue={'# MIPS Assembly Sim. by Reinaldo Assis \n# Project supervisor: prof. Bruno Costa\n\n'}
      options={{
        automaticLayout: false,
        scrollBeyondLastLine: false,
        fontSize: 20,
        glyphMargin: true,
      }}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
    />
  );
}

export default AssemblyEditor;
