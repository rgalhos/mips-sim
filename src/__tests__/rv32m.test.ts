/* eslint-disable @typescript-eslint/no-explicit-any */
import { rv_opcode, rv_reg } from "../hardware/rv32/rv32.const";
import { RVProcessor } from "../hardware/rv32/rv32.processor";
import { describe, expect, test } from "vitest";

function run(op: rv_opcode, a: bigint, b: bigint) {
  const cpu = new RVProcessor();

  cpu.cpu.register[rv_reg.t1] = a;
  cpu.cpu.register[rv_reg.t2] = b;

  cpu.execute({
    _op: op,
    rd: rv_reg.t0,
    rs1: rv_reg.t1,
    rs2: rv_reg.t2,
  } as any);

  return cpu.cpu.register[rv_reg.t0];
}

describe("RV32M", () => {
  describe("mul", () => {
    test.each([
      ["positive * positive: 6 * 7 = 42", 6n, 7n, 42n],
      ["positive * negative: 6 * -7 = -42, stored as 0xffffffd6", 6n, 0xfffffff9n, 0xffffffd6n],
      ["negative * negative: -6 * -7 = 42", 0xfffffffan, 0xfffffff9n, 42n],
      ["multiply by zero is zero", 0n, 123456n, 0n],
      ["multiply by one is identity", 424242n, 1n, 424242n],
      ["-1 * -1 = 1", 0xffffffffn, 0xffffffffn, 1n],
      ["0x12345678 * 0x9abcdef0 overflows 32 bits and wraps to 0x242d2080", 0x12345678n, 0x9abcdef0n, 0x242d2080n],
      ["INT32_MIN * -1 overflows and wraps back to INT32_MIN (0x80000000)", 0x80000000n, 0xffffffffn, 0x80000000n],
    ] as const)("%s", (_name, a, b, expected) => {
      expect(run(rv_opcode.mul, a, b)).toBe(expected);
    });
  });

  describe("mulh", () => {
    test.each([
      ["2 * 3 = 6 fits in the lower half, upper half is 0", 2n, 3n, 0n],
      ["INT32_MAX * INT32_MAX = 0x3fffffff_00000001, upper half 0x3fffffff", 0x7fffffffn, 0x7fffffffn, 0x3fffffffn],
      ["INT32_MIN * INT32_MIN = 0x40000000_00000000, upper half 0x40000000", 0x80000000n, 0x80000000n, 0x40000000n],
      ["INT32_MIN * -1 = 0x00000000_80000000, upper half 0", 0x80000000n, 0xffffffffn, 0n],
      ["-1000000 * 1000000 = -1e12 = 0xffffff17_2b5af000, upper half 0xffffff17", 0xfff0bdc0n, 1000000n, 0xffffff17n],
      ["-1 * -1 = 1, upper half 0", 0xffffffffn, 0xffffffffn, 0n],
    ] as const)("%s", (_name, a, b, expected) => {
      expect(run(rv_opcode.mulh, a, b)).toBe(expected);
    });
  });

  describe("mulhu", () => {
    test.each([
      ["2 * 3 = 6 fits in the lower half, upper half is 0", 2n, 3n, 0n],
      ["UINT32_MAX * UINT32_MAX = 0xfffffffe_00000001, upper half 0xfffffffe", 0xffffffffn, 0xffffffffn, 0xfffffffen],
      ["UINT32_MAX * 2 = 0x1_fffffffe, upper half 1", 0xffffffffn, 2n, 1n],
      [
        "0x80000000 is read as a large unsigned value, not negative: 0x80000000 * 0x80000000 = 0x40000000_00000000",
        0x80000000n,
        0x80000000n,
        0x40000000n,
      ],
    ] as const)("%s", (_name, a, b, expected) => {
      expect(run(rv_opcode.mulhu, a, b)).toBe(expected);
    });
  });

  describe("mulhsu", () => {
    test.each([
      ["5 * UINT32_MAX (0xffffffff, unsigned) = 0x4_fffffffb, upper half 4", 5n, 0xffffffffn, 4n],
      [
        "-1 (rs1, signed) * UINT32_MAX (rs2, unsigned) = -0xffffffff, upper half 0xffffffff",
        0xffffffffn,
        0xffffffffn,
        0xffffffffn,
      ],
      [
        "INT32_MIN (rs1, signed) * UINT32_MAX (rs2, unsigned) upper half 0x80000000",
        0x80000000n,
        0xffffffffn,
        0x80000000n,
      ],
      [
        "INT32_MIN (rs1, signed) * 1 (rs2, unsigned) = -0x80000000, upper half 0xffffffff",
        0x80000000n,
        1n,
        0xffffffffn,
      ],
    ] as const)("%s", (_name, a, b, expected) => {
      expect(run(rv_opcode.mulhsu, a, b)).toBe(expected);
    });
  });

  describe("div", () => {
    test.each([
      ["10 / 2 = 5", 10n, 2n, 5n],
      ["-10 / 3 truncates towards zero to -3, not floors to -4", 0xfffffff6n, 3n, 0xfffffffdn],
      ["10 / -3 truncates towards zero to -3, not floors to -4", 10n, 0xfffffffdn, 0xfffffffdn],
      ["-10 / -3 truncates towards zero to 3, not floors to 4", 0xfffffff6n, 0xfffffffdn, 3n],
      ["-12 / 4 = -3 exactly", 0xfffffff4n, 4n, 0xfffffffdn],
    ] as const)("%s", (_name, a, b, expected) => {
      expect(run(rv_opcode.div, a, b)).toBe(expected);
    });

    test("division by zero: rd = -1 (0xffffffff), regardless of dividend sign", () => {
      expect(run(rv_opcode.div, 5n, 0n)).toBe(0xffffffffn);
      expect(run(rv_opcode.div, 0xfffffffbn /* -5 */, 0n)).toBe(0xffffffffn);
    });

    test("signed overflow: INT32_MIN / -1 = INT32_MIN (0x80000000), no trap", () => {
      expect(run(rv_opcode.div, 0x80000000n, 0xffffffffn)).toBe(0x80000000n);
    });
  });

  describe("divu", () => {
    test.each([
      ["10 / 2 = 5", 10n, 2n, 5n],
      ["0x80000000 read as a large unsigned value: 0x80000000 / 2 = 0x40000000", 0x80000000n, 2n, 0x40000000n],
      ["UINT32_MAX / 1 = UINT32_MAX", 0xffffffffn, 1n, 0xffffffffn],
    ] as const)("%s", (_name, a, b, expected) => {
      expect(run(rv_opcode.divu, a, b)).toBe(expected);
    });

    test("division by zero: rd = 2^32 - 1 (0xffffffff)", () => {
      expect(run(rv_opcode.divu, 123n, 0n)).toBe(0xffffffffn);
    });
  });

  describe("rem", () => {
    test.each([
      ["10 % 3 = 1", 10n, 3n, 1n],
      ["-10 % 3 = -1, keeps the dividend's sign", 0xfffffff6n, 3n, 0xffffffffn],
      ["10 % -3 = 1, keeps the dividend's sign", 10n, 0xfffffffdn, 1n],
      ["-10 % -3 = -1, keeps the dividend's sign", 0xfffffff6n, 0xfffffffdn, 0xffffffffn],
      ["12 % 4 = 0, exact division", 12n, 4n, 0n],
    ] as const)("%s", (_name, a, b, expected) => {
      expect(run(rv_opcode.rem, a, b)).toBe(expected);
    });

    test("division by zero: rd = dividend, unchanged", () => {
      expect(run(rv_opcode.rem, 42n, 0n)).toBe(42n);
      expect(run(rv_opcode.rem, 0xffffffd6n /* -42 */, 0n)).toBe(0xffffffd6n);
    });

    test("signed overflow: INT32_MIN % -1 = 0", () => {
      expect(run(rv_opcode.rem, 0x80000000n, 0xffffffffn)).toBe(0n);
    });
  });

  describe("remu", () => {
    test.each([
      ["10 % 3 = 1", 10n, 3n, 1n],
      ["0x80000001 read as a large unsigned value: 0x80000001 % 2 = 1", 0x80000001n, 2n, 1n],
    ] as const)("%s", (_name, a, b, expected) => {
      expect(run(rv_opcode.remu, a, b)).toBe(expected);
    });

    test("division by zero: rd = dividend, unchanged", () => {
      expect(run(rv_opcode.remu, 42n, 0n)).toBe(42n);
    });
  });
});
