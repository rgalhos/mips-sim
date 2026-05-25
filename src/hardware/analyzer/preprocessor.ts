import {
  ETokenType,
  IToken,
  throwMacroBadArity,
  throwMacroBadDefinition,
  throwMacroRecursion,
  throwMacroRedefined,
  throwMacroUnclosed,
} from './tokenizer';

type SourceLine = { line: string; lineNumber: number };

type Macro = {
  name: string;
  params: string[];
  body: string[];
  localLabels: string[];
  definedAt: number;
};

const MAX_EXPANSION_DEPTH = 32;

const stripComment = (s: string): string => {
  let readingStr = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'") readingStr = !readingStr;
    else if (c === '#' && !readingStr) return s.slice(0, i);
  }

  return s;
};

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const invalidToken = (lineNumber: number): IToken => ({
  type: ETokenType.INVALID,
  value: null,
  lineNumber,
});

const parseMacroHeader = (rest: string, lineNumber: number): { name: string; params: string[] } => {
  const parts = rest
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (parts.length === 0) {
    throw throwMacroBadDefinition([invalidToken(lineNumber)]);
  }

  const [name, ...params] = parts;

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw throwMacroBadDefinition([invalidToken(lineNumber)]);
  }

  for (const p of params) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p)) {
      throw throwMacroBadDefinition([invalidToken(lineNumber)]);
    }
  }

  return { name, params };
};

const collectLocalLabels = (body: string[]): string[] => {
  const labels = new Set<string>();
  const re = /(?:^|\s)([a-zA-Z_.][a-zA-Z0-9_.]*)\s*:/g;
  for (const line of body) {
    const noComment = stripComment(line);
    let m: RegExpExecArray | null;
    while ((m = re.exec(noComment)) !== null) {
      labels.add(m[1]);
    }
  }
  return [...labels];
};

const parseDefinitions = (lines: SourceLine[]): { macros: Record<string, Macro>; rest: SourceLine[] } => {
  const macros: Record<string, Macro> = {};
  const rest: SourceLine[] = [];

  let cur: { name: string; params: string[]; body: string[]; definedAt: number } | null = null;

  for (const sl of lines) {
    const line = stripComment(sl.line).trim();

    if (cur) {
      if (/^\.endmacro\b/i.test(line)) {
        if (macros[cur.name]) {
          throw throwMacroRedefined([invalidToken(cur.definedAt)]);
        }

        macros[cur.name] = {
          name: cur.name,
          params: cur.params,
          body: cur.body,
          localLabels: collectLocalLabels(cur.body),
          definedAt: cur.definedAt,
        };
        cur = null;
        rest.push({ line: '', lineNumber: sl.lineNumber });

        continue;
      }

      if (/^\.macro\b/i.test(line)) {
        throw throwMacroBadDefinition([invalidToken(sl.lineNumber)]);
      }

      cur.body.push(sl.line);
      rest.push({ line: '', lineNumber: sl.lineNumber });

      continue;
    }

    if (/^\.macro\b/i.test(line)) {
      const headerRest = line.replace(/^\.macro\b/i, '').trim();
      const { name, params } = parseMacroHeader(headerRest, sl.lineNumber);
      cur = { name, params, body: [], definedAt: sl.lineNumber };
      rest.push({ line: '', lineNumber: sl.lineNumber });

      continue;
    }

    rest.push(sl);
  }

  if (cur) {
    throw throwMacroUnclosed([invalidToken(cur.definedAt)]);
  }

  return { macros, rest };
};

const splitArgs = (s: string): string[] => {
  const args: string[] = [];
  let depth = 0;
  let inString = null;
  let buf = '';

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      buf += c;
      if (c === inString) inString = null;
      else if (c === '\\' && i + 1 < s.length) buf += s[++i];
      continue;
    }
    if (c === '"' || c === "'") {
      inString = c;
      buf += c;
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);

    if (c === ',' && depth === 0) {
      args.push(buf.trim());
      buf = '';
      continue;
    }
    buf += c;
  }

  const tail = buf.trim();
  if (tail.length > 0 || args.length > 0) args.push(tail);
  return args;
};

const replaceWord = (line: string, word: string, replacement: string): string => {
  const re = new RegExp(`\\b${escapeRegex(word)}\\b`, 'g');
  return line.replace(re, replacement);
};

const replaceMacroParam = (line: string, param: string, replacement: string): string => {
  const re = new RegExp(`\\\\${escapeRegex(param)}(?![a-zA-Z0-9_])`, 'g');
  return line.replace(re, replacement);
};

const expandLine = (
  rawLine: string,
  lineNumber: number,
  macros: Record<string, Macro>,
  depth: number,
  counter: { n: number },
): SourceLine[] => {
  if (depth > MAX_EXPANSION_DEPTH) {
    throw throwMacroRecursion([invalidToken(lineNumber)]);
  }

  const trimmed = rawLine.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return [{ line: rawLine, lineNumber }];
  }

  const labelMatch = trimmed.match(/^([a-zA-Z_.][a-zA-Z0-9_.]*\s*:)\s*(.*)$/);
  if (labelMatch) {
    const labelPart = labelMatch[1].replace(/\s+/g, '');
    const rest = labelMatch[2];
    const out: SourceLine[] = [{ line: labelPart, lineNumber }];
    if (!rest.trim()) return out;

    return out.concat(expandLine(rest, lineNumber, macros, depth, counter));
  }

  const invMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(.*)$/);
  if (!invMatch) {
    return [{ line: rawLine, lineNumber }];
  }

  const name = invMatch[1];
  const macro = macros[name];
  if (!macro) {
    return [{ line: rawLine, lineNumber }];
  }

  const argsRaw = stripComment(invMatch[2]).trim();
  const args = !argsRaw ? [] : splitArgs(argsRaw);

  if (args.length !== macro.params.length) {
    throw throwMacroBadArity([invalidToken(lineNumber)]);
  }

  const uniqueSuffix = `__macro_${macro.name}_${counter.n}__`;
  counter.n++;

  const result: SourceLine[] = [];
  for (const bodyLine of macro.body) {
    let expanded = bodyLine;
    for (const label of macro.localLabels) {
      expanded = replaceWord(expanded, label, label + uniqueSuffix);
    }

    for (let i = 0; i < macro.params.length; i++) {
      expanded = replaceMacroParam(expanded, macro.params[i], args[i]);
    }

    result.push(...expandLine(expanded, lineNumber, macros, depth + 1, counter));
  }

  return result;
};

export const expandMacros = (code: string): SourceLine[] => {
  const counter = { n: 0 };
  const out: SourceLine[] = [];
  const lines: SourceLine[] = code.split(/\n/g).map((line, i) => ({ line, lineNumber: i + 1 }));
  const { macros, rest } = parseDefinitions(lines);

  for (const sl of rest) {
    out.push(...expandLine(sl.line, sl.lineNumber, macros, 0, counter));
  }

  return out;
};

export const preprocessor = (code: string) => {
  return expandMacros(code);
};
