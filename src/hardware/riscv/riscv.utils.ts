import { rv_opcode } from './riscv.const';

export function u32(n: bigint): bigint {
  return n & 0xffffffffn;
}

export function operand_opcode(inst: bigint): number {
  return Number(u32(inst) & 0x7fn);
}

export function operand_rd(inst: bigint): number {
  return Number((u32(inst) >> 7n) & 0x1fn);
}

export function operand_rs1(inst: bigint): number {
  return Number((u32(inst) >> 15n) & 0x1fn);
}

export function operand_rs2(inst: bigint): number {
  return Number((u32(inst) >> 20n) & 0x1fn);
}

export function operand_funct3(inst: bigint): number {
  return Number((u32(inst) >> 12n) & 0x7n);
}

export function operand_funct7(inst: bigint): number {
  return Number((u32(inst) >> 25n) & 0x7fn);
}

export function operand_iimm12(inst: bigint): bigint {
  const u = u32(inst);
  let imm = (u >> 20n) & 0xfffn;
  if (imm & 0x800n) imm |= ~0xfffn;
  return imm | 0n;
}

// @todo CONFERIR
/** S-type immediate, sign-extended */
export function operand_simm12(inst: bigint): bigint {
  const u = u32(inst);
  const imm11_5 = (u >> 25n) & 0x7fn;
  const imm4_0 = (u >> 7n) & 0x1fn;
  let imm = (imm11_5 << 5n) | imm4_0;
  if (imm & 0x800n) imm |= ~0xfffn;
  return imm | 0n;
}

/** B-type branch offset, sign-extended (13 bits, LSB implicit 0) */
export function operand_bimm(inst: bigint): bigint {
  const u = u32(inst);
  const imm12 = (u >> 31n) & 1n;
  const imm11 = (u >> 7n) & 1n;
  const imm10_5 = (u >> 25n) & 0x3fn;
  const imm4_1 = (u >> 8n) & 0xfn;
  let imm = (imm12 << 12n) | (imm11 << 11n) | (imm10_5 << 5n) | (imm4_1 << 1n);
  if (imm & 0x1000n) imm |= ~0x1fffn;
  return imm | 0n;
}

/** U-type: imm[31:12] << 12 */
export function operand_imm_u(inst: bigint): bigint {
  return u32(inst) & 0xfffff000n;
}

/** J-type offset, sign-extended */
export function operand_imm_j(inst: bigint): bigint {
  const u = u32(inst);
  const imm20 = (u >> 31n) & 1n;
  const imm19_12 = (u >> 12n) & 0xffn;
  const imm11 = (u >> 20n) & 1n;
  const imm10_1 = (u >> 21n) & 0x3ffn;
  let imm = (imm20 << 20n) | (imm19_12 << 12n) | (imm11 << 11n) | (imm10_1 << 1n);
  if (imm & 0x100000n) imm |= ~0x1fffffn;
  return imm | 0n;
}

/** Low 12 bits of immediate for I-type [31:20] */
export function pack_i_imm12(imm: bigint): bigint {
  return imm & 0xfffn;
}

/** S-type immediate bits OR-mask (excl. opcode, f3, rs1, rs2) */
export function pack_s_imm(imm: bigint): bigint {
  const i = imm & 0xfffn;
  const imm11_5 = (i >> 5n) & 0x7fn;
  const imm4_0 = i & 0x1fn;
  return (imm11_5 << 25n) | (imm4_0 << 7n);
}

/** B-type immediate bits OR-mask (excl. opcode, f3, rs1, rs2); imm LSB must be 0 */
export function pack_b_imm(imm: bigint): bigint {
  const i = imm & 0x1fffn;
  const b12 = (i >> 12n) & 1n;
  const b11 = (i >> 11n) & 1n;
  const b10_5 = (i >> 5n) & 0x3fn;
  const b4_1 = (i >> 1n) & 0xfn;
  return (b12 << 31n) | (b10_5 << 25n) | (b4_1 << 8n) | (b11 << 7n);
}

/** J-type immediate bits OR-mask (excl. opcode, rd); imm LSB must be 0 */
export function pack_j_imm(imm: bigint): bigint {
  const i = imm & 0x1fffffn;
  const b20 = (i >> 20n) & 1n;
  const b19_12 = (i >> 12n) & 0xffn;
  const b11 = (i >> 11n) & 1n;
  const b10_1 = (i >> 1n) & 0x3ffn;
  return (b20 << 31n) | (b10_1 << 21n) | (b11 << 20n) | (b19_12 << 12n);
}

export function reg5(x: bigint): bigint {
  return x & 0x1fn;
}

