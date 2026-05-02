import { IProcessor } from '../common/processor';
import { IAssembledInstruction } from '../common/simulator';
import { rv_codec, rv_opcode, RV_OPCODE_DATA, rv_reg } from './riscv.const';
import { IDecodedRVInstruction, IRVCPU } from './riscv.types';
import {
  encodeBType,
  encodeIType,
  encodeJType,
  encodeRType,
  encodeSType,
  encodeUType,
  operand_bimm,
  operand_funct3,
  operand_funct7,
  operand_iimm12,
  operand_imm_j,
  operand_imm_u,
  operand_opcode,
  operand_rd,
  operand_rs1,
  operand_rs2,
  operand_simm12,
  pack_i_imm12,
  reg5,
  u32,
} from './riscv.utils';

/** RV32I: valor inteiro com sinal em 32 bits (BigInt). */
function s32(n: bigint): bigint {
  return (n << 32n) >> 32n;
}

export class RVProcessor extends IProcessor<IDecodedRVInstruction> {
  public readonly registers = rv_reg;
  public readonly instructions = rv_opcode;
  public readonly opcodeInfo = RV_OPCODE_DATA;

  //protected readonly DRAM_BASE_ADDRESS = 0x80000000n;
  public readonly defaultMemorySize = 0xc000;
  public readonly PC_START = 0x0000n;
  public readonly PROGRAM_END = 0x2fffn;
  public readonly RODATA_START = 0x3000n;
  public readonly RODATA_END = 0x3fffn;
  public readonly DATA_START = 0x4000n;
  public readonly DATA_END = 0x4fffn;
  public readonly BSS_START = 0x5000n;
  public readonly BSS_END = 0x5fffn;
  public readonly FRAMEBUFFER_START = 0x8000n;
  public readonly FRAMEBUFFER_END = 0xa70fn;
  public readonly STACK_START = 0xc000n;
  public readonly STACK_END = 0xa710n;

  public readonly INSTRUCTION_LENGTH = 4;

  public program: IAssembledInstruction[] = [];

  private readonly initialCpuState: IRVCPU = {
    register: {
      [rv_reg.zero]: 0n,
      [rv_reg.ra]: 0n,
      [rv_reg.sp]: this.STACK_START,
      [rv_reg.gp]: 0n,
      [rv_reg.tp]: 0n,
      [rv_reg.t0]: 0n,
      [rv_reg.t1]: 0n,
      [rv_reg.t2]: 0n,
      [rv_reg.s0]: 0n,
      [rv_reg.s1]: 0n,
      [rv_reg.a0]: 0n,
      [rv_reg.a1]: 0n,
      [rv_reg.a2]: 0n,
      [rv_reg.a3]: 0n,
      [rv_reg.a4]: 0n,
      [rv_reg.a5]: 0n,
      [rv_reg.a6]: 0n,
      [rv_reg.a7]: 0n,
      [rv_reg.s2]: 0n,
      [rv_reg.s3]: 0n,
      [rv_reg.s4]: 0n,
      [rv_reg.s5]: 0n,
      [rv_reg.s6]: 0n,
      [rv_reg.s7]: 0n,
      [rv_reg.s8]: 0n,
      [rv_reg.s9]: 0n,
      [rv_reg.s10]: 0n,
      [rv_reg.s11]: 0n,
      [rv_reg.t3]: 0n,
      [rv_reg.t4]: 0n,
      [rv_reg.t5]: 0n,
      [rv_reg.t6]: 0n,
    },
    pc: this.PC_START,
  };

  public cpu: IRVCPU = Object.assign({}, this.initialCpuState);

  public resetState() {
    this.cpu = Object.assign({}, this.initialCpuState);

    super.resetState();
  }

