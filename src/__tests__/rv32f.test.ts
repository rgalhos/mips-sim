/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test } from "vitest";
import { rv_opcode, rv_reg, rv_reg_f } from "../hardware/rv32/rv32.const";
import { RVProcessor } from "../hardware/rv32/rv32.processor";
import { f_to_biguint, SP_CANONICAL_NAN, SP_NEG_INF, SP_POS_INF, u32 } from "../hardware/rv32/rv32.utils";

describe("RV32F", () => {
  test("flw fs10, 4(t1)", () => {
    const cpu = new RVProcessor();
    const value = 0xabcdef12n;

    cpu.cpu.register[rv_reg.t1] = 0x100n;
    cpu.memoryWrite(0x104n, value, 32);
    cpu.execute({
      _op: rv_opcode.flw,
      rd: rv_reg_f.fs10,
      rs1: rv_reg.t1,
      rs2: rv_reg.t2,
      imm: 4n,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fs10]).toBe(value);
  });

  test("fsw fs10, 4(t1)", () => {
    const cpu = new RVProcessor();
    const value = 0xabcdef12n;

    cpu.cpu.register[rv_reg.t1] = 0x100n;
    cpu.cpu.registerF[rv_reg_f.fs10] = value;
    cpu.execute({
      _op: rv_opcode.fsw,
      rd: rv_reg.t0,
      rs1: rv_reg.t1,
      rs2: rv_reg_f.fs10,
      imm: 4n,
    } as any);

    expect(u32(cpu.memoryRead(0x104n, 32))).toBe(value);
  });

  test("fmadd.s fa0, ft0, ft1, ft2", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(2);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(3);
    cpu.cpu.registerF[rv_reg_f.ft2] = f_to_biguint(1);

    cpu.execute({
      _op: rv_opcode["fmadd.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
      rs3: rv_reg_f.ft2,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(7));
  });

  describe("fmadd.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["NaN in fs1", 0x7f800001n, f_to_biguint(1), f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs2", f_to_biguint(1), 0x7fc00001n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs3", f_to_biguint(1), f_to_biguint(1), 0x7f800001n, SP_CANONICAL_NAN],
      ["+inf * +0", SP_POS_INF, 0n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["+0 * +inf", 0n, SP_POS_INF, f_to_biguint(1), SP_CANONICAL_NAN],
      ["-0 * +inf", 0x80000000n, SP_POS_INF, f_to_biguint(1), SP_CANONICAL_NAN],
      ["-inf * +0", SP_NEG_INF, 0n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["+inf * finite + +inf", SP_POS_INF, f_to_biguint(2), SP_POS_INF, SP_POS_INF],
      ["+inf * finite + -inf", SP_POS_INF, f_to_biguint(2), SP_NEG_INF, SP_CANONICAL_NAN],
      ["-inf * finite + -inf", SP_NEG_INF, f_to_biguint(2), SP_NEG_INF, SP_NEG_INF],
      ["-inf * finite + +inf", SP_NEG_INF, f_to_biguint(2), SP_POS_INF, SP_CANONICAL_NAN],
      ["finite * finite + +inf", f_to_biguint(2), f_to_biguint(3), SP_POS_INF, SP_POS_INF],
      ["finite * finite + -inf", f_to_biguint(2), f_to_biguint(3), SP_NEG_INF, SP_NEG_INF],
    ] as const)("%s", (_name, fs1, fs2, fs3, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;
      cpu.cpu.registerF[rv_reg_f.ft2] = fs3;

      cpu.execute({
        _op: rv_opcode["fmadd.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
        rs3: rv_reg_f.ft2,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fmsub.s fa0, ft0, ft1, ft2", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(2);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(3);
    cpu.cpu.registerF[rv_reg_f.ft2] = f_to_biguint(1);

    cpu.execute({
      _op: rv_opcode["fmsub.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
      rs3: rv_reg_f.ft2,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(5));
  });

  describe("fmsub.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["NaN in fs1", 0x7f800001n, f_to_biguint(1), f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs2", f_to_biguint(1), 0x7fc00001n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs3", f_to_biguint(1), f_to_biguint(1), 0x7f800001n, SP_CANONICAL_NAN],
      ["+inf * +0", SP_POS_INF, 0n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["+0 * +inf", 0n, SP_POS_INF, f_to_biguint(1), SP_CANONICAL_NAN],
      ["-0 * +inf", 0x80000000n, SP_POS_INF, f_to_biguint(1), SP_CANONICAL_NAN],
      ["-inf * +0", SP_NEG_INF, 0n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["+inf * finite - +inf", SP_POS_INF, f_to_biguint(2), SP_POS_INF, SP_CANONICAL_NAN],
      ["+inf * finite - -inf", SP_POS_INF, f_to_biguint(2), SP_NEG_INF, SP_POS_INF],
      ["-inf * finite - -inf", SP_NEG_INF, f_to_biguint(2), SP_NEG_INF, SP_CANONICAL_NAN],
      ["-inf * finite - +inf", SP_NEG_INF, f_to_biguint(2), SP_POS_INF, SP_NEG_INF],
      ["finite * finite - +inf", f_to_biguint(2), f_to_biguint(3), SP_POS_INF, SP_NEG_INF],
      ["finite * finite - -inf", f_to_biguint(2), f_to_biguint(3), SP_NEG_INF, SP_POS_INF],
    ] as const)("%s", (_name, fs1, fs2, fs3, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;
      cpu.cpu.registerF[rv_reg_f.ft2] = fs3;

      cpu.execute({
        _op: rv_opcode["fmsub.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
        rs3: rv_reg_f.ft2,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fnmsub.s fa0, ft0, ft1, ft2", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(2);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(3);
    cpu.cpu.registerF[rv_reg_f.ft2] = f_to_biguint(1);

    cpu.execute({
      _op: rv_opcode["fnmsub.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
      rs3: rv_reg_f.ft2,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(-5));
  });

  describe("fnmsub.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["NaN in fs1", 0x7f800001n, f_to_biguint(1), f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs2", f_to_biguint(1), 0x7fc00001n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs3", f_to_biguint(1), f_to_biguint(1), 0x7f800001n, SP_CANONICAL_NAN],
      ["+inf * +0", SP_POS_INF, 0n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["+0 * +inf", 0n, SP_POS_INF, f_to_biguint(1), SP_CANONICAL_NAN],
      ["-0 * +inf", 0x80000000n, SP_POS_INF, f_to_biguint(1), SP_CANONICAL_NAN],
      ["-inf * +0", SP_NEG_INF, 0n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["+inf * finite + +inf", SP_POS_INF, f_to_biguint(2), SP_POS_INF, SP_CANONICAL_NAN],
      ["+inf * finite + -inf", SP_POS_INF, f_to_biguint(2), SP_NEG_INF, SP_NEG_INF],
      ["-inf * finite + -inf", SP_NEG_INF, f_to_biguint(2), SP_NEG_INF, SP_CANONICAL_NAN],
      ["-inf * finite + +inf", SP_NEG_INF, f_to_biguint(2), SP_POS_INF, SP_POS_INF],
      ["finite * finite + +inf", f_to_biguint(2), f_to_biguint(3), SP_POS_INF, SP_POS_INF],
      ["finite * finite + -inf", f_to_biguint(2), f_to_biguint(3), SP_NEG_INF, SP_NEG_INF],
    ] as const)("%s", (_name, fs1, fs2, fs3, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;
      cpu.cpu.registerF[rv_reg_f.ft2] = fs3;

      cpu.execute({
        _op: rv_opcode["fnmsub.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
        rs3: rv_reg_f.ft2,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fnmadd.s fa0, ft0, ft1, ft2", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(2);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(3);
    cpu.cpu.registerF[rv_reg_f.ft2] = f_to_biguint(1);

    cpu.execute({
      _op: rv_opcode["fnmadd.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
      rs3: rv_reg_f.ft2,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(-7));
  });

  describe("fnmadd.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["NaN in fs1", 0x7f800001n, f_to_biguint(1), f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs2", f_to_biguint(1), 0x7fc00001n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs3", f_to_biguint(1), f_to_biguint(1), 0x7f800001n, SP_CANONICAL_NAN],
      ["+inf * +0", SP_POS_INF, 0n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["+0 * +inf", 0n, SP_POS_INF, f_to_biguint(1), SP_CANONICAL_NAN],
      ["-0 * +inf", 0x80000000n, SP_POS_INF, f_to_biguint(1), SP_CANONICAL_NAN],
      ["-inf * +0", SP_NEG_INF, 0n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["+inf * finite - +inf", SP_POS_INF, f_to_biguint(2), SP_POS_INF, SP_NEG_INF],
      ["+inf * finite - -inf", SP_POS_INF, f_to_biguint(2), SP_NEG_INF, SP_CANONICAL_NAN],
      ["-inf * finite - -inf", SP_NEG_INF, f_to_biguint(2), SP_NEG_INF, SP_POS_INF],
      ["-inf * finite - +inf", SP_NEG_INF, f_to_biguint(2), SP_POS_INF, SP_CANONICAL_NAN],
      ["finite * finite - +inf", f_to_biguint(2), f_to_biguint(3), SP_POS_INF, SP_NEG_INF],
      ["finite * finite - -inf", f_to_biguint(2), f_to_biguint(3), SP_NEG_INF, SP_POS_INF],
    ] as const)("%s", (_name, fs1, fs2, fs3, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;
      cpu.cpu.registerF[rv_reg_f.ft2] = fs3;

      cpu.execute({
        _op: rv_opcode["fnmadd.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
        rs3: rv_reg_f.ft2,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fadd.s fa0, ft0, ft1", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(2);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(3);
    cpu.execute({
      _op: rv_opcode["fadd.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(5));
  });

  describe("fadd.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["NaN in fs1", 0x7f800001n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs2", f_to_biguint(1), 0x7fc00001n, SP_CANONICAL_NAN],
      ["+inf + +inf", SP_POS_INF, SP_POS_INF, SP_POS_INF],
      ["+inf + -inf", SP_POS_INF, SP_NEG_INF, SP_CANONICAL_NAN],
      ["-inf + -inf", SP_NEG_INF, SP_NEG_INF, SP_NEG_INF],
      ["+inf + finite", SP_POS_INF, f_to_biguint(2), SP_POS_INF],
      ["finite + +inf", f_to_biguint(2), SP_POS_INF, SP_POS_INF],
      ["finite + -inf", f_to_biguint(2), SP_NEG_INF, SP_NEG_INF],
    ] as const)("%s", (_name, fs1, fs2, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;
      cpu.execute({
        _op: rv_opcode["fadd.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fsub.s fa0, ft0, ft1", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(5);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(2);
    cpu.execute({
      _op: rv_opcode["fsub.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(3));
  });

  describe("fsub.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["NaN in fs1", 0x7f800001n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs2", f_to_biguint(1), 0x7fc00001n, SP_CANONICAL_NAN],
      ["+inf - +inf", SP_POS_INF, SP_POS_INF, SP_CANONICAL_NAN],
      ["+inf - -inf", SP_POS_INF, SP_NEG_INF, SP_POS_INF],
      ["-inf - -inf", SP_NEG_INF, SP_NEG_INF, SP_CANONICAL_NAN],
      ["-inf - +inf", SP_NEG_INF, SP_POS_INF, SP_NEG_INF],
      ["+inf - finite", SP_POS_INF, f_to_biguint(2), SP_POS_INF],
      ["finite - +inf", f_to_biguint(2), SP_POS_INF, SP_NEG_INF],
      ["finite - -inf", f_to_biguint(2), SP_NEG_INF, SP_POS_INF],
    ] as const)("%s", (_name, fs1, fs2, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;

      cpu.execute({
        _op: rv_opcode["fsub.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fmul.s fa0, ft0, ft1", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(2);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(3);

    cpu.execute({
      _op: rv_opcode["fmul.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(6));
  });

  describe("fmul.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["NaN in fs1", 0x7f800001n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs2", f_to_biguint(1), 0x7fc00001n, SP_CANONICAL_NAN],
      ["+inf * +inf", SP_POS_INF, SP_POS_INF, SP_POS_INF],
      ["+inf * -inf", SP_POS_INF, SP_NEG_INF, SP_NEG_INF],
      ["-inf * -inf", SP_NEG_INF, SP_NEG_INF, SP_POS_INF],
      ["+inf * +0", SP_POS_INF, 0n, SP_CANONICAL_NAN],
      ["+0 * +inf", 0n, SP_POS_INF, SP_CANONICAL_NAN],
      ["-0 * +inf", 0x80000000n, SP_POS_INF, SP_CANONICAL_NAN],
      ["+inf * finite", SP_POS_INF, f_to_biguint(2), SP_POS_INF],
      ["-inf * finite", SP_NEG_INF, f_to_biguint(2), SP_NEG_INF],
      ["+inf * -finite", SP_POS_INF, f_to_biguint(-2), SP_NEG_INF],
    ] as const)("%s", (_name, fs1, fs2, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;

      cpu.execute({
        _op: rv_opcode["fmul.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fdiv.s fa0, ft0, ft1", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(6);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(2);
    cpu.execute({
      _op: rv_opcode["fdiv.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(3));
  });

  describe("fdiv.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["NaN in fs1", 0x7f800001n, f_to_biguint(1), SP_CANONICAL_NAN],
      ["NaN in fs2", f_to_biguint(1), 0x7fc00001n, SP_CANONICAL_NAN],
      ["+0 / +0", 0n, 0n, SP_CANONICAL_NAN],
      ["+inf / +inf", SP_POS_INF, SP_POS_INF, SP_CANONICAL_NAN],
      ["finite / +0", f_to_biguint(6), 0n, SP_POS_INF],
      ["finite / -0", f_to_biguint(6), 0x80000000n, SP_NEG_INF],
      ["-finite / +0", f_to_biguint(-6), 0n, SP_NEG_INF],
      ["-finite / -0", f_to_biguint(-6), 0x80000000n, SP_POS_INF],
      ["+inf / finite", SP_POS_INF, f_to_biguint(2), SP_POS_INF],
      ["+inf / -finite", SP_POS_INF, f_to_biguint(-2), SP_NEG_INF],
    ] as const)("%s", (_name, fs1, fs2, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;

      cpu.execute({
        _op: rv_opcode["fdiv.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fsqrt.s fa0, ft0", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(4);

    cpu.execute({
      _op: rv_opcode["fsqrt.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(2));
  });

  describe("fsqrt.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["NaN in fs1", 0x7f800001n, SP_CANONICAL_NAN],
      ["+inf", SP_POS_INF, SP_POS_INF],
      ["-inf", SP_NEG_INF, SP_CANONICAL_NAN],
      ["-finite", f_to_biguint(-4), SP_CANONICAL_NAN],
      ["+0", 0n, 0n],
      ["-0", 0x80000000n, 0x80000000n],
    ] as const)("%s", (_name, fs1, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;

      cpu.execute({
        _op: rv_opcode["fsqrt.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fsgnj.s fa0, ft0, ft1", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(2);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(-3);

    cpu.execute({
      _op: rv_opcode["fsgnj.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(-2));
  });

  describe("fsgnj.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["+0 with sign of -0", 0n, 0x80000000n, 0x80000000n],
      ["-0 with sign of +0", 0x80000000n, 0n, 0n],
      ["+inf with sign of -inf", SP_POS_INF, SP_NEG_INF, SP_NEG_INF],
      ["qNaN with sign of -finite", SP_CANONICAL_NAN, f_to_biguint(-1), 0xffc00000n],
    ] as const)("%s", (_name, fs1, fs2, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;

      cpu.execute({
        _op: rv_opcode["fsgnj.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fsgnjn.s fa0, ft0, ft1", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(2);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(-3);

    cpu.execute({
      _op: rv_opcode["fsgnjn.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(2));
  });

  describe("fsgnjn.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["+0 with negated sign of -0", 0n, 0x80000000n, 0n],
      ["-0 with negated sign of +0", 0x80000000n, 0n, 0x80000000n],
      ["+inf with negated sign of -inf", SP_POS_INF, SP_NEG_INF, SP_POS_INF],
      ["qNaN with negated sign of -finite", SP_CANONICAL_NAN, f_to_biguint(-1), SP_CANONICAL_NAN],
    ] as const)("%s", (_name, fs1, fs2, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;

      cpu.execute({
        _op: rv_opcode["fsgnjn.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fsgnjx.s fa0, ft0, ft1", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(2);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(-3);

    cpu.execute({
      _op: rv_opcode["fsgnjx.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(-2));
  });

  describe("fsgnjx.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["+0 xor sign of -0", 0n, 0x80000000n, 0x80000000n],
      ["-0 xor sign of +0", 0x80000000n, 0n, 0x80000000n],
      ["+inf xor sign of -inf", SP_POS_INF, SP_NEG_INF, SP_NEG_INF],
      ["abs via xor", f_to_biguint(-3), f_to_biguint(-3), f_to_biguint(3)],
    ] as const)("%s", (_name, fs1, fs2, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;

      cpu.execute({
        _op: rv_opcode["fsgnjx.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fmin.s fa0, ft0, ft1", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(2);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(3);

    cpu.execute({
      _op: rv_opcode["fmin.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(2));
  });

  describe("fmin.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["both NaN", SP_CANONICAL_NAN, 0x7fc00001n, SP_CANONICAL_NAN],
      ["NaN in fs1", 0x7f800001n, f_to_biguint(2), f_to_biguint(2)],
      ["NaN in fs2", f_to_biguint(2), 0x7fc00001n, f_to_biguint(2)],
      ["+0 and -0", 0n, 0x80000000n, 0x80000000n],
      ["-0 and +0", 0x80000000n, 0n, 0x80000000n],
      ["-inf and finite", SP_NEG_INF, f_to_biguint(2), SP_NEG_INF],
      ["+inf and finite", SP_POS_INF, f_to_biguint(2), f_to_biguint(2)],
      ["-inf and +inf", SP_NEG_INF, SP_POS_INF, SP_NEG_INF],
    ] as const)("%s", (_name, fs1, fs2, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;

      cpu.execute({
        _op: rv_opcode["fmin.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });

  test("fmax.s fa0, ft0, ft1", () => {
    const cpu = new RVProcessor();

    cpu.cpu.registerF[rv_reg_f.ft0] = f_to_biguint(2);
    cpu.cpu.registerF[rv_reg_f.ft1] = f_to_biguint(3);

    cpu.execute({
      _op: rv_opcode["fmax.s"],
      rd: rv_reg_f.fa0,
      rs1: rv_reg_f.ft0,
      rs2: rv_reg_f.ft1,
    } as any);

    expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(f_to_biguint(3));
  });

  describe("fmax.s special cases", () => {
    const cpu = new RVProcessor();

    test.each([
      ["both NaN", SP_CANONICAL_NAN, 0x7fc00001n, SP_CANONICAL_NAN],
      ["NaN in fs1", 0x7f800001n, f_to_biguint(2), f_to_biguint(2)],
      ["NaN in fs2", f_to_biguint(2), 0x7fc00001n, f_to_biguint(2)],
      ["+0 and -0", 0n, 0x80000000n, 0n],
      ["-0 and +0", 0x80000000n, 0n, 0n],
      ["-inf and finite", SP_NEG_INF, f_to_biguint(2), f_to_biguint(2)],
      ["+inf and finite", SP_POS_INF, f_to_biguint(2), SP_POS_INF],
      ["-inf and +inf", SP_NEG_INF, SP_POS_INF, SP_POS_INF],
    ] as const)("%s", (_name, fs1, fs2, expected) => {
      cpu.cpu.registerF[rv_reg_f.ft0] = fs1;
      cpu.cpu.registerF[rv_reg_f.ft1] = fs2;

      cpu.execute({
        _op: rv_opcode["fmax.s"],
        rd: rv_reg_f.fa0,
        rs1: rv_reg_f.ft0,
        rs2: rv_reg_f.ft1,
      } as any);

      expect(cpu.cpu.registerF[rv_reg_f.fa0]).toBe(expected);
    });
  });
});
