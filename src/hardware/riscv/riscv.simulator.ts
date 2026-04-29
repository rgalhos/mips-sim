import { ETokenType, IToken, tokenize } from '../analyzer/tokenizer';
import { IUserManual } from '../common/manual';
import { IAssembledInstruction, ISimulator } from '../common/simulator';
import { rv_codec, rv_directives, rv_opcode, RV_OPCODE_DATA, rv_opcode_pseudo, rv_reg } from './riscv.const';
import { RVProcessor } from './riscv.processor';
import { IDecodedRVInstruction } from './riscv.types';

const throwUnexpectedToken = (tokens: IToken[]) => {
  console.log('rv: unexpected token', tokens);
  return new Error('rv: unexpected token');
};

export class RVSimulator extends ISimulator<RVProcessor> {
  static name = 'RISC-V (RV32I)';

  public static readonly manual: IUserManual;

  public readonly instructionKeywords = Object.keys({ ...rv_opcode, ...rv_opcode_pseudo, ...rv_directives })
    .filter((v) => Number.isNaN(+v))
    .slice(1) /* rv_opcode.illegal */;

  public readonly registerKeywords = Object.keys(rv_reg).filter((v) => Number.isNaN(+v));

  public readonly processor: RVProcessor = new RVProcessor();

  protected createCpuWorkerInstance(workerOptions?: WorkerOptions) {
    return new Worker(new URL('./riscv.worker.ts', import.meta.url), workerOptions);
  }

  public assembleLine(tokens: IToken[], constants: Record<string, IToken>) {
    const tkFirst = tokens[0];
    if (!tkFirst || tkFirst.type !== ETokenType.IDENTIFIER) {
      throw throwUnexpectedToken(tokens);
    }

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

    const op = String(tkFirst.value) as keyof typeof rv_opcode;
    const data = RV_OPCODE_DATA[rv_opcode[op]];
    if (!data || !data.opcode) return dec;

    dec._op = rv_opcode[op];
    dec.opcode = data.opcode;
    dec.codec = data.codec;

    const tok1 = tokens[1];
    const tok2 = tokens[2];
    const tok3 = tokens[3];

    const decodeConstOrFallback = (t: IToken) => {
      if (!t) throw throwUnexpectedToken([t]);
      else if (t.value !== ETokenType.IDENTIFIER) return t;
      return constants[t.value] || t;
    };

    const ensureRegister = (t: IToken): number => {
      const dec = decodeConstOrFallback(t);
      const v = (dec.value as string).toLowerCase();
      const r = rv_reg[v as keyof typeof rv_reg];
      if (typeof r === 'undefined') throw throwUnexpectedToken([dec]);
      return r;
    };

    const ensureNumber = (t: IToken): bigint => {
      const dec = decodeConstOrFallback(t);
      if (!dec || dec.type !== ETokenType.NUMBER) throwUnexpectedToken([dec]);
      return BigInt(dec.value as number);
    };

    switch (dec.codec) {
      case rv_codec.r:
        dec.rd = ensureRegister(tok1);
        dec.rs1 = ensureRegister(tok2);
        dec.rs2 = ensureRegister(tok3);
        break;
      case rv_codec.i:
        dec.rd = ensureRegister(tok1);
        dec.rs1 = ensureRegister(tok2);
        dec.imm = ensureNumber(tok3);
        break;
      case rv_codec.s:
      case rv_codec.b:
        dec.rs1 = ensureRegister(tok1);
        dec.rs2 = ensureRegister(tok2);
        if (tok3.type === ETokenType.NUMBER) {
          // else: is a label. treat it later
          dec.imm = ensureNumber(tok3);
        }
        break;
      case rv_codec.u:
      case rv_codec.j:
        dec.rd = ensureRegister(tok1);
        if (tok2.type === ETokenType.NUMBER) {
          // else: is a label. treat it later
          dec.imm = ensureNumber(tok2);
        }
        break;
    }

    dec.bytecode = this.processor.toBytecode(dec);

    return dec;
  }