  public toBytecode(instruction: Partial<IDecodedRVInstruction>): bigint {
    const op = instruction._op ?? rv_opcode.illegal;
    if (!instruction || op === rv_opcode.illegal) return 0n;

    const rd = BigInt(instruction.rd ?? rv_reg.zero);
    const rs1 = BigInt(instruction.rs1 ?? rv_reg.zero);
    const rs2 = BigInt(instruction.rs2 ?? rv_reg.zero);
    let imm = instruction.imm ?? 0n;

    if (op === rv_opcode.ebreak && imm === 0n) imm = 1n;

    const codec = RV_OPCODE_DATA[op].codec;

    if (op === rv_opcode.fence) {
      return u32(0b0001111n | (reg5(rd) << 7n) | (reg5(rs1) << 15n) | (pack_i_imm12(imm) << 20n));
    }

    switch (codec) {
      case rv_codec.r:
        return u32(encodeRType(op, rd, rs1, rs2));
      case rv_codec.i:
        return u32(encodeIType(op, rd, rs1, imm));
      case rv_codec.s:
        return u32(encodeSType(op, rs1, rs2, imm));
      case rv_codec.b:
        return u32(encodeBType(op, rs1, rs2, imm));
      case rv_codec.u:
        return u32(encodeUType(op, rd, imm));
      case rv_codec.j:
        return u32(encodeJType(op, rd, imm));
      default:
        return 0n;
    }
  }

  public fromBytecode(instruction: bigint): IDecodedRVInstruction {
    const bytecode = u32(instruction);
    let op: rv_opcode = rv_opcode.illegal;

    switch (operand_opcode(bytecode)) {
      case 0b0110011: {
        switch (operand_funct3(bytecode)) {
          case 0x0:
            switch (operand_funct7(bytecode)) {
              case 0x00:
                op = rv_opcode.add;
                break;
              case 0x20:
                op = rv_opcode.sub;
                break;
            }
            break;
          case 0x1:
            op = rv_opcode.sll;
            break;
          case 0x2:
            op = rv_opcode.slt;
            break;
          case 0x3:
            op = rv_opcode.sltu;
            break;
          case 0x4:
            op = rv_opcode.xor;
            break;
          case 0x5:
            switch (operand_funct7(bytecode)) {
              case 0x00:
                op = rv_opcode.srl;
                break;
              case 0x20:
                op = rv_opcode.sra;
                break;
            }
            break;
          case 0x6:
            op = rv_opcode.or;
            break;
          case 0x7:
            op = rv_opcode.and;
            break;
        }
        break;
      }
      case 0b0010011: {
        switch (operand_funct3(bytecode)) {
          case 0x0:
            op = rv_opcode.addi;
            break;
          case 0x1:
            op = rv_opcode.slli;
            break;
          case 0x2:
            op = rv_opcode.slti;
            break;
          case 0x3:
            op = rv_opcode.sltiu;
            break;
          case 0x4:
            op = rv_opcode.xori;
            break;
          case 0x5:
            switch (operand_funct7(bytecode)) {
              case 0x00:
                op = rv_opcode.srli;
                break;
              case 0x20:
                op = rv_opcode.srai;
                break;
            }
            break;
          case 0x6:
            op = rv_opcode.ori;
            break;
          case 0x7:
            op = rv_opcode.andi;
            break;
        }
        break;
      }
      case 0b0000011: {
        switch (operand_funct3(bytecode)) {
          case 0x0:
            op = rv_opcode.lb;
            break;
          case 0x1:
            op = rv_opcode.lh;
            break;
          case 0x2:
            op = rv_opcode.lw;
            break;
          case 0x4:
            op = rv_opcode.lbu;
            break;
          case 0x5:
            op = rv_opcode.lhu;
            break;
        }
        break;
      }
      case 0b0100011: {
        switch (operand_funct3(bytecode)) {
          case 0x0:
            op = rv_opcode.sb;
            break;
          case 0x1:
            op = rv_opcode.sh;
            break;
          case 0x2:
            op = rv_opcode.sw;
            break;
        }
        break;
      }
      case 0b1100011: {
        switch (operand_funct3(bytecode)) {
          case 0x0:
            op = rv_opcode.beq;
            break;
          case 0x1:
            op = rv_opcode.bne;
            break;
          case 0x4:
            op = rv_opcode.blt;
            break;
          case 0x5:
            op = rv_opcode.bge;
            break;
          case 0x6:
            op = rv_opcode.bltu;
            break;
          case 0x7:
            op = rv_opcode.bgeu;
            break;
        }
        break;
      }
      case 0b1101111:
        op = rv_opcode.jal;
        break;
      case 0b1100111:
        op = rv_opcode.jalr;
        break;
      case 0b0110111:
        op = rv_opcode.lui;
        break;
      case 0b0010111:
        op = rv_opcode.auipc;
        break;
      case 0b1110011: {
        if (operand_funct3(bytecode) !== 0) break;
        const sysImm = Number((u32(bytecode) >> 20n) & 0xfffn);
        if (sysImm === 0) op = rv_opcode.ecall;
        else if (sysImm === 1) op = rv_opcode.ebreak;
        break;
      }
    }

    if (op === rv_opcode.illegal) {
      return {
        bytecode,
        _op: rv_opcode.illegal,
        opcode: 0,
        codec: rv_codec.illegal,
        rd: rv_reg.zero,
        rs1: rv_reg.zero,
        rs2: rv_reg.zero,
        rs3: rv_reg.zero,
        imm: 0n,
      };
    }

    const op_info = RV_OPCODE_DATA[op];
    const dec: IDecodedRVInstruction = {
      bytecode,
      _op: op,
      opcode: op_info.opcode,
      codec: op_info.codec,
      rd: rv_reg.zero,
      rs1: rv_reg.zero,
      rs2: rv_reg.zero,
      rs3: rv_reg.zero,
      imm: 0n,
    };

    switch (op_info.codec) {
      case rv_codec.r:
        dec.rd = operand_rd(bytecode) as rv_reg;
        dec.rs1 = operand_rs1(bytecode) as rv_reg;
        dec.rs2 = operand_rs2(bytecode) as rv_reg;
        break;
      case rv_codec.i:
        dec.rd = operand_rd(bytecode) as rv_reg;
        dec.rs1 = operand_rs1(bytecode) as rv_reg;
        dec.imm = operand_iimm12(bytecode);
        break;
      case rv_codec.s:
        dec.rs1 = operand_rs1(bytecode) as rv_reg;
        dec.rs2 = operand_rs2(bytecode) as rv_reg;
        dec.imm = operand_simm12(bytecode);
        break;
      case rv_codec.b:
        dec.rs1 = operand_rs1(bytecode) as rv_reg;
        dec.rs2 = operand_rs2(bytecode) as rv_reg;
        dec.imm = operand_bimm(bytecode);
        break;
      case rv_codec.u:
        dec.rd = operand_rd(bytecode) as rv_reg;
        dec.imm = operand_imm_u(bytecode);
        break;
      case rv_codec.j:
        dec.rd = operand_rd(bytecode) as rv_reg;
        dec.imm = operand_imm_j(bytecode);
        break;
      default:
        dec.imm = 0n;
        break;
    }

    return dec;
  }

