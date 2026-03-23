import { IProcessor } from '../common/processor';
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

export class RVProcessor extends IProcessor<IDecodedRVInstruction> {
  public readonly registers = rv_reg;
  public readonly instructions = rv_opcode;
  public readonly opcodeInfo = RV_OPCODE_DATA;

  protected readonly DRAM_BASE_ADDRESS = 0x80000000n;

  protected readonly cpu: IRVCPU = {
    register: {
      [rv_reg.zero]: 0n,
      [rv_reg.ra]: 0n,
      [rv_reg.sp]: 0n,
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
    pc: 0,
  };

  public assemble(instruction: Partial<IDecodedRVInstruction>): bigint {
    const op = instruction.op ?? rv_opcode.illegal;
    if (op === rv_opcode.illegal) return 0n;

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

  public disassemble(instruction: bigint): IDecodedRVInstruction {
    const inst = u32(instruction);
    let op: rv_opcode = rv_opcode.illegal;

    switch (operand_opcode(inst)) {
      case 0b0110011: {
        switch (operand_funct3(inst)) {
          case 0x0:
            switch (operand_funct7(inst)) {
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
            switch (operand_funct7(inst)) {
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
        switch (operand_funct3(inst)) {
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
            switch (operand_funct7(inst)) {
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
        switch (operand_funct3(inst)) {
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
        switch (operand_funct3(inst)) {
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
        switch (operand_funct3(inst)) {
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
        if (operand_funct3(inst) !== 0) break;
        const sysImm = Number((u32(inst) >> 20n) & 0xfffn);
        if (sysImm === 0) op = rv_opcode.ecall;
        else if (sysImm === 1) op = rv_opcode.ebreak;
        break;
      }
    }

    if (op === rv_opcode.illegal) {
      return {
        inst,
        op: rv_opcode.illegal,
        codec: rv_codec.illegal,
        rd: rv_reg.zero,
        rs1: rv_reg.zero,
        rs2: rv_reg.zero,
        rs3: rv_reg.zero,
        imm: 0n,
      };
    }

    const codec = RV_OPCODE_DATA[op].codec;
    const dec: IDecodedRVInstruction = {
      inst,
      op,
      codec,
      rd: rv_reg.zero,
      rs1: rv_reg.zero,
      rs2: rv_reg.zero,
      rs3: rv_reg.zero,
      imm: 0n,
    };

    switch (codec) {
      case rv_codec.r:
        dec.rd = operand_rd(inst) as rv_reg;
        dec.rs1 = operand_rs1(inst) as rv_reg;
        dec.rs2 = operand_rs2(inst) as rv_reg;
        break;
      case rv_codec.i:
        dec.rd = operand_rd(inst) as rv_reg;
        dec.rs1 = operand_rs1(inst) as rv_reg;
        dec.imm = operand_iimm12(inst);
        break;
      case rv_codec.s:
        dec.rs1 = operand_rs1(inst) as rv_reg;
        dec.rs2 = operand_rs2(inst) as rv_reg;
        dec.imm = operand_simm12(inst);
        break;
      case rv_codec.b:
        dec.rs1 = operand_rs1(inst) as rv_reg;
        dec.rs2 = operand_rs2(inst) as rv_reg;
        dec.imm = operand_bimm(inst);
        break;
      case rv_codec.u:
        dec.rd = operand_rd(inst) as rv_reg;
        dec.imm = operand_imm_u(inst);
        break;
      case rv_codec.j:
        dec.rd = operand_rd(inst) as rv_reg;
        dec.imm = operand_imm_j(inst);
        break;
      default:
        dec.imm = 0n;
        break;
    }

    return dec;
  }

  execute(d: IDecodedRVInstruction): void {
    console.log('WIMS: rv.execute: ' + this.stringifyInstruction(d));

    switch (d.op) {
      case rv_opcode.lui:
        this.registerWrite(d.rd, d.imm);
        break;
    }
  }

  public stringifyInstruction(instruction: Partial<IDecodedRVInstruction>): string {
    const opcode = instruction.op || rv_opcode.illegal;
    const rd = rv_reg[instruction.rd || rv_reg.zero];
    const rs1 = rv_reg[instruction.rs1 || rv_reg.zero];
    const rs2 = rv_reg[instruction.rs2 || rv_reg.zero];
    const rs3 = rv_reg[instruction.rs3 || rv_reg.zero];
    const imm = instruction.imm || 0;

    const op_info = RV_OPCODE_DATA[opcode];
    const fmt = op_info.format;
    let str = '';

    for (const c of fmt) {
      if (c === 'O') {
        str += opcode;
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
        str += '0x' + imm.toString(16);
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
    if (reg !== rv_reg.zero) {
      return super.registerWrite(reg, value & 0xffffffffn);
    }
  }
}

const x = new RVProcessor();
void x;
