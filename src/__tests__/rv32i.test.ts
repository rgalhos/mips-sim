import { rv_opcode, rv_reg } from '../hardware/riscv/riscv.const';
import { RVProcessor } from '../hardware/riscv/riscv.processor';

describe('RV32I', () => {
  test('addi', () => {
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
});
