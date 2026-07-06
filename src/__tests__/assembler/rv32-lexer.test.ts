import { describe, expect, test } from "vitest";
import { ETokenType, tokenizer } from "../../hardware/rv32/analyzer/rv32-lexer.assembler";
import type { ISourceLine } from "../../hardware/rv32/analyzer/rv32-pre.assembler";

function toSource(lines: string[], meta: Partial<ISourceLine>[] = []): ISourceLine[] {
  return lines.map((line, i) => ({
    line,
    number: meta[i]?.number ?? i + 1,
    origin: meta[i]?.origin ?? meta[i]?.number ?? i + 1,
  }));
}

function lex(line: string, meta: Partial<ISourceLine> = {}) {
  const source: ISourceLine = {
    line,
    number: meta.number ?? 1,
    origin: meta.origin ?? meta.number ?? 1,
  };

  return tokenizer([source]);
}

function lexSource(lines: string[], meta: Partial<ISourceLine>[] = []) {
  return tokenizer(toSource(lines, meta));
}

function types(line: string) {
  return lex(line).map((t) => t.type);
}

function values(line: string) {
  return lex(line).map((t) => t.value);
}

describe("RV32 lexer", () => {
  describe("identifiers and labels", () => {
    test("tokenizes instruction mnemonics and registers", () => {
      expect(types("addi sp, sp, -4")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IMMEDIATE,
      ]);
    });

    test("declares global labels with colon", () => {
      expect(lex("main:")).toEqual([
        expect.objectContaining({ type: ETokenType.LABEL_DECL, value: "main", lexeme: "main:" }),
      ]);
    });

    test("declares numeric local labels", () => {
      expect(lex("1:")).toEqual([
        expect.objectContaining({ type: ETokenType.LABEL_DECL, value: "1", lexeme: "1:" }),
      ]);
    });

    test("declares dot-prefixed local labels", () => {
      expect(lex(".loop:")).toEqual([
        expect.objectContaining({ type: ETokenType.LABEL_DECL, value: ".loop", lexeme: ".loop:" }),
      ]);
    });

    test("references dot-prefixed local labels without colon", () => {
      expect(lex("j .loop")).toEqual([
        expect.objectContaining({ type: ETokenType.IDENTIFIER, value: "j" }),
        expect.objectContaining({ type: ETokenType.LABEL_REF, value: ".loop", lexeme: ".loop" }),
      ]);
    });

    test("allows dots inside identifiers", () => {
      expect(lex("foo.bar")).toEqual([
        expect.objectContaining({ type: ETokenType.IDENTIFIER, value: "foo.bar", lexeme: "foo.bar" }),
      ]);
    });

    test("parses label and instruction on the same physical line", () => {
      expect(types("main: nop")).toEqual([ETokenType.LABEL_DECL, ETokenType.IDENTIFIER]);
    });
  });

  describe("directives", () => {
    test("recognizes known section directives", () => {
      expect(lex(".text")).toEqual([
        expect.objectContaining({ type: ETokenType.DIRECTIVE, value: ".text" }),
      ]);
      expect(types(".rodata")).toEqual([ETokenType.DIRECTIVE]);
    });

    test("recognizes data and macro directives", () => {
      expect(values(".equ NODE_SIZE 12")).toEqual([".equ", "NODE_SIZE", 12]);
      expect(types(".macro push")).toEqual([ETokenType.DIRECTIVE, ETokenType.IDENTIFIER]);
    });

    test("treats unknown dot-names as label references, not directives", () => {
      expect(lex(".huff_done")).toEqual([
        expect.objectContaining({ type: ETokenType.LABEL_REF, value: ".huff_done" }),
      ]);
    });
  });

  describe("immediates", () => {
    test("parses signed decimal immediates", () => {
      expect(values("addi sp, sp, -4")[5]).toBe(-4);
      expect(values("addi a0, a0, +12")[5]).toBe(12);
    });

    test("parses hex and binary literals", () => {
      expect(values("addi a0, zero, 0xFF")[5]).toBe(255);
      expect(values("addi a0, zero, 0Xff")[5]).toBe(255);
      expect(values("addi a0, zero, 0b1010")[5]).toBe(10);
    });

    test("parses char literals as numeric immediates", () => {
      expect(lex(".byte 'A'")).toEqual([
        expect.objectContaining({ type: ETokenType.DIRECTIVE, value: ".byte" }),
        expect.objectContaining({ type: ETokenType.IMMEDIATE, value: 65, lexeme: "'A'" }),
      ]);
    });

    test("stores float literals as IEEE754 bit patterns", () => {
      const dataView = new DataView(new ArrayBuffer(4));
      dataView.setFloat32(0, 1.5);
      expect(values(".word 1.5")[1]).toBe(dataView.getUint32(0));
    });

    test("does not merge a digit run into a following identifier", () => {
      expect(types("123abc")).toEqual([ETokenType.IMMEDIATE, ETokenType.IDENTIFIER]);
      expect(values("123abc")).toEqual([123, "abc"]);
    });

    test("reports malformed numeric literals as invalid", () => {
      expect(types("addi a0, a0, 0x")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.INVALID,
      ]);
    });
  });

  describe("operator vs immediate disambiguation", () => {
    test("treats leading minus before digits as part of the immediate", () => {
      expect(lex("addi t0, t0, -123")[5]).toMatchObject({
        type: ETokenType.IMMEDIATE,
        value: -123,
        lexeme: "-123",
      });
    });

    test("treats minus after a value token as an operator", () => {
      expect(types("addi sp, sp, -NODE_SIZE")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.OPERATOR,
        ETokenType.IDENTIFIER,
      ]);
    });

    test("treats minus after register without comma as an operator", () => {
      expect(types("addi sp sp -4")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.IDENTIFIER,
        ETokenType.IDENTIFIER,
        ETokenType.OPERATOR,
        ETokenType.IMMEDIATE,
      ]);
    });

    test("treats minus after closing paren as an operator", () => {
      expect(types("(1)-2")).toEqual([
        ETokenType.LPAREN,
        ETokenType.IMMEDIATE,
        ETokenType.RPAREN,
        ETokenType.OPERATOR,
        ETokenType.IMMEDIATE,
      ]);
    });

    test("treats a lone minus as an operator", () => {
      expect(lex("-")).toEqual([expect.objectContaining({ type: ETokenType.OPERATOR, value: "-" })]);
    });

    test("treats a lone plus as an operator", () => {
      expect(lex("+")).toEqual([expect.objectContaining({ type: ETokenType.OPERATOR, value: "+" })]);
    });

    test("tokenizes compact arithmetic expressions", () => {
      expect(types("addi zero, zero, 1+2+3+4")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IMMEDIATE,
        ETokenType.OPERATOR,
        ETokenType.IMMEDIATE,
        ETokenType.OPERATOR,
        ETokenType.IMMEDIATE,
        ETokenType.OPERATOR,
        ETokenType.IMMEDIATE,
      ]);

      expect(types("addi zero, zero, NODE_SIZE+1")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IDENTIFIER,
        ETokenType.OPERATOR,
        ETokenType.IMMEDIATE,
      ]);

      expect(types("addi zero, zero, 2*3+4")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IMMEDIATE,
        ETokenType.OPERATOR,
        ETokenType.IMMEDIATE,
        ETokenType.OPERATOR,
        ETokenType.IMMEDIATE,
      ]);
    });
  });

  describe("relocations", () => {
    test("tokenizes %hi/%lo style relocs", () => {
      expect(lex("lui t0, %hi(decoded)")).toEqual([
        expect.objectContaining({ type: ETokenType.IDENTIFIER, value: "lui" }),
        expect.objectContaining({ type: ETokenType.IDENTIFIER, value: "t0" }),
        expect.objectContaining({ type: ETokenType.COMMA }),
        expect.objectContaining({ type: ETokenType.RELOC, value: "hi", lexeme: "%hi" }),
        expect.objectContaining({ type: ETokenType.LPAREN }),
        expect.objectContaining({ type: ETokenType.IDENTIFIER, value: "decoded" }),
        expect.objectContaining({ type: ETokenType.RPAREN }),
      ]);
    });

    test("tokenizes pcrel relocs", () => {
      expect(lex("auipc t0, %pcrel_hi(target)")[3]).toMatchObject({
        type: ETokenType.RELOC,
        value: "pcrel_hi",
      });
    });

    test("tokenizes reloc inside memory operands", () => {
      expect(types("lw a0, %hi(label)(gp)")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.RELOC,
        ETokenType.LPAREN,
        ETokenType.IDENTIFIER,
        ETokenType.RPAREN,
        ETokenType.LPAREN,
        ETokenType.IDENTIFIER,
        ETokenType.RPAREN,
      ]);
    });

    test("reports bare percent as invalid", () => {
      expect(lex("lw t0, %")).toEqual([
        expect.objectContaining({ type: ETokenType.IDENTIFIER, value: "lw" }),
        expect.objectContaining({ type: ETokenType.IDENTIFIER, value: "t0" }),
        expect.objectContaining({ type: ETokenType.COMMA }),
        expect.objectContaining({ type: ETokenType.INVALID, value: "%", lexeme: "%" }),
      ]);
    });
  });

  describe("memory operands and punctuation", () => {
    test("tokenizes offset(base) memory syntax", () => {
      expect(types("lw t0, 0(t0)")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IMMEDIATE,
        ETokenType.LPAREN,
        ETokenType.IDENTIFIER,
        ETokenType.RPAREN,
      ]);
    });

    test("tokenizes negative memory offsets", () => {
      expect(values("sw t0, -4(sp)")[3]).toBe(-4);
    });

    test("accepts extra comma separators", () => {
      expect(types("addi,, sp,, sp,, -4")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.COMMA,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.COMMA,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.COMMA,
        ETokenType.IMMEDIATE,
      ]);
    });
  });

  describe("strings and comments", () => {
    test("tokenizes string literals", () => {
      expect(lex('.string "hello"')).toEqual([
        expect.objectContaining({ type: ETokenType.DIRECTIVE, value: ".string" }),
        expect.objectContaining({ type: ETokenType.STRING, value: "hello", lexeme: '"hello"' }),
      ]);
    });

    test("decodes common string escapes", () => {
      expect(lex('.ascii "a\\nb\\0"')[1]).toMatchObject({
        type: ETokenType.STRING,
        value: "a\nb\0",
      });
    });

    test("reports unclosed strings as invalid", () => {
      expect(lex('.string "oops')).toEqual([
        expect.objectContaining({ type: ETokenType.DIRECTIVE, value: ".string" }),
        expect.objectContaining({ type: ETokenType.INVALID }),
      ]);
    });

    test("recovers from malformed char literals by re-lexing the remainder", () => {
      expect(types(".byte 'AB'")).toEqual([
        ETokenType.DIRECTIVE,
        ETokenType.INVALID,
        ETokenType.IDENTIFIER,
        ETokenType.INVALID,
      ]);
    });

    test("stops tokenization at # comments", () => {
      expect(types("addi a0, a0, 1 # increment")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IDENTIFIER,
        ETokenType.COMMA,
        ETokenType.IMMEDIATE,
      ]);
    });

    test("ignores comment-only lines", () => {
      expect(lex("# just a comment")).toEqual([]);
    });
  });

  describe("invalid tokens", () => {
    test("reports unsupported characters", () => {
      expect(lex("lw t0, @bad")[3]).toMatchObject({
        type: ETokenType.INVALID,
        value: "@",
      });
    });

    test("continues lexing after an invalid token", () => {
      expect(types("nop @ bad")).toEqual([
        ETokenType.IDENTIFIER,
        ETokenType.INVALID,
        ETokenType.IDENTIFIER,
      ]);
    });
  });

  describe("whitespace and blank lines", () => {
    test("skips leading, trailing and repeated whitespace", () => {
      expect(types("  addi\t sp , sp , -4  ")).toEqual(types("addi sp, sp, -4"));
    });

    test("produces no tokens for blank lines", () => {
      expect(lex("")).toEqual([]);
      expect(lex("   ")).toEqual([]);
    });

    test("skips blank lines in multi-line input", () => {
      expect(lexSource([".text", "", "nop"]).map((t) => t.value)).toEqual([".text", "nop"]);
    });
  });

  describe("token metadata", () => {
    test("preserves parse line, source origin and column", () => {
      const [token] = lex("  nop", { number: 7, origin: 13 });
      expect(token).toMatchObject({ line: 7, origin: 13, column: 2, lexeme: "nop" });
    });

    test("assigns distinct metadata per physical source line", () => {
      const tokens = lexSource(["nop", "nop"], [
        { number: 1, origin: 10 },
        { number: 2, origin: 11 },
      ]);

      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ line: 1, origin: 10, value: "nop" });
      expect(tokens[1]).toMatchObject({ line: 2, origin: 11, value: "nop" });
    });

    test("records lexemes for tokens that consume input before pushing", () => {
      expect(lex("addi sp, sp, -4").map((t) => t.lexeme)).toEqual([
        "addi",
        "sp",
        "",
        "sp",
        "",
        "-4",
      ]);
      expect(lex("main:")[0].lexeme).toBe("main:");
      expect(lex('.string "hi"')[1].lexeme).toBe('"hi"');
    });
  });
});
