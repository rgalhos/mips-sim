import { describe, expect, test } from "vitest";
import { expandMacros } from "../../hardware/rv32/analyzer/rv32-pre.assembler";

describe("RV32 Assembler - pre-processor", () => {
  test("can expand macros correctly (1 arg)", () => {
    const source = `
.macro push reg
addi sp, sp, -4
sw \\reg, 0(sp)
.endmacro

.macro pop reg
lw \\reg , 0(sp)
addi sp, sp, 4
.endmacro

push ra
pop ra
`;

    const lines = expandMacros(source);
    console.log(lines);

    // it should also preserve line numbers
    // push ra
    expect(lines[11]).toMatchObject({ line: "addi sp, sp, -4", number: 12, origin: 12 });
    expect(lines[12]).toMatchObject({ line: "sw ra, 0(sp)", number: 13, origin: 12 });

    // pop ra
    expect(lines[13]).toMatchObject({ line: "lw ra , 0(sp)", number: 14, origin: 13 });
    expect(lines[14]).toMatchObject({ line: "addi sp, sp, 4", number: 15, origin: 13 });
  });

  test("can expand macros correctly (4 args)", () => {
    const source = `
.macro sum3 dest reg1 reg2 reg3
add \\dest, \\reg1, \\reg2
add \\dest, \\dest, \\reg3
.endmacro

sum3 t0, t1, t2, t3
`;

    const lines = expandMacros(source);

    expect(lines[6]).toMatchObject({ line: "add t0, t1, t2", number: 7, origin: 7 });
    expect(lines[7]).toMatchObject({ line: "add t0, t0, t3", number: 8, origin: 7 });
  });
});
