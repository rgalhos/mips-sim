import { IUserManual } from '../common/manual';
import { IAssembledInstruction, ISimulator } from '../common/simulator';
import { rv_codec, rv_opcode, RV_OPCODE_DATA, rv_opcode_pseudo, rv_reg } from './riscv.const';
import { RVProcessor } from './riscv.processor';
import { IDecodedRVInstruction } from './riscv.types';

export class RVSimulator extends ISimulator<RVProcessor> {
  static name = 'RISC-V (RV32I)';

  public static readonly manual: IUserManual;

  public readonly instructionKeywords = Object.keys({ ...rv_opcode, ...rv_opcode_pseudo })
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

    const dec: IDecodedRVInstruction = {
      bytecode: 0n,
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
    // @todo detect invalid revisters
    dec.rd = Number.isNaN(+tok1) ? (rv_reg[tok1 as keyof typeof rv_reg] ?? rv_reg.zero) : rv_reg.zero;
    dec.rs1 = Number.isNaN(+tok2) ? (rv_reg[tok2 as keyof typeof rv_reg] ?? rv_reg.zero) : rv_reg.zero;
    dec.rs2 = Number.isNaN(+tok3) ? (rv_reg[tok3 as keyof typeof rv_reg] ?? rv_reg.zero) : rv_reg.zero;

    if (dec.codec === rv_codec.i) {
      dec.imm = Number.isNaN(+tok3) ? 0n : BigInt(tok3);
    } else if (dec.codec === rv_codec.u) {
      dec.imm = Number.isNaN(+tok2) ? 0n : BigInt(tok2);
    }

    dec.bytecode = this.processor.toBytecode(dec);

    return dec;
  }

  public assembleCode(code: string): Array<IAssembledInstruction<IDecodedRVInstruction>> {
    //function assemble(code) {
    // Remove comments
    const labels: Record<string, bigint> = {};
    const assembledInstructions: Array<IAssembledInstruction<IDecodedRVInstruction>> = [];
    const errors = [];

    let currentLabel = '';
    let currentAddress = 0x0n;

    // Remove comments
    code = code.replaceAll(/#.*$/gm, '');
    const codeSplit = code.split(/\n/g);

    for (const idx in codeSplit) {
      let line = codeSplit[idx].replace(/([+-]?\d+)\((\$?[a-zA-Z0-9_]+)\)/g, '$2 $1').trim();

      if (!line) {
        continue;
      }

      if (line.includes(':')) {
        let [_label, _ins] = line.split(':');
        _label = _label.trim();

        if (_label[0] === '.') {
          _label = currentLabel + _label;
        } else {
          currentLabel = _label;
        }

        if (labels[_label]) {
          errors.push({ lineNumber: idx, line: codeSplit[idx], message: 'Label já declarada' });
          console.warn('Label já declarada');
          continue;
        }

        labels[_label] = currentAddress;

        line = _ins.trim();
        if (!line) continue;
      }

      if (line[0] === '.') {
        if (line.toLowerCase().startsWith('.org')) {
          const addr = line.split(/ +/)[1];
          if (Number.isNaN(addr)) {
            errors.push({ lineNumber: idx, line: codeSplit[idx], message: 'Endereço de memória inválido' });
            console.error('Invalid address');
            continue;
          }

          currentAddress = BigInt(addr);
        }
      } else {
        line = line.replace(/,/g, ' ').replace(/\s+/g, ' ').toLowerCase();

        //console.log(line);
        const tokens = line.split(' ');
        console.log(tokens);
        const decoded = this.assembleLine(tokens);
        //console.log(ass, this.processor.stringifyInstruction(ass));

        assembledInstructions.push({
          code: line,
          lineNumber: idx,
          decoded,
          address: currentAddress,
          scope: currentLabel,
        });

        currentAddress += 4n;
      }
    }

    for (const inst of assembledInstructions) {
      let offset = '';
      if (inst.decoded.codec === rv_codec.b) {
        offset = inst.code.split(' ')?.[3];
      } else if ([rv_opcode.jal].includes(inst.decoded._op)) {
        // instruções do tipo: jal x0, OFFSET (token[2])
        offset = inst.code.split(' ')?.[2];
      } else {
        continue;
      }
      console.log(inst, offset, '0x' + inst.decoded.bytecode.toString(16));

      if (!offset || !Number.isNaN(+offset)) {
        continue;
      } else if (offset[0] === '.') {
        offset = inst.scope + offset;
      }

      const offsetAddr = labels[offset];
      if (!offsetAddr) {
        errors.push({
          lineNumber: inst.lineNumber,
          line: codeSplit[Number(inst.lineNumber)],
          message: 'Referência a uma label inexistente',
        });

        console.error('Inexistent label', offsetAddr);
      }

      inst.decoded.imm = offsetAddr;
      inst.decoded.bytecode = this.processor.toBytecode(inst.decoded);
    }

    console.log(labels, errors);

    return assembledInstructions;
  }
}

// @ts-expect-error nijiiinnininini
window.__RV = new RVSimulator();

const x = new RVSimulator();
void x;
