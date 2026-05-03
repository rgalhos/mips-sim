export enum rv_reg {
  // Aliases:
  x0 = 0,
  x1 = 1,
  x2 = 2,
  x3 = 3,
  x4 = 4,
  x5 = 5,
  x6 = 6,
  x7 = 7,
  x8 = 8,
  x9 = 9,
  x10 = 10,
  x11 = 11,
  x12 = 12,
  x13 = 13,
  x14 = 14,
  x15 = 15,
  x16 = 16,
  x17 = 17,
  x18 = 18,
  x19 = 19,
  x20 = 20,
  x21 = 21,
  x22 = 22,
  x23 = 23,
  x24 = 24,
  x25 = 25,
  x26 = 26,
  x27 = 27,
  x28 = 28,
  x29 = 29,
  x30 = 30,
  x31 = 31,

  zero = 0,
  ra = 1,
  sp = 2,
  gp = 3,
  tp = 4,
  t0 = 5,
  t1 = 6,
  t2 = 7,
  s0 = 8,
  s1 = 9,
  a0 = 10,
  a1 = 11,
  a2 = 12,
  a3 = 13,
  a4 = 14,
  a5 = 15,
  a6 = 16,
  a7 = 17,
  s2 = 18,
  s3 = 19,
  s4 = 20,
  s5 = 21,
  s6 = 22,
  s7 = 23,
  s8 = 24,
  s9 = 25,
  s10 = 26,
  s11 = 27,
  t3 = 28,
  t4 = 29,
  t5 = 30,
  t6 = 31,
}

export enum rv_codec {
  illegal,
  r,
  i,
  s,
  b,
  j,
  u,
}

export enum rv_opcode {
  illegal,
  lui,
  auipc,
  jal,
  jalr,
  beq,
  bne,
  blt,
  bge,
  bltu,
  bgeu,
  lb,
  lh,
  lw,
  lbu,
  lhu,
  sb,
  sh,
  sw,
  addi,
  slti,
  sltiu,
  xori,
  ori,
  andi,
  slli,
  srli,
  srai,
  add,
  sub,
  sll,
  slt,
  sltu,
  xor,
  srl,
  sra,
  or,
  and,
  fence,
  ecall,
  ebreak,
}

// https://www.scribd.com/document/854447210/RISC-V-Pseudo-Instructions
export enum rv_opcode_pseudo {
  nop, // addi zero, zero, 0
  la, // auipc rd, symbol[31:12] + addi rd, rd, symbol[11:0]
  li,
  j, // jal zero, offset
  jump, // jump offset, rt -> auipc rt, offset[31:12] + jalr x0, offset[11:0](rt)
  mv, // addi rd, rs1, 0
  not, // xori rd, rs1, -1
  neg, // sub rd, zero, rs1
  seqz, // sltiu rd, rs1, 1
  snez, // sltu rd, zero, rs1
  sltz, // slt rd, rs1, zero
  sgtz, // slt rd, zero, rs1
  beqz, // beq rs1, zero, offset
  bnez, // bne rs1, zero, offset
  blez, // bge zero, rs1, offset
  bgez, // bge rs1, zero, offset
  bltz, // blt zero, rs1, offset
  bgtz, // blt zero, rs1, offset
  bgt, // blt rs1, zero, offset
  call, // call offset -> auipc ra, %hi(offset) + jalr %lo(offset)(ra) // call rt, offset -> auipc rt, %hi(offset) + jalr %lo(offset)(rt)
  ret, // jalr zero, ra, 0
}

export enum rv_directives {
  '.org',
  '.byte',
  '.half',
  '.word',
  '.ascii',
  '.asciz',
  '.string',
  '.space',
  '.option',
  '.data',
  '.text',
  '.bss',
  '.rodata',
  '%hi',
  '%lo',
  '%pcrel_hi',
  '%pcrel_lo',
}

export const enum rv_syscalls {
  syscall_print_int = 10,
  syscall_print_string = 11,
  syscall_print_char = 12,
  syscall_update_screen = 20,
  syscall_clear_screen = 21,
}

export const enum rv_worker_commands {
  NONE = 0,
  SYNC_LISTENERS = 1 << 0,
  UPDATE_FRAMEBUFFER = 1 << 1,
  PRINT_STRING = 1 << 2,
}

export const RV_CODEC_FORMAT = {
  [rv_codec.r]: 'O d, 1, 2',
  [rv_codec.i]: 'O d, 1, i',
  [rv_codec.s]: 'O i, 1, 2',
  [rv_codec.b]: 'O 1, 2, X',
  [rv_codec.j]: 'O d, x',
  [rv_codec.u]: 'O d, j',
} as const;