export function encodeRType(_op: rv_opcode, rd: bigint, rs1: bigint, rs2: bigint): bigint {
  let f3 = 0n;
  let f7 = 0n;
  switch (_op) {
    case rv_opcode.add:
      f3 = 0n;
      f7 = 0n;
      break;
    case rv_opcode.sub:
      f3 = 0n;
      f7 = 0x20n;
      break;
    case rv_opcode.sll:
      f3 = 1n;
      f7 = 0n;
      break;
    case rv_opcode.slt:
      f3 = 2n;
      f7 = 0n;
      break;
    case rv_opcode.sltu:
      f3 = 3n;
      f7 = 0n;
      break;
    case rv_opcode.xor:
      f3 = 4n;
      f7 = 0n;
      break;
    case rv_opcode.srl:
      f3 = 5n;
      f7 = 0n;
      break;
    case rv_opcode.sra:
      f3 = 5n;
      f7 = 0x20n;
      break;
    case rv_opcode.or:
      f3 = 6n;
      f7 = 0n;
      break;
    case rv_opcode.and:
      f3 = 7n;
      f7 = 0n;
      break;
    default:
      return 0n;
  }
  return 0b0110011n | (reg5(rd) << 7n) | (f3 << 12n) | (reg5(rs1) << 15n) | (reg5(rs2) << 20n) | (f7 << 25n);
}

export function encodeIType(op: rv_opcode, rd: bigint, rs1: bigint, imm: bigint): bigint {
  const r = reg5(rd);
  const s1 = reg5(rs1);
  const imm12 = pack_i_imm12(imm) << 20n;

  switch (op) {
    case rv_opcode.jalr:
      return 0b1100111n | (r << 7n) | (s1 << 15n) | imm12;
    case rv_opcode.lb:
      return 0b0000011n | (r << 7n) | (0n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.lh:
      return 0b0000011n | (r << 7n) | (1n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.lw:
      return 0b0000011n | (r << 7n) | (2n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.lbu:
      return 0b0000011n | (r << 7n) | (4n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.lhu:
      return 0b0000011n | (r << 7n) | (5n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.addi:
      return 0b0010011n | (r << 7n) | (0n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.slti:
      return 0b0010011n | (r << 7n) | (2n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.sltiu:
      return 0b0010011n | (r << 7n) | (3n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.xori:
      return 0b0010011n | (r << 7n) | (4n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.ori:
      return 0b0010011n | (r << 7n) | (6n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.andi:
      return 0b0010011n | (r << 7n) | (7n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.slli:
      return 0b0010011n | (r << 7n) | (1n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.srli:
      return 0b0010011n | (r << 7n) | (5n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.srai:
      return 0b0010011n | (r << 7n) | (5n << 12n) | (s1 << 15n) | imm12;
    case rv_opcode.ecall:
      return 0b1110011n | (r << 7n) | (s1 << 15n) | imm12;
    case rv_opcode.ebreak:
      return 0b1110011n | (r << 7n) | (s1 << 15n) | imm12;
    default:
      return 0n;
  }
}

export function encodeSType(op: rv_opcode, rs1: bigint, rs2: bigint, imm: bigint): bigint {
  const s1 = reg5(rs1);
  const s2 = reg5(rs2);
  const bits = pack_s_imm(imm);
  let f3 = 0n;
  switch (op) {
    case rv_opcode.sb:
      f3 = 0n;
      break;
    case rv_opcode.sh:
      f3 = 1n;
      break;
    case rv_opcode.sw:
      f3 = 2n;
      break;
    default:
      return 0n;
  }
  return 0b0100011n | bits | (f3 << 12n) | (s1 << 15n) | (s2 << 20n);
}

export function encodeBType(op: rv_opcode, rs1: bigint, rs2: bigint, imm: bigint): bigint {
  const s1 = reg5(rs1);
  const s2 = reg5(rs2);
  let f3 = 0n;
  switch (op) {
    case rv_opcode.beq:
      f3 = 0n;
      break;
    case rv_opcode.bne:
      f3 = 1n;
      break;
    case rv_opcode.blt:
      f3 = 4n;
      break;
    case rv_opcode.bge:
      f3 = 5n;
      break;
    case rv_opcode.bltu:
      f3 = 6n;
      break;
    case rv_opcode.bgeu:
      f3 = 7n;
      break;
    default:
      return 0n;
  }
  return 0b1100011n | pack_b_imm(imm) | (f3 << 12n) | (s1 << 15n) | (s2 << 20n);
}

export function encodeUType(op: rv_opcode, rd: bigint, imm: bigint): bigint {
  const r = reg5(rd);
  const hi = imm & 0xfffff000n;
  switch (op) {
    case rv_opcode.lui:
      return 0b0110111n | (r << 7n) | hi;
    case rv_opcode.auipc:
      return 0b0010111n | (r << 7n) | hi;
    default:
      return 0n;
  }
}

export function encodeJType(op: rv_opcode, rd: bigint, imm: bigint): bigint {
  if (op !== rv_opcode.jal) return 0n;
  return 0b1101111n | (reg5(rd) << 7n) | pack_j_imm(imm);
}