  /**
   * @todo Essa função deveria apenas fazer o assemble do código, mas na realidade ela
   * reinicia a memória, faz o assembler, popula os dados na memória, gera as representações
   * intermediárias e as salva no cache de instruções.
   */
  public assembleCode(code: string): Array<IAssembledInstruction<IDecodedRVInstruction>> {
    // label->address translation table
    const labels: Record<string, bigint> = {};
    // constant->value translation table
    const constants: Record<string, IToken> = {
      PC_START: { type: ETokenType.NUMBER, value: Number(this.processor.PC_START) },
      STACK_START: { type: ETokenType.NUMBER, value: Number(this.processor.STACK_START) },
    };
    const assembledInstructions: Array<IAssembledInstruction<IDecodedRVInstruction>> = [];

    this.processor.memory = new Uint8Array(this.processor.memorySize);

    let currentAddr = 0x0n;
    let currentLabel = '';

    const codeSplit = code.split(/\n/g);
    for (const idx in codeSplit) {
      const line = codeSplit[idx];

      if (!line) {
        continue;
      }

      const tokens = tokenize(line);
      //console.log(tokens);

      if (tokens.length === 0) {
        continue;
      }

      // special: handle labels first then shift so we can start processing instructions
      if (tokens[0].type === ETokenType.LABEL) {
        let sLabel = tokens[0].value;
        tokens.shift();

        if (sLabel[0] === '.') {
          sLabel = currentLabel + sLabel;
        }

        if (!!labels[sLabel]) {
          console.log('rv: label already declared: ' + sLabel);
        }

        labels[sLabel] = BigInt(currentAddr);
      }

      const tkIdentifier = tokens[0];
      if (!tkIdentifier) {
        continue;
      } else if (tkIdentifier.type !== ETokenType.IDENTIFIER) {
        console.log('rv: unexpected token');
      }

      // directive
      if (tkIdentifier.type === ETokenType.IDENTIFIER && tkIdentifier.value[0] === '.') {
        const directive = tkIdentifier.value.toLowerCase();

        if (['.byte', '.half', '.word', '.dword', '.space'].includes(directive)) {
          const tkValue = tokens[1];

          if (!tkValue || tkValue.type !== ETokenType.NUMBER) {
            throw throwUnexpectedToken(tokens);
          }

          const val = BigInt(tkValue.value);

          if (directive === '.byte') {
            this.processor.memoryWrite(currentAddr, val, 8);
            currentAddr += 1n;
          } else if (directive === '.half') {
            this.processor.memoryWrite(currentAddr, val, 16);
            currentAddr += 2n;
          } else if (directive === '.word') {
            this.processor.memoryWrite(currentAddr, val, 32);
            currentAddr += 4n;
          } else if (directive === '.space') {
            currentAddr += val;
          }
        } else if (directive === '.org') {
          let tkValue = tokens[1];
          if (tkValue && tkValue.type === ETokenType.IDENTIFIER) {
            tkValue = constants[tkValue.value];
          }

          if (!tkValue || tkValue.type !== ETokenType.NUMBER) {
            throw throwUnexpectedToken(tokens);
          }

          const val = BigInt(tkValue.value);

          currentAddr = val;
        } else if (directive === '.ascii' || directive === '.asciz' || directive === '.string') {
          const tkValue = tokens[1];

          if (!tkValue || tkValue.type !== ETokenType.STRING) {
            throw throwUnexpectedToken(tokens);
          }

          for (const c of tkValue.value) {
            this.processor.memoryWrite(currentAddr, BigInt(c.charCodeAt(0)), 8);
            currentAddr += 1n;
          }

          if (directive !== '.ascii') {
            // .ascii is not zero-terminated
            this.processor.memoryWrite(currentAddr, 0n, 8);
            currentAddr += 1n;
          }
        } else if (directive === '.equ') {
          const tkName = tokens[1];
          const tkVal = tokens[2];

          if (!tkName || tkName.type !== ETokenType.IDENTIFIER || !tkVal) {
            throw throwUnexpectedToken([tkName, tkVal]);
          }

          constants[tkName.value] = tkVal;
        }
      }
      // identifier (instruction)
      else if (tkIdentifier.type === ETokenType.IDENTIFIER) {
        // instruction addresses must be 4-byte aligned
        currentAddr = (currentAddr + 3n) & ~0x3n;

        //console.log(line);
        const decoded = this.assembleLine(tokens, constants);
        //console.log(decoded);

        assembledInstructions.push({
          code: line,
          lineNumber: idx,
          tokens,
          decoded,
          address: currentAddr,
          scope: currentLabel,
        });

        currentAddr += 4n;
      } else {
        throw throwUnexpectedToken(tokens);
      }
    }

    for (const inst of assembledInstructions) {
      if (
        (inst.decoded.codec === rv_codec.u || inst.decoded.codec === rv_codec.j) &&
        inst.tokens[2].type === ETokenType.IDENTIFIER
      ) {
        const labelName = inst.scope + inst.tokens[2].value;
        const labelAddr = labels[labelName];
        if (typeof labelAddr === 'undefined') {
          console.error('rv: inexistent label: ', labelName);
          continue;
        }

        inst.decoded.imm = labelAddr;
        inst.decoded.bytecode = this.processor.toBytecode(inst.decoded);
      } else if (
        (inst.decoded.codec === rv_codec.s || inst.decoded.codec === rv_codec.b) &&
        inst.tokens[3].type === ETokenType.IDENTIFIER
      ) {
        const labelName = inst.scope + inst.tokens[3].value;
        const labelAddr = labels[labelName];
        if (typeof labelAddr === 'undefined') {
          console.error('rv: inexistent label: ', labelName);
          continue;
        }

        inst.decoded.imm = labelAddr;
        inst.decoded.bytecode = this.processor.toBytecode(inst.decoded);
      }
    }

    // write instructions to memory
    for (const inst of assembledInstructions) {
      console.log('writing at:', inst.address, 'val:', inst.decoded);
      this.processor.memoryWrite(inst.address, inst.decoded.bytecode, 32);
    }

    return assembledInstructions;
  }

  public linkToManual(instruction: string) {
    return 'https://msyksphinz-self.github.io/riscv-isadoc/html/rvi.html#' + instruction;
  }
}

// @ts-expect-error nijiiinnininini
window.__RV = new RVSimulator();

const x = new RVSimulator();
void x;
