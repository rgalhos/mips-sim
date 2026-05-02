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

export type IToken =
  | {
      type: ETokenType.IDENTIFIER | ETokenType.STRING | ETokenType.CHAR | ETokenType.LABEL;
      value: string;
    }
  | { type: ETokenType.RELOC; value: string }
  | { type: ETokenType.NUMBER; value: number }
  | { type: ETokenType.INVALID | ETokenType.EOL; value: string | number | null };

export function tokenize(line: string) {
  line = line.trim();

  const tokens: IToken[] = [];

  let readingOffset = false;
  let i = 0;

  while (i < line.length) {
    let c = line[i];

    if (/\s/.test(c)) {
      i++;
      continue;
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
      tokens.push({ type: ETokenType.STRING, value });
      if (line[j] !== '"') {
        // end of line without "
        tokens.push({ type: ETokenType.INVALID, value });
        break;
      }
      i = j + 1;
      continue;
    }
    // char
    else if (c === "'") {
      let value = line[i + 1];
      tokens.push({ type: ETokenType.CHAR, value });
      if (line[i + 2] !== "'") {
        tokens.push({ type: ETokenType.INVALID, value: line[i + 2] });
        break;
      }
      i = i + 3;
      continue;
    }
    // relocation operator %name ( ... )
    else if (c === '%') {
      const nameStart = i + 1;
      if (nameStart >= line.length || !/[a-zA-Z_.]/.test(line[nameStart])) {
        tokens.push({ type: ETokenType.INVALID, value: '%' });
        break;
      }
      let j = nameStart + 1;
      while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) {
        j++;
      }
      tokens.push({ type: ETokenType.RELOC, value: line.slice(nameStart, j).toLowerCase() });
      i = j;
      while (i < line.length && /\s/.test(line[i])) {
        i++;
      }
      if (i >= line.length || line[i] !== '(') {
        tokens.push({ type: ETokenType.INVALID, value: '(' });
        break;
      }
      i++;
      while (i < line.length && /\s/.test(line[i])) {
        i++;
      }
      if (i >= line.length) {
        tokens.push({ type: ETokenType.INVALID, value: null });
        break;
      }
      c = line[i];
      // inner: identifier
      if (/[a-zA-Z_.]/.test(c)) {
        let k = i + 1;
        let idVal = c;
        while (k < line.length && /[a-zA-Z0-9_]/.test(line[k])) {
          idVal += line[k];
          k++;
        }
        tokens.push({ type: ETokenType.IDENTIFIER, value: idVal });
        i = k;
      }
      // inner: number
      else if (/[0-9-]/.test(c)) {
        let k = i + 1;
        let isNegative = 1;
        let nc = c;
        if (nc === '-') {
          isNegative = -1;
          if (k >= line.length) {
            tokens.push({ type: ETokenType.INVALID, value: '-' });
            break;
          }
          nc = line[k++];
        }
        let numStr = nc;
        if (nc === '0' && k < line.length && /[xX]/.test(line[k])) {
          numStr += line[k++];
          while (k < line.length && /[0-9a-fA-F]/.test(line[k])) {
            numStr += line[k++];
          }
        } else if (nc === '0' && k < line.length && /[bB]/.test(line[k])) {
          numStr += line[k++];
          while (k < line.length && /[01]/.test(line[k])) {
            numStr += line[k++];
          }
        } else if (/[0-9]/.test(nc)) {
          while (k < line.length && /[0-9]/.test(line[k])) {
            numStr += line[k++];
          }
        } else {
          tokens.push({ type: ETokenType.INVALID, value: nc });
          break;
        }
        const v = Number(numStr) * isNegative;
        if (isNaN(v)) {
          tokens.push({ type: ETokenType.INVALID, value: v });
          break;
        }
        tokens.push({ type: ETokenType.NUMBER, value: v });
        i = k;
      } else {
        tokens.push({ type: ETokenType.INVALID, value: c });
        break;
      }
      while (i < line.length && /\s/.test(line[i])) {
        i++;
      }
      if (i >= line.length || line[i] !== ')') {
        tokens.push({ type: ETokenType.INVALID, value: ')' });
        break;
      }
      i++;
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
      if (line[j] === ':') {
        tokens.push({ type: ETokenType.LABEL, value });
        i++;
      } else {
        const prev = tokens[tokens.length - 1];
        if (
          readingOffset &&
          prev &&
          (prev.type === ETokenType.NUMBER || prev.type === ETokenType.IDENTIFIER)
        ) {
          const offset = tokens.pop()!;
          tokens.push({ type: ETokenType.IDENTIFIER, value });
          tokens.push(offset);
        } else {
          tokens.push({ type: ETokenType.IDENTIFIER, value });
        }
      }
      continue;
    }
    // number
    // eslint-disable-next-line no-useless-escape
    else if (/[0-9-]/.test(c)) {
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
        tokens.push({ type: ETokenType.INVALID, value });
        break;
      }

      const v = Number(value) * isNegative;
      if (isNaN(v)) {
        // @todo tratar melhor aí em cima
        tokens.push({ type: ETokenType.INVALID, value: v });
        break;
      }

      tokens.push({ type: ETokenType.NUMBER, value: v });
      i = j;
      continue;
    }
    // comma. ignore
    else if (c === ',') {
      i++;
      continue;
    }
    // comment. discard line
    else if (c === '#') {
      break;
    } else if (c === '(') {
      readingOffset = true;
      i++;
      continue;
    } else if (c === ')') {
      readingOffset = false;
      i++;
      continue;
    }
    // invalid char
    else {
      tokens.push({ type: ETokenType.INVALID, value: c });
      i++;
      break;
    }
  }

  return tokens;
}
