/* eslint-disable @typescript-eslint/no-explicit-any */
import { rv_opcode, rv_reg } from "../hardware/rv32/rv32.const";
import { RVProcessor } from "../hardware/rv32/rv32.processor";
import { u32 } from "../hardware/rv32/rv32.utils";
import { beforeEach, describe, expect, test } from "vitest";

const sext8 = (byte: bigint) => {
  const b = byte & 0xffn;
  return b & 0x80n ? u32(b | ~0xffn) : b;
};

const sext16 = (half: bigint) => {
  const h = half & 0xffffn;
  return h & 0x8000n ? u32(h | ~0xffffn) : h;
};

const zext8 = (byte: bigint) => byte & 0xffn;

const zext16 = (half: bigint) => half & 0xffffn;

describe("RV32I", () => {
  test("addi", () => {
    const cpu = new RVProcessor();

    cpu.cpu.register[rv_reg.t1] = 10n;

    cpu.execute({
      _op: rv_opcode.addi,
      rd: rv_reg.t0,
      rs1: rv_reg.t1,
      rs2: rv_reg.t2,
      imm: 5n,
    } as any);

    expect(cpu.cpu.register[rv_reg.t0]).toBe(15n);
  });

  test("lw t0, 4(t1)", () => {
    const cpu = new RVProcessor();
    const value = 0x89abcdefn;

    cpu.cpu.register[rv_reg.t1] = 0x100n;
    cpu.memoryWrite(0x104n, value, 32);

    cpu.execute({
      _op: rv_opcode.lw,
      rd: rv_reg.t0,
      rs1: rv_reg.t1,
      rs2: rv_reg.t2,
      imm: 4n,
    } as any);

    expect(cpu.cpu.register[rv_reg.t0]).toBe(u32(value));
  });

  test("lw t0, -4(t1)", () => {
    const cpu = new RVProcessor();
    const value = 0x01020304n;

    cpu.cpu.register[rv_reg.t1] = 0x108n;
    cpu.memoryWrite(0x104n, value, 32);

    cpu.execute({
      _op: rv_opcode.lw,
      rd: rv_reg.t0,
      rs1: rv_reg.t1,
      rs2: rv_reg.t2,
      imm: -4n,
    } as any);

    expect(cpu.cpu.register[rv_reg.t0]).toBe(u32(value));
  });

  test("sw t0, 4(t1)", () => {
    const cpu = new RVProcessor();
    const value = 0x89abcdefn;

    cpu.cpu.register[rv_reg.t1] = 0x100n;
    cpu.cpu.register[rv_reg.t0] = value;

    cpu.execute({
      _op: rv_opcode.sw,
      rd: rv_reg.t2,
      rs1: rv_reg.t1,
      rs2: rv_reg.t0,
      imm: 4n,
    } as any);

    expect(u32(cpu.memoryRead(0x104n, 32))).toBe(u32(value));
  });

  describe("lb sign-extension", () => {
    const cpu = new RVProcessor();

    beforeEach(() => {
      cpu.cpu.register[rv_reg.t1] = 0x200n;
    });

    test.each([
      ["0x00", 0x00n, sext8(0x00n)],
      ["0x7f", 0x7fn, sext8(0x7fn)],
      ["0x80", 0x80n, sext8(0x80n)],
      ["0xff", 0xffn, sext8(0xffn)],
    ] as const)("byte %s", (_name, memByte, expected) => {
      cpu.memoryWrite(0x200n, memByte, 8);
      cpu.execute({
        _op: rv_opcode.lb,
        rd: rv_reg.t0,
        rs1: rv_reg.t1,
        rs2: rv_reg.t2,
        imm: 0n,
      } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("lh sign-extension", () => {
    const cpu = new RVProcessor();

    beforeEach(() => {
      cpu.cpu.register[rv_reg.t1] = 0x200n;
    });

    test.each([
      ["0x0000", 0x0000n, sext16(0x0000n)],
      ["0x7fff", 0x7fffn, sext16(0x7fffn)],
      ["0x8000", 0x8000n, sext16(0x8000n)],
      ["0xffff", 0xffffn, sext16(0xffffn)],
    ] as const)("halfword %s", (_name, memHalf, expected) => {
      cpu.memoryWrite(0x200n, memHalf, 16);
      cpu.execute({
        _op: rv_opcode.lh,
        rd: rv_reg.t0,
        rs1: rv_reg.t1,
        rs2: rv_reg.t2,
        imm: 0n,
      } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("lbu zero-extension", () => {
    const cpu = new RVProcessor();

    beforeEach(() => {
      cpu.cpu.register[rv_reg.t1] = 0x200n;
    });

    test.each([
      ["0x00", 0x00n, zext8(0x00n)],
      ["0x7f", 0x7fn, zext8(0x7fn)],
      ["0x80", 0x80n, zext8(0x80n)],
      ["0xff", 0xffn, zext8(0xffn)],
    ] as const)("byte %s", (_name, memByte, expected) => {
      cpu.memoryWrite(0x200n, memByte, 8);
      cpu.execute({
        _op: rv_opcode.lbu,
        rd: rv_reg.t0,
        rs1: rv_reg.t1,
        rs2: rv_reg.t2,
        imm: 0n,
      } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("lhu zero-extension", () => {
    const cpu = new RVProcessor();

    beforeEach(() => {
      cpu.cpu.register[rv_reg.t1] = 0x200n;
    });

    test.each([
      ["0x0000", 0x0000n, zext16(0x0000n)],
      ["0x7fff", 0x7fffn, zext16(0x7fffn)],
      ["0x8000", 0x8000n, zext16(0x8000n)],
      ["0xffff", 0xffffn, zext16(0xffffn)],
    ] as const)("halfword %s", (_name, memHalf, expected) => {
      cpu.memoryWrite(0x200n, memHalf, 16);
      cpu.execute({
        _op: rv_opcode.lhu,
        rd: rv_reg.t0,
        rs1: rv_reg.t1,
        rs2: rv_reg.t2,
        imm: 0n,
      } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  test("sb t0, 1(t1) stores rs2[7:0] only", () => {
    const cpu = new RVProcessor();

    cpu.cpu.register[rv_reg.t1] = 0x100n;
    cpu.memoryWrite(0x100n, 0xddn, 8);
    cpu.memoryWrite(0x101n, 0xccn, 8);
    cpu.memoryWrite(0x102n, 0xbbn, 8);
    cpu.memoryWrite(0x103n, 0xaan, 8);
    cpu.cpu.register[rv_reg.t0] = 0x12345678n;

    cpu.execute({
      _op: rv_opcode.sb,
      rd: rv_reg.t2,
      rs1: rv_reg.t1,
      rs2: rv_reg.t0,
      imm: 1n,
    } as any);

    expect(cpu.memoryRead(0x100n, 8)).toBe(0xddn);
    expect(cpu.memoryRead(0x101n, 8)).toBe(0x78n);
    expect(cpu.memoryRead(0x102n, 8)).toBe(0xbbn);
    expect(cpu.memoryRead(0x103n, 8)).toBe(0xaan);
  });

  test("sh t0, 2(t1) stores rs2[15:0] only", () => {
    const cpu = new RVProcessor();

    cpu.cpu.register[rv_reg.t1] = 0x100n;
    cpu.memoryWrite(0x100n, 0xddn, 8);
    cpu.memoryWrite(0x101n, 0xccn, 8);
    cpu.memoryWrite(0x102n, 0xbbn, 8);
    cpu.memoryWrite(0x103n, 0xaan, 8);
    cpu.cpu.register[rv_reg.t0] = 0x12345678n;

    cpu.execute({
      _op: rv_opcode.sh,
      rd: rv_reg.t2,
      rs1: rv_reg.t1,
      rs2: rv_reg.t0,
      imm: 2n,
    } as any);

    expect(cpu.memoryRead(0x100n, 8)).toBe(0xddn);
    expect(cpu.memoryRead(0x101n, 8)).toBe(0xccn);
    expect(cpu.memoryRead(0x102n, 8)).toBe(0x78n);
    expect(cpu.memoryRead(0x103n, 8)).toBe(0x56n);
  });

  test("sw t0, 0(t1) stores rs2[31:0]", () => {
    const cpu = new RVProcessor();

    cpu.cpu.register[rv_reg.t1] = 0x100n;
    cpu.memoryWrite(0x100n, 0n, 32);
    cpu.cpu.register[rv_reg.t0] = 0xdeadbeefn;

    cpu.execute({
      _op: rv_opcode.sw,
      rd: rv_reg.t2,
      rs1: rv_reg.t1,
      rs2: rv_reg.t0,
      imm: 0n,
    } as any);

    expect(u32(cpu.memoryRead(0x100n, 32))).toBe(0xdeadbeefn);
  });

  describe("lui", () => {
    test.each([
      ["imm = 0 -> 0", 0n, 0n],
      ["imm = 1 -> 0x1000", 1n, 0x1000n],
      ["imm = 0xfffff (max 20-bit) -> 0xfffff000", 0xfffffn, 0xfffff000n],
    ] as const)("%s", (_name, imm, expected) => {
      const cpu = new RVProcessor();

      cpu.execute({ _op: rv_opcode.lui, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("auipc", () => {
    test.each([
      ["pc=0x1000, imm=1 -> 0x2000", 0x1000n, 1n, 0x2000n],
      ["pc + shifted imm overflows 32 bits and wraps", 0xfffff000n, 0xfffffn, 0xffffe000n],
    ] as const)("%s", (_name, pc, imm, expected) => {
      const cpu = new RVProcessor();

      cpu.cpu.pc = pc;
      cpu.execute({ _op: rv_opcode.auipc, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("jal", () => {
    test("forward jump", () => {
      const cpu = new RVProcessor();

      cpu.cpu.pc = 0x100n;
      cpu.execute({ _op: rv_opcode.jal, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm: 0x10n } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(0x104n);
      expect(cpu.cpu.pc).toBe(0x110n);
    });

    test("backward jump (negative offset)", () => {
      const cpu = new RVProcessor();

      cpu.cpu.pc = 0x100n;
      cpu.execute({ _op: rv_opcode.jal, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm: -0x10n } as any);

      expect(cpu.cpu.pc).toBe(0xf0n);
    });

    test("rd = x0 discards the return address", () => {
      const cpu = new RVProcessor();

      cpu.cpu.pc = 0x100n;
      cpu.execute({ _op: rv_opcode.jal, rd: rv_reg.zero, rs1: rv_reg.t1, rs2: rv_reg.t2, imm: 0x10n } as any);

      expect(cpu.cpu.register[rv_reg.zero]).toBe(0n);
    });
  });

  describe("jalr", () => {
    test("target address has its LSB cleared even though rs1+imm is odd", () => {
      const cpu = new RVProcessor();

      cpu.cpu.pc = 0x50n;
      cpu.cpu.register[rv_reg.t1] = 0x101n;
      cpu.execute({ _op: rv_opcode.jalr, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm: 0n } as any);

      expect(cpu.cpu.pc).toBe(0x100n);
      expect(cpu.cpu.register[rv_reg.t0]).toBe(0x54n);
    });

    test("negative immediate offset", () => {
      const cpu = new RVProcessor();

      cpu.cpu.pc = 0x50n;
      cpu.cpu.register[rv_reg.t1] = 0x100n;
      cpu.execute({ _op: rv_opcode.jalr, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm: -4n } as any);

      expect(cpu.cpu.pc).toBe(0xfcn);
    });
  });

  describe("beq/bne/blt/bge/bltu/bgeu", () => {
    function branch(op: rv_opcode, a: bigint, b: bigint) {
      const cpu = new RVProcessor();

      cpu.cpu.pc = 0x100n;
      cpu.cpu.register[rv_reg.t1] = a;
      cpu.cpu.register[rv_reg.t2] = b;
      cpu.execute({ _op: op, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm: 0x20n } as any);

      return cpu.cpu.pc;
    }

    test.each([
      ["beq: equal registers branch", rv_opcode.beq, 5n, 5n, 0x120n],
      ["beq: different registers do not branch", rv_opcode.beq, 5n, 6n, 0x100n],
      ["bne: different registers branch", rv_opcode.bne, 5n, 6n, 0x120n],
      ["bne: equal registers do not branch", rv_opcode.bne, 5n, 5n, 0x100n],
      ["blt: -1 < 1 (signed) branches", rv_opcode.blt, 0xffffffffn, 1n, 0x120n],
      ["blt: 1 < -1 (signed) does not branch", rv_opcode.blt, 1n, 0xffffffffn, 0x100n],
      ["bge: -1 >= -2 (signed) branches", rv_opcode.bge, 0xffffffffn, 0xfffffffen, 0x120n],
      ["bge: equal registers branch (>=)", rv_opcode.bge, 5n, 5n, 0x120n],
      ["bltu: 0xffffffff is a huge unsigned value, NOT less than 1", rv_opcode.bltu, 0xffffffffn, 1n, 0x100n],
      ["bltu: 1 < 2 (unsigned) branches", rv_opcode.bltu, 1n, 2n, 0x120n],
      ["bgeu: 0xffffffff (huge unsigned) >= 1 branches", rv_opcode.bgeu, 0xffffffffn, 1n, 0x120n],
      ["bgeu: 0 >= 1 (unsigned) does not branch", rv_opcode.bgeu, 0n, 1n, 0x100n],
    ] as const)("%s", (_name, op, a, b, expectedPc) => {
      expect(branch(op, a, b)).toBe(expectedPc);
    });
  });

  describe("slti / sltiu", () => {
    test.each([
      ["slti: -1 < 1 (signed) -> 1", rv_opcode.slti, 0xffffffffn, 1n, 1n],
      ["slti: 1 < -1 (signed) -> 0", rv_opcode.slti, 1n, -1n, 0n],
      ["sltiu: 0xffffffff (huge unsigned) < 1 -> 0", rv_opcode.sltiu, 0xffffffffn, 1n, 0n],
      ["sltiu: 0 < 1 -> 1 (classic 'is rs1 zero' idiom)", rv_opcode.sltiu, 0n, 1n, 1n],
    ] as const)("%s", (_name, op, rs1val, imm, expected) => {
      const cpu = new RVProcessor();

      cpu.cpu.register[rv_reg.t1] = rs1val;
      cpu.execute({ _op: op, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("xori / ori / andi", () => {
    test.each([
      ["xori with imm=-1 flips every bit (bitwise NOT)", rv_opcode.xori, 0xf0f0f0f0n, -1n, 0x0f0f0f0fn],
      ["ori with imm=-1 sets every bit", rv_opcode.ori, 0n, -1n, 0xffffffffn],
      ["andi masks to the low nibble", rv_opcode.andi, 0xffffffffn, 0x0fn, 0x0fn],
      ["andi with imm=-1 is the identity", rv_opcode.andi, 0xffffffffn, -1n, 0xffffffffn],
    ] as const)("%s", (_name, op, rs1val, imm, expected) => {
      const cpu = new RVProcessor();

      cpu.cpu.register[rv_reg.t1] = rs1val;
      cpu.execute({ _op: op, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("slli / srli / srai", () => {
    test.each([
      ["slli: 1 << 31 sets the sign bit", rv_opcode.slli, 1n, 31n, 0x80000000n],
      ["slli: the bit shifted out past bit 31 is simply lost, no overflow trap", rv_opcode.slli, 0xffffffffn, 1n, 0xfffffffen],
      ["slli: shift amount 32 uses only bits [4:0] -> shamt 0, no-op", rv_opcode.slli, 1n, 32n, 1n],
      ["srli: zero-fills regardless of the sign bit (logical shift)", rv_opcode.srli, 0x80000000n, 1n, 0x40000000n],
      ["srli: 0xffffffff >> 31 = 1", rv_opcode.srli, 0xffffffffn, 31n, 1n],
      ["srai: sign-fills a negative operand (arithmetic shift)", rv_opcode.srai, 0x80000000n, 1n, 0xc0000000n],
      ["srai: -1 >> anything is still -1", rv_opcode.srai, 0xffffffffn, 31n, 0xffffffffn],
    ] as const)("%s", (_name, op, rs1val, imm, expected) => {
      const cpu = new RVProcessor();

      cpu.cpu.register[rv_reg.t1] = rs1val;
      cpu.execute({ _op: op, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("add / sub", () => {
    test.each([
      ["add: 6 + 7 = 13", rv_opcode.add, 6n, 7n, 13n],
      ["add: INT32_MAX + 1 wraps to INT32_MIN", rv_opcode.add, 0x7fffffffn, 1n, 0x80000000n],
      ["add: -1 + 1 wraps to 0", rv_opcode.add, 0xffffffffn, 1n, 0n],
      ["sub: 10 - 3 = 7", rv_opcode.sub, 10n, 3n, 7n],
      ["sub: 0 - 1 wraps to -1 (0xffffffff)", rv_opcode.sub, 0n, 1n, 0xffffffffn],
      ["sub: INT32_MIN - 1 wraps to INT32_MAX", rv_opcode.sub, 0x80000000n, 1n, 0x7fffffffn],
    ] as const)("%s", (_name, op, a, b, expected) => {
      const cpu = new RVProcessor();

      cpu.cpu.register[rv_reg.t1] = a;
      cpu.cpu.register[rv_reg.t2] = b;
      cpu.execute({ _op: op, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm: 0n } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("sll / srl / sra", () => {
    test.each([
      ["sll: 1 << 31 sets the sign bit", rv_opcode.sll, 1n, 31n, 0x80000000n],
      ["sll: shift amount 32 uses only bits [4:0] -> shamt 0, no-op", rv_opcode.sll, 1n, 32n, 1n],
      ["srl: zero-fills regardless of the sign bit (logical shift)", rv_opcode.srl, 0x80000000n, 1n, 0x40000000n],
      ["sra: sign-fills a negative operand (arithmetic shift)", rv_opcode.sra, 0x80000000n, 1n, 0xc0000000n],
      ["sra: -1 >> anything is still -1", rv_opcode.sra, 0xffffffffn, 31n, 0xffffffffn],
    ] as const)("%s", (_name, op, a, b, expected) => {
      const cpu = new RVProcessor();

      cpu.cpu.register[rv_reg.t1] = a;
      cpu.cpu.register[rv_reg.t2] = b;
      cpu.execute({ _op: op, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm: 0n } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("slt / sltu", () => {
    test.each([
      ["slt: -1 < 1 (signed) -> 1", rv_opcode.slt, 0xffffffffn, 1n, 1n],
      ["slt: 1 < -1 (signed) -> 0", rv_opcode.slt, 1n, 0xffffffffn, 0n],
      ["sltu: 0xffffffff (huge unsigned) < 1 -> 0", rv_opcode.sltu, 0xffffffffn, 1n, 0n],
      ["sltu: 1 < 2 (unsigned) -> 1", rv_opcode.sltu, 1n, 2n, 1n],
    ] as const)("%s", (_name, op, a, b, expected) => {
      const cpu = new RVProcessor();

      cpu.cpu.register[rv_reg.t1] = a;
      cpu.cpu.register[rv_reg.t2] = b;
      cpu.execute({ _op: op, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm: 0n } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("xor / or / and", () => {
    test.each([
      ["xor: 0xf0f0f0f0 ^ 0xffffffff = 0x0f0f0f0f", rv_opcode.xor, 0xf0f0f0f0n, 0xffffffffn, 0x0f0f0f0fn],
      ["or: 0 | 0xdeadbeef = 0xdeadbeef", rv_opcode.or, 0n, 0xdeadbeefn, 0xdeadbeefn],
      ["and: 0xffffffff & 0x0000ffff = 0x0000ffff", rv_opcode.and, 0xffffffffn, 0x0000ffffn, 0x0000ffffn],
    ] as const)("%s", (_name, op, a, b, expected) => {
      const cpu = new RVProcessor();

      cpu.cpu.register[rv_reg.t1] = a;
      cpu.cpu.register[rv_reg.t2] = b;
      cpu.execute({ _op: op, rd: rv_reg.t0, rs1: rv_reg.t1, rs2: rv_reg.t2, imm: 0n } as any);

      expect(cpu.cpu.register[rv_reg.t0]).toBe(expected);
    });
  });

  describe("ebreak", () => {
    test("halts the CPU", () => {
      const cpu = new RVProcessor();

      cpu.setHalted(false);
      cpu.execute({ _op: rv_opcode.ebreak, rd: rv_reg.zero, rs1: rv_reg.zero, rs2: rv_reg.zero, imm: 0n } as any);

      expect(cpu.halted).toBe(true);
    });
  });
});
