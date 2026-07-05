import { describe, expect, test } from "vitest";
import { RVSimulator } from "../../hardware/rv32/rv32.simulator";

describe("RV32 assembler - load/store", () => {
  const sim = new RVSimulator();

  test("lb, lbu and sb", () => {
    const { instructions } = sim.assembleCode(`
.text
lb t0, 4(t1)
sb t0, 4(t1)

lb t4, -12(t3)
sb t4, -12(t3)

lbu t5, 4(t1)
lbu t5, -12(t3)
        `);

    expect(instructions[0].decoded.bytecode).toBe(0x00430283n);

    expect(instructions[1].decoded.bytecode).toBe(0x00530223n);

    expect(instructions[2].decoded.bytecode).toBe(0xff4e0e83n);

    expect(instructions[3].decoded.bytecode).toBe(0xffde0a23n);

    expect(instructions[4].decoded.bytecode).toBe(0x00434f03n);

    expect(instructions[5].decoded.bytecode).toBe(0xff4e4f03n);
  });

  test("lh, lhu and sh", () => {
    const { instructions } = sim.assembleCode(`
.text
lh t0, 4(t1)
sh t0, 4(t1)

lh t4, -12(t3)
sh t4, -12(t3)

lhu t5, 4(t1)
lhu t5, -12(t3)
        `);

    expect(instructions[0].decoded.bytecode).toBe(0x00431283n);

    expect(instructions[1].decoded.bytecode).toBe(0x00531223n);

    expect(instructions[2].decoded.bytecode).toBe(0xff4e1e83n);

    expect(instructions[3].decoded.bytecode).toBe(0xffde1a23n);

    expect(instructions[4].decoded.bytecode).toBe(0x00435f03n);

    expect(instructions[5].decoded.bytecode).toBe(0xff4e5f03n);
  });

  test("lw and sw", () => {
    const { instructions } = sim.assembleCode(`
.text
lw t0, 4(t1)
sw t0, 4(t1)

lw t4, -12(t3)
sw t4, -12(t3)
        `);

    expect(instructions[0].decoded.bytecode).toBe(0x00432283n);

    expect(instructions[1].decoded.bytecode).toBe(0x00532223n);

    expect(instructions[2].decoded.bytecode).toBe(0xff4e2e83n);

    expect(instructions[3].decoded.bytecode).toBe(0xffde2a23n);
  });
});