// É imprescindível que os elementos de RV_OPCODE_DATA estejam na mesma ordem que os do enum rv_opcode
export const RV_OPCODE_DATA = [
  { name: 'illegal', codec: rv_codec.illegal, format: 'ILLEGAL', opcode: 0, funct3: null, funct7: null },
  { name: 'lui',     codec: rv_codec.u, format: RV_CODEC_FORMAT[rv_codec.u], opcode: 0b0110111, funct3: null, funct7: null },
  { name: 'auipc',   codec: rv_codec.u, format: RV_CODEC_FORMAT[rv_codec.u], opcode: 0b0010111, funct3: null, funct7: null },
  { name: 'jal',     codec: rv_codec.j, format: RV_CODEC_FORMAT[rv_codec.j], opcode: 0b1101111, funct3: null, funct7: null },
  { name: 'jalr',    codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b1100111, funct3: 0b000, funct7: null },
  { name: 'beq',     codec: rv_codec.b, format: RV_CODEC_FORMAT[rv_codec.b], opcode: 0b1100011, funct3: 0b000, funct7: null },
  { name: 'bne',     codec: rv_codec.b, format: RV_CODEC_FORMAT[rv_codec.b], opcode: 0b1100011, funct3: 0b001, funct7: null },
  { name: 'blt',     codec: rv_codec.b, format: RV_CODEC_FORMAT[rv_codec.b], opcode: 0b1100011, funct3: 0b100, funct7: null },
  { name: 'bge',     codec: rv_codec.b, format: RV_CODEC_FORMAT[rv_codec.b], opcode: 0b1100011, funct3: 0b101, funct7: null },
  { name: 'bltu',    codec: rv_codec.b, format: RV_CODEC_FORMAT[rv_codec.b], opcode: 0b1100011, funct3: 0b110, funct7: null },
  { name: 'bgeu',    codec: rv_codec.b, format: RV_CODEC_FORMAT[rv_codec.b], opcode: 0b1100011, funct3: 0b111, funct7: null },
  { name: 'lb',      codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0000011, funct3: 0b000, funct7: null },
  { name: 'lh',      codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0000011, funct3: 0b001, funct7: null },
  { name: 'lw',      codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0000011, funct3: 0b010, funct7: null },
  { name: 'lbu',     codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0000011, funct3: 0b100, funct7: null },
  { name: 'lhu',     codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0000011, funct3: 0b101, funct7: null },
  { name: 'sb',      codec: rv_codec.s, format: RV_CODEC_FORMAT[rv_codec.s], opcode: 0b0100011, funct3: 0b000, funct7: null },
  { name: 'sh',      codec: rv_codec.s, format: RV_CODEC_FORMAT[rv_codec.s], opcode: 0b0100011, funct3: 0b001, funct7: null },
  { name: 'sw',      codec: rv_codec.s, format: RV_CODEC_FORMAT[rv_codec.s], opcode: 0b0100011, funct3: 0b010, funct7: null },
  { name: 'addi',    codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0010011, funct3: 0b000, funct7: null },
  { name: 'slti',    codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0010011, funct3: 0b010, funct7: null },
  { name: 'sltiu',   codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0010011, funct3: 0b011, funct7: null },
  { name: 'xori',    codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0010011, funct3: 0b100, funct7: null },
  { name: 'ori',     codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0010011, funct3: 0b110, funct7: null },
  { name: 'andi',    codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0010011, funct3: 0b111, funct7: null },
  { name: 'slli',    codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0010011, funct3: 0b001, funct7: 0b0000000 },
  { name: 'srli',    codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0010011, funct3: 0b101, funct7: 0b0000000 },
  { name: 'srai',    codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b0010011, funct3: 0b101, funct7: 0b0100000 },
  { name: 'add',     codec: rv_codec.r, format: RV_CODEC_FORMAT[rv_codec.r], opcode: 0b0110011, funct3: 0b000, funct7: 0b0000000 },
  { name: 'sub',     codec: rv_codec.r, format: RV_CODEC_FORMAT[rv_codec.r], opcode: 0b0110011, funct3: 0b000, funct7: 0b0100000 },
  { name: 'sll',     codec: rv_codec.r, format: RV_CODEC_FORMAT[rv_codec.r], opcode: 0b0110011, funct3: 0b001, funct7: 0b0000000 },
  { name: 'slt',     codec: rv_codec.r, format: RV_CODEC_FORMAT[rv_codec.r], opcode: 0b0110011, funct3: 0b010, funct7: 0b0000000 },
  { name: 'sltu',    codec: rv_codec.r, format: RV_CODEC_FORMAT[rv_codec.r], opcode: 0b0110011, funct3: 0b011, funct7: 0b0000000 },
  { name: 'xor',     codec: rv_codec.r, format: RV_CODEC_FORMAT[rv_codec.r], opcode: 0b0110011, funct3: 0b100, funct7: 0b0000000 },
  { name: 'srl',     codec: rv_codec.r, format: RV_CODEC_FORMAT[rv_codec.r], opcode: 0b0110011, funct3: 0b101, funct7: 0b0000000 },
  { name: 'sra',     codec: rv_codec.r, format: RV_CODEC_FORMAT[rv_codec.r], opcode: 0b0110011, funct3: 0b101, funct7: 0b0100000 },
  { name: 'or',      codec: rv_codec.r, format: RV_CODEC_FORMAT[rv_codec.r], opcode: 0b0110011, funct3: 0b110, funct7: 0b0000000 },
  { name: 'and',     codec: rv_codec.r, format: RV_CODEC_FORMAT[rv_codec.r], opcode: 0b0110011, funct3: 0b111, funct7: 0b0000000 },
  { name: 'fence',   codec: rv_codec.u, format: 'todo', opcode: 0b0001111, funct3: 0b000, funct7: null },
  { name: 'ecall',   codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b1110011, funct3: 0b000, funct7: null },
  { name: 'ebreak',  codec: rv_codec.i, format: RV_CODEC_FORMAT[rv_codec.i], opcode: 0b1110011, funct3: 0b000, funct7: null },
];
