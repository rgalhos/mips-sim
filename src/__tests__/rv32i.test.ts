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

  describe("lb sign-extension (spec: x[rd] = sext(M[x[rs1]+offset][7:0]))", () => {
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

  describe("lh sign-extension (spec: x[rd] = sext(M[x[rs1]+offset][15:0]))", () => {
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

  describe("lbu zero-extension (spec: x[rd] = zext(M[x[rs1]+offset][7:0]))", () => {
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

  describe("lhu zero-extension (spec: x[rd] = zext(M[x[rs1]+offset][15:0]))", () => {
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
});
