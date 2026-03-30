import { IUserManual } from '../common/manual';
import { ISimulator } from '../common/simulator';
import { rv_codec, rv_opcode, RV_OPCODE_DATA, rv_reg } from './riscv.const';
import { RVProcessor } from './riscv.processor';
import { IDecodedRVInstruction } from './riscv.types';

export class RVSimulator extends ISimulator<RVProcessor> {
  static name = 'RISC-V (RV32I)';

  public static readonly manual: IUserManual;

  public readonly instructionKeywords = Object.keys(rv_opcode)
    .filter((v) => Number.isNaN(+v))
    .slice(1) /* rv_opcode.illegal */;

  public readonly registerKeywords = Object.keys(rv_reg).filter((v) => Number.isNaN(+v));

  public readonly processor: RVProcessor = new RVProcessor();

  protected cpuWorkerLocation = new URL('./riscv.worker.ts', import.meta.url);

  public assembleLine(tokens: string[]): IDecodedRVInstruction {
    const tokOp = String(tokens[0]) as keyof typeof rv_opcode;
    const tok1 = tokens[1];
    const tok2 = tokens[2];
    const tok3 = tokens[3];

    console.log(tokens)

    const dec: IDecodedRVInstruction = {
      inst: 0n,
      codec: rv_codec.illegal,
      _op: rv_opcode.illegal,
      opcode: 0,
      imm: 0n,
      rd: rv_reg.zero,
      rs1: rv_reg.zero,
      rs2: rv_reg.zero,
      rs3: rv_reg.zero,
    };

    const data = RV_OPCODE_DATA[rv_opcode[tokOp]];
    if (!data || !data.opcode) return dec;

    dec._op = rv_opcode[tokOp];
    dec.opcode = data.opcode;
    dec.codec = data.codec;
    dec.rd = Number.isNaN(+tok1) ? (rv_reg[tok1 as keyof typeof rv_reg] ?? rv_reg.zero) : rv_reg.zero;
    dec.rs1 = Number.isNaN(+tok2) ? (rv_reg[tok2 as keyof typeof rv_reg] ?? rv_reg.zero) : rv_reg.zero;
    dec.rs2 = Number.isNaN(+tok3) ? (rv_reg[tok3 as keyof typeof rv_reg] ?? rv_reg.zero) : rv_reg.zero;
    
    if (dec.codec === rv_codec.i) {
      dec.imm = Number.isNaN(+tok3) ? 0n : BigInt(tok3);;
    } else if (dec.codec === rv_codec.u) {
      dec.imm = Number.isNaN(+tok2) ? 0n : BigInt(tok2);;
    }

    dec.inst = this.processor.assemble(dec);

    return dec;
  }

  public assembleCode(code: string) {
    //function assemble(code) {
    // Remove comments
    const labels: Record<string, bigint> = {};
    let localLabels: Record<string, bigint> = {};
    /** @type {IAss[]} */
    const lines = [];

    let currentAddress = 0x0n;

    // Remove comments
    code = code.replaceAll(/#.*$/gm, '');
    const codeSplit = code.split(/\n/g);

    for (const idx in codeSplit) {
      let line = codeSplit[idx]
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/([+-]?\d+)\((\$?[a-zA-Z0-9_]+)\)/g, '$2 $1')
        .trim();

      if (!line) {
        continue;
      }

      if (line.includes(':')) {
        let [_label, _ins] = line.split(':');
        _label = _label.trim();

        if (_label[0] === '.') {
          localLabels[_label] = currentAddress;
        } else {
          labels[_label] = currentAddress;
          localLabels = {};
        }

        line = _ins.trim();
        if (!line) continue;
      }

      if (line[0] === '.') {
        // handle directive
      } else {
        console.log(line);
        const ass = this.assembleLine(line.split(' '));
        console.log(ass, this.processor.stringifyInstruction(ass));
      }

      lines.push(line);

      currentAddress += 4n;
    }

    return lines;
  }
}

// @ts-expect-error nijiiinnininini
window.__RV = new RVSimulator();

const x = new RVSimulator();
void x;
