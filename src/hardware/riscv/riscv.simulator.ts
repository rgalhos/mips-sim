import { ETokenType, IToken, tokenize } from '../analyzer/tokenizer';
import { IUserManual } from '../common/manual';
import { IAssembledInstruction, ISimulator } from '../common/simulator';
import {
  rv_codec,
  rv_directives,
  rv_opcode,
  RV_OPCODE_DATA,
  rv_opcode_pseudo,
  rv_reg,
  rv_syscalls,
} from './riscv.const';
import { RVProcessor } from './riscv.processor';
import { IDecodedRVInstruction } from './riscv.types';
import { splitHiLoS32 } from './riscv.utils';
import { rvManual } from './user/riscv.manual';

const throwUnexpectedToken = (tokens: IToken[]) => {
  console.log('rv: unexpected token', tokens);
  return new Error('rv: unexpected token', { cause: 'UNEXPECTED_TOKEN' });
};

const RV_RELOC_OPS = new Set(['hi', 'lo', 'pcrel_hi', 'pcrel_lo']);

export class RVSimulator extends ISimulator<RVProcessor> {
  static name = 'RISC-V (RV32I)';

  public readonly manual: IUserManual = rvManual;

  public readonly instructionKeywords = Object.keys({ ...rv_opcode, ...rv_opcode_pseudo })
    .filter((v) => Number.isNaN(+v))
    .slice(1) /* rv_opcode.illegal */;

  public readonly registerKeywords = Object.keys(rv_reg).filter((v) => Number.isNaN(+v));

  public readonly directives = Object.keys(rv_directives).filter((v) => Number.isNaN(+v));

  public readonly consts = [
    'PC_START',
    'STACK_START',
    'FRAMEBUFFER_START',
    'FRAMEBUFFER_END',
    'INPUT_BUFFER_ADDR',
    'SYSCALL_PRINT_INT',
    'SYSCALL_PRINT_STRING',
    'SYSCALL_PRINT_CHAR',
    'SYSCALL_UPDATE_SCREEN',
    'OPTION_EXPLICIT_SCREEN_UPDATE',
  ];

  public readonly processor: RVProcessor = new RVProcessor();

  public _optExplicitScreenUpdate = false;

  protected createCpuWorkerInstance(workerOptions?: WorkerOptions) {
    return new Worker(new URL('./riscv.worker.ts', import.meta.url), workerOptions);
  }

  private followConstSubst(t: IToken, constants: Record<string, IToken>): IToken {
    let cur = t;
    const seen = new Set<string>();

    while (cur.type === ETokenType.IDENTIFIER) {
      const next = constants[cur.value];
      if (!next) break;
      if (seen.has(cur.value)) throw new Error('rv: circular .equ');
      seen.add(cur.value);
      cur = next;
    }

    return cur;
  }

  private resolveConstantName(name: string, constants: Record<string, IToken>): bigint | undefined {
    const t = constants[name];
    if (!t) return undefined;
    const cur = this.followConstSubst(t, constants);
    if (cur.type === ETokenType.NUMBER) return BigInt(cur.value as number);
    return undefined;
  }

  private ensureNumericImmediate(t: IToken | undefined, constants: Record<string, IToken>): bigint {
    if (!t) throw throwUnexpectedToken([]);
    const cur = this.followConstSubst(t, constants);
    if (cur.type !== ETokenType.NUMBER) throw throwUnexpectedToken([cur]);
    return BigInt(cur.value as number);
  }

  private ensureRegisterToken(t: IToken | undefined, constants: Record<string, IToken>): number {
    if (!t) throw throwUnexpectedToken([]);
    const cur = this.followConstSubst(t, constants);
    const v = String(cur.value).toLowerCase();
    const r = rv_reg[v as keyof typeof rv_reg];
    if (typeof r === 'undefined') throw throwUnexpectedToken([cur]);
    return r;
  }

  // 'pcrel_lo' assume que a ultima instrução é um AUIPC em pc-4 (auipc+addi pair).
  private relocImmediate(op: string, symbolVal: bigint, instAddr: bigint): bigint {
    if (!RV_RELOC_OPS.has(op)) {
      throw new Error(`rv: unknown relocation operator %${op}`);
    }

    switch (op) {
      case 'hi':
        return splitHiLoS32(symbolVal).hi;
      case 'lo':
        return splitHiLoS32(symbolVal).lo;
      case 'pcrel_hi':
        return splitHiLoS32(symbolVal - instAddr).hi;
      case 'pcrel_lo':
        return splitHiLoS32(symbolVal - (instAddr - 4n)).lo;
      default:
        throw new Error(`rv: unknown relocation operator %${op}`);
    }
  }

