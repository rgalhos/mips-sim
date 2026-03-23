import { IUserManual } from '../common/manual';
import { ISimulator } from '../common/simulator';
import { rv_opcode, rv_reg } from './riscv.const';
import { RVProcessor } from './riscv.processor';

export class RVSimulator extends ISimulator<RVProcessor> {
  static name = 'RISC-V (RV32I)';

  public static readonly manual: IUserManual;

  public readonly instructionKeywords = Object.keys(rv_opcode)
    .filter((v) => Number.isNaN(+v))
    .slice(1) /* rv_opcode.illegal */;

  public readonly registerKeywords = Object.keys(rv_reg).filter((v) => Number.isNaN(+v));

  public readonly processor: RVProcessor = new RVProcessor();
}

const x = new RVSimulator();
void x;
