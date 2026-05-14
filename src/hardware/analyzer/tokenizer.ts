export enum ETokenType {
  IDENTIFIER,
  STRING,
  CHAR,
  NUMBER,
  LABEL,
  RELOC,
  INVALID,
  EOL,
}

export type IToken = { lineNumber: number } & (
  | {
      type: ETokenType.IDENTIFIER | ETokenType.STRING | ETokenType.CHAR | ETokenType.LABEL;
      value: string;
    }
  | { type: ETokenType.RELOC; value: string }
  | { type: ETokenType.NUMBER; value: number }
  | { type: ETokenType.INVALID | ETokenType.EOL; value: string | number | null }
);

export const throwUnexpectedToken = (tokens: IToken[]) => {
  return new Error('ASSEMBLER_UNEXPECTED_TOKEN', { cause: tokens });
};

export const throwUndeclaredLabel = (tokens: IToken[]) => {
  return new Error('ASSEMBLER_UNDECLARED_LABEL', { cause: tokens });
};

export const throwUnknownKeyword = (tokens: IToken[]) => {
  return new Error('ASSEMBLER_UNKNOWN_KEYWORD', { cause: tokens });
};

export const throwCircularDeclaration = (tokens: IToken[]) => {
  return new Error('ASSEMBLER_CIRCULAR_DECLARATION', { cause: tokens });
};

export const throwConflictingDeclaration = (tokens: IToken[]) => {
  return new Error('ASSEMBLER_CONFLICTING_DECLARATION', { cause: tokens });
};

export const stringifyTokenizerError = (e: Error) => {
  if (!e.message.startsWith('ASSEMBLER_')) return e.toString();

  const lineNumber = ((e.cause as IToken[]) || []).find((v) => v.lineNumber !== 0)?.lineNumber || 0;
  const fullLine = ((e.cause as IToken[]) || []).map((v) => v.value).join(' ');
  let msg = '';

  if (e.message === 'ASSEMBLER_UNEXPECTED_TOKEN') {
    const invalid = ((e.cause as IToken[]) || []).find((v) => v.type === ETokenType.INVALID);
    if (invalid) {
      msg = `Found invalid token (${invalid.value}) at line ${lineNumber}: ${fullLine}`;
    } else {
      msg = `Unexpected token at line ${lineNumber}: ${fullLine}`;
    }
  } else if (e.message === 'ASSEMBLER_UNDECLARED_LABEL') {
    msg = `Undeclared constant or label referenced at line ${lineNumber}: ${fullLine}`;
  } else if (e.message === 'ASSEMBLER_UNKNOWN_KEYWORD') {
    msg = `Invalid keyword at line ${lineNumber}: ${fullLine}`;
  } else if (e.message === 'ASSEMBLER_CIRCULAR_DECLARATION') {
    msg = `Circular declaration detected at line ${lineNumber}: ${fullLine}`;
  } else if (e.message === 'ASSEMBLER_CONFLICTING_DECLARATION') {
    msg = `Label or constant declared twice at line ${lineNumber}: ${fullLine}`;
  }

  return msg;
};