  public fetch() {
    if (this.cpu.pc - 4n >= this.memory.length) {
      return 0xf00fffffn;
    }

    return this.memoryRead(this.cpu.pc, 32);
  }

  public decode(inst: bigint) {
    const intInst = Number(inst);
    const cached = this.instructionCache[intInst];

    if (cached) {
      return cached;
    }

    const dec = this.fromBytecode(inst);

    if (dec.codec !== rv_codec.illegal) {
      this.instructionCache[intInst] = dec;
    }

    return dec;
  }

  public execute(d: IDecodedRVInstruction): void {
    console.log('WIMS: rv.execute: ' + this.stringifyInstruction(d), d);

    this.lastExecutedInstruction = d;

    this.cycle++;

    const pc = this.cpu.pc;
    const v1 = this.registerRead(d.rs1);
    const v2 = this.registerRead(d.rs2);

    switch (d._op) {
      case rv_opcode.lui:
        this.registerWrite(d.rd, u32(d.imm << 12n));
        break;
      case rv_opcode.auipc:
        this.registerWrite(d.rd, u32(pc + u32(d.imm << 12n)));
        break;
      case rv_opcode.jal:
        this.registerWrite(d.rd, pc + 4n);
        this.cpu.pc = u32(pc + d.imm);
        break;
      case rv_opcode.jalr: {
        const t = u32(v1 + d.imm) & ~1n;
        this.registerWrite(d.rd, pc + 4n);
        this.cpu.pc = t;
        break;
      }
      case rv_opcode.beq:
        if (v1 === v2) this.cpu.pc = u32(pc + d.imm);
        break;
      case rv_opcode.bne:
        if (v1 !== v2) this.cpu.pc = u32(pc + d.imm);
        break;
      case rv_opcode.blt:
        if (s32(v1) < s32(v2)) this.cpu.pc = u32(pc + d.imm);
        break;
      case rv_opcode.bge:
        if (s32(v1) >= s32(v2)) this.cpu.pc = u32(pc + d.imm);
        break;
      case rv_opcode.bltu:
        if (u32(v1) < u32(v2)) this.cpu.pc = u32(pc + d.imm);
        break;
      case rv_opcode.bgeu:
        if (u32(v1) >= u32(v2)) this.cpu.pc = u32(pc + d.imm);
        break;
      case rv_opcode.lb: {
        const addr = u32(v1 + d.imm);
        let b = this.memoryRead(addr, 8) & 0xffn;
        if (b & 0x80n) b |= ~0xffn;
        this.registerWrite(d.rd, u32(b));
        break;
      }
      case rv_opcode.lh: {
        const addr = u32(v1 + d.imm);
        let h = this.memoryRead(addr, 16) & 0xffffn;
        if (h & 0x8000n) h |= ~0xffffn;
        this.registerWrite(d.rd, u32(h));
        break;
      }
      case rv_opcode.lw: {
        const addr = u32(v1 + d.imm);
        this.registerWrite(d.rd, u32(this.memoryRead(addr, 32)));
        break;
      }
      case rv_opcode.lbu: {
        const addr = u32(v1 + d.imm);
        this.registerWrite(d.rd, this.memoryRead(addr, 8) & 0xffn);
        break;
      }
      case rv_opcode.lhu: {
        const addr = u32(v1 + d.imm);
        this.registerWrite(d.rd, this.memoryRead(addr, 16) & 0xffffn);
        break;
      }
      case rv_opcode.sb:
        this.memoryWrite(u32(v1 + d.imm), v2 & 0xffn, 8);
        break;
      case rv_opcode.sh:
        this.memoryWrite(u32(v1 + d.imm), v2 & 0xffffn, 16);
        break;
      case rv_opcode.sw:
        this.memoryWrite(u32(v1 + d.imm), v2, 32);
        break;
      case rv_opcode.addi:
        this.registerWrite(d.rd, u32(v1 + d.imm));
        break;
      case rv_opcode.slti:
        this.registerWrite(d.rd, s32(v1) < s32(d.imm) ? 1n : 0n);
        break;
      case rv_opcode.sltiu:
        this.registerWrite(d.rd, u32(v1) < u32(d.imm) ? 1n : 0n);
        break;
      case rv_opcode.xori:
        this.registerWrite(d.rd, u32(v1 ^ d.imm));
        break;
      case rv_opcode.ori:
        this.registerWrite(d.rd, u32(v1 | d.imm));
        break;
      case rv_opcode.andi:
        this.registerWrite(d.rd, u32(v1 & d.imm));
        break;
      case rv_opcode.slli:
        this.registerWrite(d.rd, u32(u32(v1) << (d.imm & 0x1fn)));
        break;
      case rv_opcode.srli:
        this.registerWrite(d.rd, u32(v1) >> (d.imm & 0x1fn));
        break;
      case rv_opcode.srai:
        this.registerWrite(d.rd, u32(s32(v1) >> (d.imm & 0x1fn)));
        break;
      case rv_opcode.add:
        this.registerWrite(d.rd, u32(v1 + v2));
        break;
      case rv_opcode.sub:
        this.registerWrite(d.rd, u32(v1 - v2));
        break;
      case rv_opcode.sll:
        this.registerWrite(d.rd, u32(u32(v1) << (v2 & 0x1fn)));
        break;
      case rv_opcode.slt:
        this.registerWrite(d.rd, s32(v1) < s32(v2) ? 1n : 0n);
        break;
      case rv_opcode.sltu:
        this.registerWrite(d.rd, u32(v1) < u32(v2) ? 1n : 0n);
        break;
      case rv_opcode.xor:
        this.registerWrite(d.rd, u32(v1 ^ v2));
        break;
      case rv_opcode.srl:
        this.registerWrite(d.rd, u32(u32(v1) >> (v2 & 0x1fn)));
        break;
      case rv_opcode.sra:
        this.registerWrite(d.rd, u32(s32(v1) >> (v2 & 0x1fn)));
        break;
      case rv_opcode.or:
        this.registerWrite(d.rd, u32(v1 | v2));
        break;
      case rv_opcode.and:
        this.registerWrite(d.rd, u32(v1 & v2));
        break;
      case rv_opcode.ebreak:
        this.setHalted(true);
        break;
    }
  }

