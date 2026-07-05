export interface ISourceLine {
  line: string;
  number: number;
  origin: number;
}

type ExpandedLine = { line: string; origin: number };

type Macro = {
  name: string;
  params: string[];
  body: string[];
  localLabels: string[];
  definedAt: number;
};

const MAX_EXPANSION_DEPTH = 32;

type IMacroErrorToken = { lineNumber: number; value: null };

const invalidToken = (lineNumber: number): IMacroErrorToken => ({ lineNumber, value: null });

const throwMacroError = (message: string, lineNumber: number): never => {
  throw new Error(message, { cause: [invalidToken(lineNumber)] });
};

const throwMacroRedefined = (lineNumber: number) => throwMacroError("ASSEMBLER_MACRO_REDEFINED", lineNumber);
const throwMacroUnclosed = (lineNumber: number) => throwMacroError("ASSEMBLER_MACRO_UNCLOSED", lineNumber);
const throwMacroBadArity = (lineNumber: number) => throwMacroError("ASSEMBLER_MACRO_BAD_ARITY", lineNumber);
const throwMacroRecursion = (lineNumber: number) => throwMacroError("ASSEMBLER_MACRO_RECURSION", lineNumber);
const throwMacroBadDefinition = (lineNumber: number) => throwMacroError("ASSEMBLER_MACRO_BAD_DEFINITION", lineNumber);

const stripComment = (s: string): string => {
  let readingStr = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'") readingStr = !readingStr;
    else if (c === "#" && !readingStr) return s.slice(0, i);
  }

  return s;
};

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isEndMacro = (line: string) => /^\.endmacro\b/i.test(line) || /^\.endm\b/i.test(line);

const parseMacroHeader = (rest: string, lineNumber: number): { name: string; params: string[] } => {
  const parts = rest
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (parts.length === 0) {
    throwMacroBadDefinition(lineNumber);
  }

  const [name, ...params] = parts;

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throwMacroBadDefinition(lineNumber);
  }

  for (const p of params) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p)) {
      throwMacroBadDefinition(lineNumber);
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

const parseDefinitions = (lines: ISourceLine[]): { macros: Record<string, Macro>; rest: ISourceLine[] } => {
  const macros: Record<string, Macro> = {};
  const rest: ISourceLine[] = [];

  let cur: { name: string; params: string[]; body: string[]; definedAt: number } | null = null;

  for (const sl of lines) {
    const line = stripComment(sl.line).trim();

    if (cur) {
      if (isEndMacro(line)) {
        if (macros[cur.name]) {
          throwMacroRedefined(cur.definedAt);
        }

        macros[cur.name] = {
          name: cur.name,
          params: cur.params,
          body: cur.body,
          localLabels: collectLocalLabels(cur.body),
          definedAt: cur.definedAt,
        };
        cur = null;
        rest.push({ line: "", number: sl.number, origin: sl.number });
        continue;
      }

      if (/^\.macro\b/i.test(line)) {
        throwMacroBadDefinition(sl.number);
      }

      cur.body.push(sl.line);
      rest.push({ line: "", number: sl.number, origin: sl.number });
      continue;
    }

    if (/^\.macro\b/i.test(line)) {
      const headerRest = line.replace(/^\.macro\b/i, "").trim();
      const { name, params } = parseMacroHeader(headerRest, sl.number);
      cur = { name, params, body: [], definedAt: sl.number };
      rest.push({ line: "", number: sl.number, origin: sl.number });
      continue;
    }

    rest.push(sl);
  }

  if (cur) {
    throwMacroUnclosed(cur.definedAt);
  }

  return { macros, rest };
};

const splitArgs = (s: string): string[] => {
  const args: string[] = [];
  let depth = 0;
  let inString: string | null = null;
  let buf = "";

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      buf += c;
      if (c === inString) inString = null;
      else if (c === "\\" && i + 1 < s.length) buf += s[++i];
      continue;
    }
    if (c === '"' || c === "'") {
      inString = c;
      buf += c;
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")") depth = Math.max(0, depth - 1);

    if (c === "," && depth === 0) {
      args.push(buf.trim());
      buf = "";
      continue;
    }
    buf += c;
  }

  const tail = buf.trim();
  if (tail.length > 0 || args.length > 0) args.push(tail);
  return args;
};

const replaceWord = (line: string, word: string, replacement: string): string => {
  const re = word.startsWith(".")
    ? new RegExp(`${escapeRegex(word)}(?![a-zA-Z0-9_.])`, "g")
    : new RegExp(`\\b${escapeRegex(word)}\\b`, "g");
  return line.replace(re, replacement);
};

const replaceMacroParam = (line: string, param: string, replacement: string): string => {
  const re = new RegExp(`\\\\+${escapeRegex(param)}(?![a-zA-Z0-9_])`, "g");
  return line.replace(re, replacement);
};

const expandLine = (
  rawLine: string,
  origin: number,
  macros: Record<string, Macro>,
  depth: number,
  counter: { n: number }
): ExpandedLine[] => {
  if (depth > MAX_EXPANSION_DEPTH) {
    throwMacroRecursion(origin);
  }

  const trimmed = rawLine.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return [{ line: rawLine, origin }];
  }

  const labelMatch = trimmed.match(/^([a-zA-Z_.][a-zA-Z0-9_.]*\s*:)\s*(.*)$/);
  if (labelMatch) {
    const labelPart = labelMatch[1].replace(/\s+/g, "");
    const rest = labelMatch[2];
    if (!rest.trim()) return [{ line: labelPart, origin }];

    const expandedRest = expandLine(rest, origin, macros, depth, counter);
    if (expandedRest.length === 1 && expandedRest[0].line.trim() === rest.trim()) {
      return [{ line: `${labelPart} ${rest.trim()}`, origin }];
    }

    return [{ line: labelPart, origin }, ...expandedRest];
  }

  const invMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(.*)$/);
  if (!invMatch) {
    return [{ line: rawLine, origin }];
  }

  const name = invMatch[1];
  const macro = macros[name];
  if (!macro) {
    return [{ line: rawLine, origin }];
  }

  const argsRaw = stripComment(invMatch[2]).trim();
  const args = !argsRaw ? [] : splitArgs(argsRaw);

  if (args.length !== macro.params.length) {
    throwMacroBadArity(origin);
  }

  const uniqueSuffix = `__macro_${macro.name}_${counter.n}__`;
  counter.n++;

  const result: ExpandedLine[] = [];
  for (const bodyLine of macro.body) {
    let expanded = bodyLine;
    for (const label of macro.localLabels) {
      expanded = replaceWord(expanded, label, label + uniqueSuffix);
    }

    for (let i = 0; i < macro.params.length; i++) {
      expanded = replaceMacroParam(expanded, macro.params[i], args[i]);
    }

    result.push(...expandLine(expanded, origin, macros, depth + 1, counter));
  }

  return result;
};

export function expandMacros(code: string): ISourceLine[] {
  const counter = { n: 0 };
  const out: ExpandedLine[] = [];
  const lines: ISourceLine[] = code.split(/\n/g).map((line, i) => ({ line, number: i + 1, origin: i + 1 }));
  const { macros, rest } = parseDefinitions(lines);

  for (const sl of rest) {
    out.push(...expandLine(sl.line, sl.number, macros, 0, counter));
  }

  return out.map((sl, idx) => ({ line: sl.line, number: idx + 1, origin: sl.origin }));
}

export function preprocessor(code: string): ISourceLine[] {
  return expandMacros(code);
}