export function tokenize(line: string, lineNumber: number) {
  line = line.trim();

  const tokens: IToken[] = [];

  let readingOffset = false;
  let readingReloc = false;
  let relocSawArg = false;
  let i = 0;

  while (i < line.length) {
    let c = line[i];

    if (/\s/.test(c)) {
      i++;
      continue;
    }

    if (readingReloc && (c === '"' || c === "'" || c === '%')) {
      tokens.push({ type: ETokenType.INVALID, value: c, lineNumber });
      break;
    }

    // string
    if (c === '"') {
      let j = i + 1;
      let value = '';
      while (j < line.length && line[j] !== '"') {
        c = line[j];
        if (c === '\\') {
          c = line[++j];
          if (c === 'n') {
            c = '\n';
          } else if (c === '0') {
            c = '\0';
          }
        }
        value += c;
        j++;
      }
      tokens.push({ type: ETokenType.STRING, value, lineNumber });
      if (line[j] !== '"') {
        // end of line without "
        tokens.push({ type: ETokenType.INVALID, value, lineNumber });
        break;
      }
      i = j + 1;
      continue;
    }
    // char
    else if (c === "'") {
      let value = line[i + 1];
      tokens.push({ type: ETokenType.CHAR, value, lineNumber });
      if (line[i + 2] !== "'") {
        tokens.push({ type: ETokenType.INVALID, value: line[i + 2], lineNumber });
        break;
      }
      i = i + 3;
      continue;
    }
    // relocation operator %name ( ... )
    else if (c === '%') {
      const nameStart = i + 1;
      if (nameStart >= line.length || !/[a-zA-Z_.]/.test(line[nameStart])) {
        tokens.push({ type: ETokenType.INVALID, value: '%', lineNumber });
        break;
      }
      let j = nameStart + 1;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) {
        j++;
      }
      tokens.push({ type: ETokenType.RELOC, value: line.slice(nameStart, j).toLowerCase(), lineNumber });
      i = j;
      while (i < line.length && /\s/.test(line[i])) {
        i++;
      }
      if (i >= line.length || line[i] !== '(') {
        tokens.push({ type: ETokenType.INVALID, value: '(', lineNumber });
        break;
      }
      i++;
      while (i < line.length && /\s/.test(line[i])) {
        i++;
      }
      if (i >= line.length) {
        tokens.push({ type: ETokenType.INVALID, value: null, lineNumber });
        break;
      }
      if (line[i] === ')') {
        tokens.push({ type: ETokenType.INVALID, value: ')', lineNumber });
        break;
      }
      readingReloc = true;
      relocSawArg = false;
      continue;
    }
    // identifier
    else if (/[a-zA-Z_.]/.test(c)) {
      let j = i + 1;
      let value = c;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) {
        value += line[j];
        j++;
      }
      i = j;
      if (readingReloc && line[j] === ':') {
        tokens.push({ type: ETokenType.INVALID, value: ':', lineNumber });
        break;
      } else if (readingReloc && relocSawArg) {
        tokens.push({ type: ETokenType.INVALID, value: value, lineNumber });
        break;
      } else if (line[j] === ':') {
        tokens.push({ type: ETokenType.LABEL, value, lineNumber });
        i++;
      } else if (readingOffset) {
        const prev = tokens[tokens.length - 1];
        const prev2 = tokens[tokens.length - 2];

        if (prev2 && prev2.type === ETokenType.RELOC) {
          const relocArgTok = tokens.pop()!;
          const relocTok = tokens.pop()!;
          tokens.push({ type: ETokenType.IDENTIFIER, value, lineNumber });
          tokens.push(relocTok);
          tokens.push(relocArgTok);
        } else if (prev && (prev.type === ETokenType.NUMBER || prev.type === ETokenType.IDENTIFIER)) {
          const offset = tokens.pop()!;
          tokens.push({ type: ETokenType.IDENTIFIER, value, lineNumber });
          tokens.push(offset);
        }
      } else {
        tokens.push({ type: ETokenType.IDENTIFIER, value, lineNumber });
      }

      if (readingReloc) {
        relocSawArg = true;
      }
      continue;
    }
    // number
    // eslint-disable-next-line no-useless-escape
    else if (/[0-9-]/.test(c)) {
      if (readingReloc && relocSawArg) {
        tokens.push({ type: ETokenType.INVALID, value: c, lineNumber });
        break;
      }
      let j = i + 1;
      let isNegative = 1;

      if (c === '-') {
        isNegative = -1;
        c = line[j++];
      }

      let value = c;

      // hex
      if (c === '0' && /[xX]/.test(line[j])) {
        value += line[j++];
        while (j < line.length && /[0-9a-fA-F]/.test(line[j])) {
          value += line[j];
          j++;
        }
      }
      // binary
      else if (c === '0' && /[bB]/.test(line[j])) {
        value += line[j++];
        while (j < line.length && /[01]/.test(line[j])) {
          value += line[j];
          j++;
        }
      }
      // decimal
      else if (/[0-9]/.test(c)) {
        while (j < line.length && /[0-9]/.test(line[j])) {
          value += line[j];
          j++;
        }
      } else {
        tokens.push({ type: ETokenType.INVALID, value, lineNumber });
        break;
      }

      const v = Number(value) * isNegative;
      if (isNaN(v)) {
        // @todo tratar melhor aí em cima
        tokens.push({ type: ETokenType.INVALID, value: v, lineNumber });
        break;
      }

      tokens.push({ type: ETokenType.NUMBER, value: v, lineNumber });
      i = j;
      if (readingReloc) {
        relocSawArg = true;
      }
      continue;
    }
    // comma. ignore
    else if (c === ',') {
      if (readingReloc) {
        tokens.push({ type: ETokenType.INVALID, value: ',', lineNumber });
        break;
      }
      i++;
      continue;
    }
    // comment. discard line
    else if (c === '#') {
      break;
    } else if (c === '(') {
      if (readingReloc) {
        tokens.push({ type: ETokenType.INVALID, value: '(', lineNumber });
        break;
      }
      readingOffset = true;
      i++;
      continue;
    } else if (c === ')') {
      if (readingReloc) {
        if (!relocSawArg) {
          tokens.push({ type: ETokenType.INVALID, value: ')', lineNumber });
          break;
        }
        readingReloc = false;
        relocSawArg = false;
      } else {
        readingOffset = false;
      }
      i++;
      continue;
    }
    // invalid char
    else {
      tokens.push({ type: ETokenType.INVALID, value: c, lineNumber });
      i++;
      break;
    }
  }

  if (readingReloc || readingOffset) {
    const last = tokens[tokens.length - 1];
    if (!last || last.type !== ETokenType.INVALID) {
      tokens.push({ type: ETokenType.INVALID, value: null, lineNumber });
    }
  }

  return tokens;
}