  private decodeImmediate(
    tokens: IToken[],
    immIdx: number,
    constants: Record<string, IToken>,
    pc: bigint,
    codec: IDecodedRVInstruction['codec'],
  ): bigint {
    const immTok = tokens[immIdx];
    if (!immTok) throw throwUnexpectedToken(tokens);

    if (immTok.type === ETokenType.RELOC) {
      const op = immTok.value;
      if (!RV_RELOC_OPS.has(op)) throw new Error(`rv: unknown relocation operator %${op}`);

      const operand = tokens[immIdx + 1];
      if (!operand) throw throwUnexpectedToken(tokens);

      if (operand.type === ETokenType.NUMBER) {
        return this.relocImmediate(op, BigInt(operand.value as number), pc);
      }
      if (operand.type === ETokenType.IDENTIFIER) {
        const c = this.resolveConstantName(operand.value, constants);
        if (c !== undefined) return this.relocImmediate(op, c, pc);
        return 0n;
      }
      throw throwUnexpectedToken([operand]);
    }

    if (immTok.type === ETokenType.NUMBER) {
      return BigInt(immTok.value as number);
    }
    if (immTok.type === ETokenType.IDENTIFIER) {
      const c = this.resolveConstantName(immTok.value, constants);
      if (c !== undefined) {
        if (codec === rv_codec.j || codec === rv_codec.b) return c - pc;
        if (codec === rv_codec.u) return (c >> 12n) & 0xfffffn;
        return c;
      }
      return 0n;
    }

    throw throwUnexpectedToken([immTok]);
  }

