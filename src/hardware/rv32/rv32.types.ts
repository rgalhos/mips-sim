import type { ICPU, IDecodedInstruction } from "../common/processor";
import type { rv_codec, rv_opcode } from "./rv32.const";

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
  //  Rounding mode (unused); 000 = RNE; 001 = RTZ; 010 = RDN; 011 = RUP; 100 = RMM; 101/110 = res; 111 = DYN
  rm: number;
  // Format; 00 = .s/F; 01 = .d/D; 10 = .h/Zfh/Zshmin; 11 = .q/Q
  // fmt: number;
}

export interface IRVCPU extends ICPU {
  registerF: Record<number, bigint>;
}
