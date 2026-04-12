export enum ETokenType {
  IDENTIFIER,
  STRING,
  CHAR,
  NUMBER,
  INVALID,
  LABEL,
  EOL,
}

export type IToken =
  | {
      type: ETokenType.IDENTIFIER | ETokenType.STRING | ETokenType.CHAR | ETokenType.LABEL;
      value: string;
    }
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
        value += line[j];
        j++;
      }
      tokens.push({ type: ETokenType.STRING, value });
      if (line[j] !== '"') {
        // end of line without "
        tokens.push({ type: ETokenType.INVALID, value });
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
        if (readingOffset && tokens[tokens.length - 1] && tokens[tokens.length - 1].type === ETokenType.NUMBER) {
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
    else if (/[0-9]/.test(c)) {
      let j = i + 1;
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
      else {
        while (j < line.length && /[0-9]/.test(line[j])) {
          value += line[j];
          j++;
        }
      }

      const v = Number(value);
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
      console.log('sjiijsijsisjiijsiiiiiiiiiiiiiiiiiiiiiiiiiii');
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