  private handlePseudoInstruction(
    tokens: IToken[],
    constants: Record<string, IToken>,
    pc: bigint,
  ): IDecodedRVInstruction[] {
    const invalid: IDecodedRVInstruction = {
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

    const tkFirst = tokens[0];
    const tok1 = tokens[1];
    const tok2 = tokens[2];
    const pseudo = tkFirst.value?.toString().toLowerCase() as keyof typeof rv_opcode_pseudo;

    switch (pseudo) {
      case 'nop': {
        return this.assembleLine(tokenize('addi zero, zero, 0'), {}, 0n, true);
      }
      case 'mv': {
        const rd = this.ensureRegisterToken(tok1, constants);
        const rs1 = this.ensureRegisterToken(tok2, constants);
        return this.assembleLine(tokenize(`addi x${rd}, x${rs1}, 0`), {}, 0n, true);
      }
      case 'la': {
        const rd = this.ensureRegisterToken(tok1, constants);
        const imm = this.ensureNumericImmediate(tok2, constants);
        return [
          ...this.assembleLine(tokenize(`auipc x${rd}, %hi(${imm})`), {}, pc, true),
          ...this.assembleLine(tokenize(`addi x${rd}, x${rd}, %lo(${imm})`), {}, 0n, true),
        ];
      }
      // case 'j': {
      //   const imm = this.ensureNumericImmediate(tok2, constants);
      //   return this.assembleLine(tokenize(`jal ra, ${imm}`), {}, 0n, true);
      // }
      // case 'jump': {
      //
      // }
      case 'not': {
        const rd = this.ensureRegisterToken(tok1, constants);
        const rs1 = this.ensureRegisterToken(tok2, constants);
        return this.assembleLine(tokenize(`xori x${rd}, x${rs1}, -1`), {}, 0n, true);
      }
      case 'neg': {
        const rd = this.ensureRegisterToken(tok1, constants);
        const rs1 = this.ensureRegisterToken(tok2, constants);
        return this.assembleLine(tokenize(`sub x${rd}, zero, x${rs1}`), {}, 0n, true);
      }
      case 'seqz': {
        const rd = this.ensureRegisterToken(tok1, constants);
        const rs1 = this.ensureRegisterToken(tok2, constants);
        return this.assembleLine(tokenize(`sltiu x${rd}, x${rs1}, 1`), {}, 0n, true);
      }
      case 'snez': {
        const rd = this.ensureRegisterToken(tok1, constants);
        const rs1 = this.ensureRegisterToken(tok2, constants);
        return this.assembleLine(tokenize(`sltu x${rd}, zero, x${rs1}`), {}, 0n, true);
      }
      case 'sltz': {
        const rd = this.ensureRegisterToken(tok1, constants);
        const rs1 = this.ensureRegisterToken(tok2, constants);
        return this.assembleLine(tokenize(`slt x${rd}, x${rs1}, zero`), {}, 0n, true);
      }
      case 'sgtz': {
        const rd = this.ensureRegisterToken(tok1, constants);
        const rs1 = this.ensureRegisterToken(tok2, constants);
        return this.assembleLine(tokenize(`slt x${rd}, x${rs1}, zero`), {}, 0n, true);
      }
      // BLA BLA BLA @todo resto das instruções
      case 'ret': {
        return this.assembleLine(tokenize('jalr zero, ra, 0'), {}, 0n, true);
      }
    }

    return [invalid];
  }

  public assembleLine(
    tokens: IToken[],
    constants: Record<string, IToken>,
    pc: bigint,
    handledPseudo = false,
  ): IDecodedRVInstruction[] {
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

    const op = tkFirst.value.toLowerCase() as keyof typeof rv_opcode;
    const data = RV_OPCODE_DATA[rv_opcode[op]];
    if (!data || !data.opcode) {
      if (!handledPseudo && !!rv_opcode_pseudo[tkFirst.type]) {
        return this.handlePseudoInstruction(tokens, constants, pc);
      }

      return [dec];
    }

    dec._op = rv_opcode[op];
    dec.opcode = data.opcode;
    dec.codec = data.codec;

    const tok1 = tokens[1];
    const tok2 = tokens[2];
    const tok3 = tokens[3];

    switch (dec.codec) {
      case rv_codec.r:
        dec.rd = this.ensureRegisterToken(tok1, constants);
        dec.rs1 = this.ensureRegisterToken(tok2, constants);
        dec.rs2 = this.ensureRegisterToken(tok3, constants);
        break;
      case rv_codec.i:
        if (dec._op === rv_opcode.ebreak) break;

        dec.rd = this.ensureRegisterToken(tok1, constants);
        dec.rs1 = this.ensureRegisterToken(tok2, constants);
        dec.imm = this.decodeImmediate(tokens, 3, constants, pc, dec.codec) & 0xfffn;
        break;
      case rv_codec.s:
      case rv_codec.b:
        dec.rs1 = this.ensureRegisterToken(tok1, constants);
        dec.rs2 = this.ensureRegisterToken(tok2, constants);
        dec.imm = this.decodeImmediate(tokens, 3, constants, pc, dec.codec) & 0xfffn;
        break;
      case rv_codec.u:
      case rv_codec.j:
        dec.rd = this.ensureRegisterToken(tok1, constants);
        dec.imm = this.decodeImmediate(tokens, 2, constants, pc, dec.codec) & 0xfffffn;
        break;
    }

    dec.bytecode = this.processor.toBytecode(dec);

    return [dec];
  }

  /**
   * @todo Essa função deveria apenas fazer o assemble do código, mas na realidade ela
   * reinicia a memória, faz o assembler, popula os dados na memória, gera as representações
   * intermediárias e as salva no cache de instruções.
   */
  public assembleCode(code: 'string'): Array<IAssembledInstruction<IDecodedRVInstruction>> {
    // label->address translation table
    const labels: Record<string, bigint> = {};
    // constant->value translation table
    const constants: Record<string, IToken> = {
      PC_START: { type: ETokenType.NUMBER, value: Number(this.processor.PC_START) },
      STACK_START: { type: ETokenType.NUMBER, value: Number(this.processor.STACK_START) },
      FRAMEBUFFER_START: { type: ETokenType.NUMBER, value: Number(this.processor.FRAMEBUFFER_START) }, // @todo
      FRAMEBUFFER_END: { type: ETokenType.NUMBER, value: Number(this.processor.FRAMEBUFFER_END) }, // @todo
      INPUT_BUFFER_ADDR: { type: ETokenType.NUMBER, value: 0xf00f }, // @todo
      SYSCALL_PRINT_INT: { type: ETokenType.NUMBER, value: rv_syscalls.syscall_print_int },
      SYSCALL_PRINT_STRING: { type: ETokenType.NUMBER, value: rv_syscalls.syscall_print_string },
      SYSCALL_PRINT_CHAR: { type: ETokenType.NUMBER, value: rv_syscalls.syscall_print_char },
      SYSCALL_UPDATE_SCREEN: { type: ETokenType.NUMBER, value: rv_syscalls.syscall_update_screen },
      OPTION_EXPLICIT_SCREEN_UPDATE: { type: ETokenType.NUMBER, value: 0xf001 },
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
          const val = this.ensureNumericImmediate(tkValue, constants);

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
          currentAddr = this.ensureNumericImmediate(tokens[1], constants);
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
        } else if (directive === '.text') {
          currentAddr = this.processor.PC_START;
        } else if (directive === '.rodata') {
          currentAddr = this.processor.RODATA_START;
        } else if (directive === '.bss') {
          currentAddr = this.processor.BSS_START;
        } else if (directive === '.data') {
          currentAddr = this.processor.DATA_START;
        } else if (directive === '.option') {
          const val = tokens[1]?.value;

          if (val === 'OPTION_EXPLICIT_SCREEN_UPDATE') {
            this._optExplicitScreenUpdate = true;
          } else {
            throw throwUnexpectedToken(tokens);
          }
        }
      }
      // identifier (instruction)
      else if (tkIdentifier.type === ETokenType.IDENTIFIER) {
        // instruction addresses must be 4-byte aligned
        currentAddr = (currentAddr + 3n) & ~0x3n;

        //console.log(line);
        const decodedInstructions = this.assembleLine(tokens, constants, currentAddr);

        for (const decoded of decodedInstructions) {
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
        }
      } else {
        throw throwUnexpectedToken(tokens);
      }
    }

