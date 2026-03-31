import type { ICPU, IDecodedInstruction } from '../common/processor';
import type { rv_codec, rv_opcode } from './riscv.const';

export interface IDecodedRVInstruction extends IDecodedInstruction {
  // Instruction bytecode
  bytecode: bigint;

  // Instruction codec
  codec: rv_codec;

  // Instruction in enum
  _op: rv_opcode;

  // Instruction opcode
  opcode: number;

  // RV32I fields:

  // Destination register
  rd: number;
  // Source register 1
  rs1: number;
  // Source register 2
  rs2: number;
  // Source register 3
  rs3: number;
  // Immediate value
  imm: bigint;
}

export interface IRVCPU extends ICPU {}
