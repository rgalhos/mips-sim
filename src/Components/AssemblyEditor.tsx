import { useColorMode } from '@chakra-ui/react';
import { Global, css } from '@emotion/react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useMemo, useRef } from 'react';
import SharedData from '../Service/SharedData';
import { useSimulator } from '../hooks/simulator.hook';

const breakpointGlyphStyles = css`
  .mips-assembly-breakpoint-glyph {
    display: flex !important;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .mips-assembly-breakpoint-glyph::before {
    content: '';
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #ed2939;
  }
  .monaco-editor .margin-view-numbers .line-numbers {
    cursor: pointer;
  }
`;

function AssemblyEditor(props: { onEditorChange: (value: string | undefined, event: any) => void }) {
  const { simulator } = useSimulator();
  const { colorMode } = useColorMode();
  const breakpointDecorationIdsRef = useRef<string[]>([]);
  const breakpointsRef = useRef(new Set<number>());

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

          [/\.[a-zA-Z]+/, 'keyword'], // directives
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
  }

  function applyBreakpointDecorations(editor: any, monaco: Monaco, lines: Set<number>) {
    const model = editor.getModel();
    if (!model) return;

    const sorted = Array.from(lines).sort((a, b) => a - b);
    const decos = sorted.map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        glyphMarginClassName: 'mips-assembly-breakpoint-glyph',
        glyphMargin: { position: monaco.editor.GlyphMarginLane.Center },
        overviewRuler: {
          color: 'rgba(229, 20, 0, 0.55)',
          darkColor: 'rgba(229, 20, 0, 0.85)',
          position: monaco.editor.OverviewRulerLane.Left,
        },
      },
    }));

    breakpointDecorationIdsRef.current = editor.deltaDecorations(breakpointDecorationIdsRef.current, decos);
  }

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    share.monacoEditor = editor;
    share.monaco = monaco;

    monaco.editor.setTheme(colorMode === 'dark' ? 'mipsdark' : 'mipslight');

    // makes sure the editor mounts with the right code
    if (!share.code) {
      editor.setValue(share.code);
    } else editor.setValue(defaultcode);

    applyBreakpointDecorations(editor, monaco, breakpointsRef.current);

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

    const disposable = editor.onMouseDown((e: any) => {
      if (!e.event.leftButton) return;
      const targetType = e.target.type;
      if (
        targetType !== monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS &&
        targetType !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN
      ) {
        return;
      }
      const line = e.target.position?.lineNumber;
      if (line == null) return;
      e.event.preventDefault();
      e.event.stopPropagation();
      const bp = breakpointsRef.current;
      if (bp.has(line)) bp.delete(line);
      else bp.add(line);
      applyBreakpointDecorations(editor, monaco, new Set(bp));
    });

    editor.onDidDispose(() => {
      disposable.dispose();
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
    <>
      <Global styles={breakpointGlyphStyles} />

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
    </>
  );
}

export default AssemblyEditor;