    for (const inst of assembledInstructions) {
      const { decoded, tokens, address, scope } = inst;
      let immIdx: number | undefined;
      if (decoded.codec === rv_codec.i || decoded.codec === rv_codec.s || decoded.codec === rv_codec.b) {
        immIdx = 3;
      } else if (decoded.codec === rv_codec.u || decoded.codec === rv_codec.j) {
        immIdx = 2;
      }

      if (immIdx === undefined || immIdx >= tokens.length) continue;

      const immTok = tokens[immIdx];

      if (immTok?.type === ETokenType.RELOC) {
        const op = immTok.value;
        if (!RV_RELOC_OPS.has(op)) {
          throw new Error(`rv: unknown relocation operator %${op}`);
        }

        const operand = tokens[immIdx + 1];
        if (!operand) throw throwUnexpectedToken(tokens);
        if (operand.type === ETokenType.NUMBER) continue;
        if (operand.type !== ETokenType.IDENTIFIER) throw throwUnexpectedToken(tokens);
        if (this.resolveConstantName(operand.value, constants) !== undefined) continue;

        const labelName = scope + operand.value;
        const labelAddr = labels[labelName];
        if (typeof labelAddr === 'undefined') {
          console.error('rv: inexistent label: ', labelName);
          continue;
        }

        decoded.imm = this.relocImmediate(op, labelAddr, address);
        decoded.bytecode = this.processor.toBytecode(decoded);

        continue;
      }

      if (!immTok || immTok.type !== ETokenType.IDENTIFIER) continue;

      if (this.resolveConstantName(immTok.value, constants) !== undefined) continue;

      const labelName = scope + immTok.value;
      const labelAddr = labels[labelName];
      if (typeof labelAddr === 'undefined') {
        console.error('rv: inexistent label: ', labelName);
        continue;
      }

      if (decoded.codec === rv_codec.j || decoded.codec === rv_codec.b || decoded.codec === rv_codec.s) {
        decoded.imm = labelAddr - address;
      } else if (decoded.codec === rv_codec.u) {
        decoded.imm = (labelAddr >> 12n) & 0xfffffn;
      } else if (decoded.codec === rv_codec.i) {
        decoded.imm = labelAddr;
      }
      decoded.bytecode = this.processor.toBytecode(decoded);
    }

    // write instructions to memory
    for (const inst of assembledInstructions) {
      console.log('writing at:', inst.address, 'val:', inst.decoded);
      this.processor.memoryWrite(inst.address, inst.decoded.bytecode, 32);
    }

    return assembledInstructions;
  }

  public linkToManual(instruction: string) {
    return `https://riscv.github.io/riscv-unified-db/manual/html/isa/isa_20240411/insts/${instruction.toLowerCase()}.html`;
  }
}