  public run() {
    console.log('@todo run');
  }

  public step() {
    const inst = this.fetch();
    const dec = this.decode(inst);

    console.log('cpu.step: stepped', { halted: this.halted, inst, dec, pc: this.cpu.pc });

    if (dec.codec === rv_codec.illegal) {
      console.log('cpu.step: stepped into illegal instruction, halting', {
        halted: this.halted,
        inst,
        dec,
        pc: this.cpu.pc,
      });
      this.setHalted(true);
      return;
    }

    const prevPc = this.cpu.pc;
    this.execute(dec);
    const isUncondJump = dec._op === rv_opcode.jal || dec._op === rv_opcode.jalr;
    if (!isUncondJump && this.cpu.pc === prevPc) {
      this.cpu.pc += 4n;
    }
  }

  public stringifyInstruction(instruction: Partial<IDecodedRVInstruction>): string {
    const opcode = instruction._op || rv_opcode.illegal;
    const rd = rv_reg[instruction.rd || rv_reg.zero];
    const rs1 = rv_reg[instruction.rs1 || rv_reg.zero];
    const rs2 = rv_reg[instruction.rs2 || rv_reg.zero];
    const rs3 = rv_reg[instruction.rs3 || rv_reg.zero];
    const imm = instruction.imm || 0n;

    const op_info = RV_OPCODE_DATA[opcode];
    const fmt = op_info.format;
    let str = '';

    for (const c of fmt) {
      if (c === 'O') {
        str += op_info.name;
      } else if (c === 'd') {
        str += rd;
      } else if (c === '1') {
        str += rs1;
      } else if (c === '2') {
        str += rs2;
      } else if (c === '3') {
        str += rs3;
      } else if (c === 'i') {
        str += imm;
      } else if (c === 'x') {
        str += '0x' + (imm & 0xffffffffn).toString(16).toUpperCase();
      } else if (c === 'X') {
        str += '0x' + (imm & 0xffffffffn).toString(16).toUpperCase().padStart(8, '0');
      } else if (c === 'j') {
        str += imm;
      } else {
        str += c;
      }
    }

    return str;
  }

  protected registerRead(reg: number) {
    if (reg === rv_reg.zero) {
      return 0n;
    }

    return super.registerRead(reg);
  }

  protected registerWrite(reg: number, value: bigint) {
    if (reg === rv_reg.sp && value >= this.STACK_END) {
      throw new Error('stack overflow; register[sp] < STACK_END');
    }

    if (reg !== rv_reg.zero) {
      return super.registerWrite(reg, value & 0xffffffffn);
    }
  }

  public loadProgram(program: Array<IAssembledInstruction<IDecodedRVInstruction>>) {
    this.memory = new Uint8Array(); // force gc
    this.memory = new Uint8Array(this.memorySize); // @todo

    this.cycle = 0n;
    this.cpu.pc = program[0]?.address || 0x0n; //|| this.PC_START;
    this.cpu.register[rv_reg.sp] = this.STACK_START;

    for (const v of program) {
      // @todo aceitar bytes
      this.memoryWrite(v.address, v.decoded.bytecode, 32);
    }

    for (const v of program) {
      console.log('0x' + this.memoryRead(v.address, 32).toString(16).padStart(8, '0'));
    }
  }
}

const x = new RVProcessor();
void x;
