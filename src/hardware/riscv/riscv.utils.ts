import { rv_opcode, RV_OPCODE_DATA } from './riscv.const';

export function u32(n: bigint): bigint {
  return n & 0xffffffffn;
}

export function s32(n: bigint): bigint {
  return (n << 32n) >> 32n;
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

/** U-type: imediato de 20 bits em [31:12] da instrução (igual à assembly: lui rd, k). */
export function operand_imm_u(inst: bigint): bigint {
  return (u32(inst) >> 12n) & 0xfffffn;
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

export function encodeRType(op: rv_opcode, rd: bigint, rs1: bigint, rs2: bigint): bigint {
  const opcode = BigInt(RV_OPCODE_DATA[op].opcode || 0);
  if (!opcode) return 0n;

  const funct3 = BigInt(RV_OPCODE_DATA[op].funct3 || 0) << 12n;
  const funct7 = BigInt(RV_OPCODE_DATA[op].funct7 || 0) << 25n;

  return funct7 | (reg5(rs2) << 20n) | (reg5(rs1) << 15n) | funct3 | (reg5(rd) << 7n) | opcode;
}

export function encodeIType(op: rv_opcode, rd: bigint, rs1: bigint, imm: bigint): bigint {
  const imm12 = pack_i_imm12(imm) << 20n;
  const opcode = BigInt(RV_OPCODE_DATA[op].opcode || 0);
  if (!opcode) return 0n;

  const funct3 = BigInt(RV_OPCODE_DATA[op].funct3 || 0) << 12n;

  return opcode | (reg5(rd) << 7n) | funct3 | (reg5(rs1) << 15n) | imm12;
}

export function encodeSType(op: rv_opcode, rs1: bigint, rs2: bigint, imm: bigint): bigint {
  const opcode = BigInt(RV_OPCODE_DATA[op].opcode || 0);
  if (!opcode) return 0n;

  const s1 = reg5(rs1);
  const s2 = reg5(rs2);
  const bits = pack_s_imm(imm);
  const funct3 = BigInt(RV_OPCODE_DATA[op].funct3 || 0);

  return opcode | bits | (funct3 << 12n) | (s1 << 15n) | (s2 << 20n);
}

export function encodeBType(op: rv_opcode, rs1: bigint, rs2: bigint, imm: bigint): bigint {
  const opcode = BigInt(RV_OPCODE_DATA[op].opcode || 0);
  if (!opcode) return 0n;

  const s1 = reg5(rs1);
  const s2 = reg5(rs2);
  const funct3 = BigInt(RV_OPCODE_DATA[op].funct3 || 0);

  return opcode | pack_b_imm(imm) | (funct3 << 12n) | (s1 << 15n) | (s2 << 20n);
}

export function encodeUType(op: rv_opcode, rd: bigint, imm: bigint): bigint {
  const r = reg5(rd);
  const hi = u32((imm & 0xfffffn) << 12n);

  return BigInt(RV_OPCODE_DATA[op].opcode || 0) | (r << 7n) | hi;
}

export function encodeJType(op: rv_opcode, rd: bigint, imm: bigint): bigint {
  if (op !== rv_opcode.jal) return 0n;
  return 0b1101111n | (reg5(rd) << 7n) | pack_j_imm(imm);
}

export function encodeR4Type(op: rv_opcode, rd: bigint, rs1: bigint, rs2: bigint, rs3: bigint, rm: bigint) {
  const opcode = BigInt(RV_OPCODE_DATA[op].opcode || 0);
  if (!opcode) return 0n;

  return (
    (reg5(rs3) << 27n) |
    (0b00n << 25n) |
    (reg5(rs2) << 20n) |
    (reg5(rs1) << 15n) |
    (rm << 12n) |
    (reg5(rd) << 7n) |
    opcode
  );
}

export function toS32(n: bigint): bigint {
  const mod = 1n << 32n;
  let x = ((n % mod) + mod) % mod;
  if (x >= 1n << 31n) x -= mod;
  return x;
}

/** I-type / S-type: imediato de 12 bits com sinal (valor já semântico, não só truncado). */
export function signedImm12Encodeable(imm: bigint): boolean {
  const s = toS32(imm);
  return s >= -2048n && s <= 2047n;
}

/** B-type: offset relativo em bytes, par, 13 bits com sinal (LSB implícito 0). */
export function branchOffsetEncodeable(imm: bigint): boolean {
  const s = toS32(imm);
  if (s % 2n !== 0n) return false;
  return s >= -4096n && s <= 4094n;
}

export function splitHiLoS32(value: bigint): { hi: bigint; lo: bigint } {
  const s32 = toS32(value);
  const raw12 = s32 & 0xfffn;
  const lo = raw12 >= 0x800n ? raw12 - 0x1000n : raw12;
  const hi = ((s32 - lo) >> 12n) & 0xfffffn;
  return { hi, lo };
}
