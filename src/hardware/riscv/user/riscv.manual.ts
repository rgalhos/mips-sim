import { IUserManual } from '../../common/manual';

export const rvManual: IUserManual = {
  instructions: [
    // RV32I
    { name: 'lui', operation: 'rd = imm << 12', usage: 'rd, imm', description: 'Loads the upper 20 bits of rd with imm and clears the low 12 bits.' },
    { name: 'auipc', operation: 'rd = pc + (imm << 12)', usage: 'rd, imm', description: 'Adds the PC-aligned upper immediate to the program counter and stores the result in rd.' },
    { name: 'jal', operation: 'rd = pc + 4; pc = pc + offset', usage: 'rd, offset', description: 'Jumps to pc + offset and stores the return address (pc + 4) in rd.' },
    { name: 'jalr', operation: 'rd = pc + 4; pc = rs1 + imm', usage: 'rd, rs1, imm', description: 'Jumps to rs1 + immediate with least bit cleared; stores return address in rd.' },
    { name: 'beq', operation: 'if (rs1 == rs2) pc += offset', usage: 'rs1, rs2, offset', description: 'Branches if rs1 equals rs2.' },
    { name: 'bne', operation: 'if (rs1 != rs2) pc += offset', usage: 'rs1, rs2, offset', description: 'Branches if rs1 does not equal rs2.' },
    { name: 'blt', operation: 'if (rs1 < rs2) pc += offset', usage: 'rs1, rs2, offset', description: 'Branches if rs1 is less than rs2, signed compare.' },
    { name: 'bge', operation: 'if (rs1 >= rs2) pc += offset', usage: 'rs1, rs2, offset', description: 'Branches if rs1 is greater than or equal to rs2, signed compare.' },
    { name: 'bltu', operation: 'if (rs1 < rs2) pc += offset', usage: 'rs1, rs2, offset', description: 'Branches if rs1 is less than rs2, unsigned compare.' },
    { name: 'bgeu', operation: 'if (rs1 >= rs2) pc += offset', usage: 'rs1, rs2, offset', description: 'Branches if rs1 is greater than or equal to rs2, unsigned compare.' },
    { name: 'lb', operation: 'rd = sign_extend8(mem[rs1 + imm])', usage: 'rd, imm(rs1)', description: 'Loads a signed byte from memory into rd.' },
    { name: 'lh', operation: 'rd = sign_extend16(mem[rs1 + imm])', usage: 'rd, imm(rs1)', description: 'Loads a signed halfword from memory into rd.' },
    { name: 'lw', operation: 'rd = mem[rs1 + imm]', usage: 'rd, imm(rs1)', description: 'Loads a word from memory into rd.' },
    { name: 'lbu', operation: 'rd = zero_extend(mem[rs1 + imm])', usage: 'rd, imm(rs1)', description: 'Loads an unsigned byte from memory into rd.' },
    { name: 'lhu', operation: 'rd = zero_extend(mem[rs1 + imm])', usage: 'rd, imm(rs1)', description: 'Loads an unsigned halfword from memory into rd.' },
    { name: 'sb', operation: 'mem[rs1 + imm] = byte(rs2)', usage: 'rs2, imm(rs1)', description: 'Stores the low byte of rs2 to memory.' },
    { name: 'sh', operation: 'mem[rs1 + imm] = half(rs2)', usage: 'rs2, imm(rs1)', description: 'Stores the low halfword of rs2 to memory.' },
    { name: 'sw', operation: 'mem[rs1 + imm] = rs2', usage: 'rs2, imm(rs1)', description: 'Stores the word in rs2 to memory.' },
    { name: 'addi', operation: 'rd = rs1 + imm', usage: 'rd, rs1, imm', description: 'Adds rs1 and the sign-extended immediate and stores the sum in rd.' },
    { name: 'slti', operation: 'rd = (rs1 < imm) ? 1 : 0', usage: 'rd, rs1, imm', description: 'Sets rd to 1 if rs1 is less than the immediate, signed; otherwise 0.' },
    { name: 'sltiu', operation: 'rd = (rs1 < imm) ? 1 : 0', usage: 'rd, rs1, imm', description: 'Sets rd to 1 if rs1 is less than the immediate, unsigned; otherwise 0.' },
    { name: 'xori', operation: 'rd = rs1 ^ imm', usage: 'rd, rs1, imm', description: 'Bitwise XOR of rs1 and the sign-extended immediate into rd.' },
    { name: 'ori', operation: 'rd = rs1 | imm', usage: 'rd, rs1, imm', description: 'Bitwise OR of rs1 and the sign-extended immediate into rd.' },
    { name: 'andi', operation: 'rd = rs1 & imm', usage: 'rd, rs1, imm', description: 'Bitwise AND of rs1 and the sign-extended immediate into rd.' },
    { name: 'slli', operation: 'rd = rs1 << shamt', usage: 'rd, rs1, imm', description: 'Logical left shift of rs1 by immediate shift amount into rd.' },
    { name: 'srli', operation: 'rd = rs1 >> shamt', usage: 'rd, rs1, imm', description: 'Logical right shift of rs1 by immediate shift amount into rd.' },
    { name: 'srai', operation: 'rd = rs1 >>> shamt', usage: 'rd, rs1, imm', description: 'Arithmetic right shift of rs1 by immediate shift amount into rd.' },
    { name: 'add', operation: 'rd = rs1 + rs2', usage: 'rd, rs1, rs2', description: 'Adds rs1 and rs2 and stores the result in rd.' },
    { name: 'sub', operation: 'rd = rs1 - rs2', usage: 'rd, rs1, rs2', description: 'Subtracts rs2 from rs1 and stores the result in rd.' },
    { name: 'sll', operation: 'rd = rs1 << rs2[4:0]', usage: 'rd, rs1, rs2', description: 'Logical left shift of rs1 by the low 5 bits of rs2 into rd.' },
    { name: 'slt', operation: 'rd = (rs1 < rs2) ? 1 : 0', usage: 'rd, rs1, rs2', description: 'Sets rd to 1 if rs1 is less than rs2, signed; otherwise 0.' },
    { name: 'sltu', operation: 'rd = (rs1 < rs2) ? 1 : 0', usage: 'rd, rs1, rs2', description: 'Sets rd to 1 if rs1 is less than rs2, unsigned; otherwise 0.' },
    { name: 'xor', operation: 'rd = rs1 ^ rs2', usage: 'rd, rs1, rs2', description: 'Bitwise XOR of rs1 and rs2 into rd.' },
    { name: 'srl', operation: 'rd = rs1 >> rs2[4:0]', usage: 'rd, rs1, rs2', description: 'Logical right shift of rs1 by the low 5 bits of rs2 into rd.' },
    { name: 'sra', operation: 'rd = rs1 >> rs2[4:0]', usage: 'rd, rs1, rs2', description: 'Arithmetic right shift of rs1 by the low 5 bits of rs2 into rd.' },
    { name: 'or', operation: 'rd = rs1 | rs2', usage: 'rd, rs1, rs2', description: 'Bitwise OR of rs1 and rs2 into rd.' },
    { name: 'and', operation: 'rd = rs1 & rs2', usage: 'rd, rs1, rs2', description: 'Bitwise AND of rs1 and rs2 into rd.' },
    // { name: 'fence', operation: 'fence pred, succ', description: 'Orders memory accesses; predecessor and successor sets control visible ordering among loads and stores.' },
    { name: 'ecall', operation: 'syscall / env call', usage: '', description: 'Raises an environment-call exception to invoke the execution environment.' },
    { name: 'ebreak', operation: 'breakpoint', usage: '', description: 'Raises a breakpoint exception for debuggers.' },

    // RV32M
    { name: 'mul', operation: 'rd = low32(s32(rs1) * s32(rs2))', usage: 'rd, rs1, rs2', description: 'Low 32 bits of the two\'s-complement product of rs1 and rs2 (signed times signed).' },
    { name: 'mulh', operation: 'rd = high32(s32(rs1) * s32(rs2))', usage: 'rd, rs1, rs2', description: 'High 32 bits of the 64-bit two\'s-complement product of rs1 and rs2 (signed times signed).' },
    { name: 'mulhsu', operation: 'rd = high32(s32(rs1) * u32(rs2))', usage: 'rd, rs1, rs2', description: 'High 32 bits of the 64-bit product: rs1 signed, rs2 unsigned.' },
    { name: 'mulhu', operation: 'rd = high32(u32(rs1) * u32(rs2))', usage: 'rd, rs1, rs2', description: 'High 32 bits of the 64-bit product of rs1 and rs2 as unsigned values.' },
    { name: 'div', operation: 'rd = s32(rs1) / s32(rs2)', usage: 'rd, rs1, rs2', description: 'Signed division of rs1 by rs2, rounding toward zero. If rs2 is 0, rd is all ones; if rs1 is INT_MIN and rs2 is -1, rd is INT_MIN (per RISC-V M extension).' },
    { name: 'divu', operation: 'rd = u32(rs1) / u32(rs2)', usage: 'rd, rs1, rs2', description: 'Unsigned division of rs1 by rs2. If rs2 is 0, rd is all ones (per RISC-V M extension).' },
    { name: 'rem', operation: 'rd = s32(rs1) % s32(rs2)', usage: 'rd, rs1, rs2', description: 'Signed remainder of rs1 divided by rs2 (same sign convention as div). If rs2 is 0, rd is rs1; if rs1 is INT_MIN and rs2 is -1, rd is 0.' },
    { name: 'remu', operation: 'rd = u32(rs1) % u32(rs2)', usage: 'rd, rs1, rs2', description: 'Unsigned remainder of rs1 divided by rs2. If rs2 is 0, rd is rs1 (per RISC-V M extension).' },

    // RV32F
    { name: 'flw', operation: 'fd = mem[rs1 + imm]', usage: 'fd, imm(rs1)', description: 'Loads a word from memory into fd.' },
    { name: 'fsw',       operation: 'mem[rs1 + imm] = fd', usage: 'fd, imm(rs1)', description: 'Stores the low 32 bits of the floating-point value in fd to memory.' },
    { name: 'fmadd.s',   operation: 'fd = (fs1 * fs2) + fs3', usage: 'fd, fs1, fs2, fs3, rm', description: 'Single-Precision Fused Multiply-Add; Multiplies the values in fs1 and fs2, adds the value in fs3, and writes the final result to fd.' },
    { name: 'fmsub.s',   operation: 'fd = (fs1 * fs2) - fs3', usage: 'fd, fs1, fs2, fs3, rm', description: 'Single-Precision Fused Multiply-Add; Multiplies the values in fs1 and fs2, subtracts the value in fs3, and writes the final result to fd.' },
    { name: 'fnmsub.s',  operation: 'fd = -(fs1 * fs2) + fs3', usage: 'fd, fs1, fs2, fs3, rm', description: 'Single-Precision Fused Negate-Multiply-Subtract; Multiplies the values in fs1 and fs2, negates the product, adds the value in fs3, and writes the final result to fd.' },
    { name: 'fnmadd.s',  operation: 'fd = -(fs1 * fs2) - fs3', usage: 'fd, fs1, fs2, fs3, rm', description: 'Single-Precision Fused Negate-Multiply-Add; Multiplies the values in fs1 and fs2, negates the product, subtracts the value in fs3, and writes the final result to fd.' },
    { name: 'fadd.s',    operation: 'fd = fs1 + fs2', usage: 'fd, fs1, fs2, rm', description: 'Performs single-precision floating-point addition of fs1 and fs2 and writes the final result to fd.' },
    { name: 'fsub.s',    operation: 'fd = fs1 - fs2', usage: 'fd, fs1, fs2, rm', description: 'Performs single-precision floating-point subtraction of fs1 and fs2 and writes the final result to fd.' },
    { name: 'fmul.s',    operation: 'fd = fs1 * fs2', usage: 'fd, fs1, fs2, rm', description: 'Performs single-precision floating-point multiplication of fs1 and fs2 and writes the final result to fd.' },
    { name: 'fdiv.s',    operation: 'fd = fs1 / fs2', usage: 'fd, fs1, fs2, rm', description: 'Performs single-precision floating-point division of fs1 by fs2 and writes the final result to fd.' },
    { name: 'fsqrt.s',   operation: 'fd = sqrt(fs1)', usage: 'fd, fs1, rm', description: 'Performs single-precision floating-point square root of fs1 and writes the final result to fd.' },
    { name: 'fsgnj.s',   operation: 'fd = fs2[31] fs1[30:0]', usage: 'fd, fs1, fs2', description: 'Sign-Inject Single-Precision; Takes all bits except the sign bit from fs1. The result\'s sign bit is taken from fs2\'s sign bit, and the result is written to the destination register fd.' },
    { name: 'fsgnjn.s',  operation: 'fd = ~fs2[31] fs1[30:0]', usage: 'fd, fs1, fs2', description: 'Sign-Inject Negate Single-Precision; Takes all bits except the sign bit from fs1. The result\'s sign bit is opposite of fs2\'s sign bit, and the result is written to the destination register fd.' },
    { name: 'fsgnjx.s',  operation: 'fd = fs1[31] ^ fs2[31] fs1[30:0]', usage: 'fd, fs1, fs2', description: 'Sign-Inject Exclusive-Or Single-Precision; Takes all bits except the sign bit from fs1. The result\'s sign bit is the exclusive-or of fs1\'s and fs2\'s sign bits, and the result is written to the destination register fd.' },
    { name: 'fmin.s',    operation: 'fd = min(fs1, fs2)', usage: 'fd, fs1, fs2', description: 'Writes smaller of fs1 and fs2 to fd.' },
    { name: 'fmax.s',    operation: 'fd = max(fs1, fs2)', usage: 'fd, fs1, fs2', description: 'Writes larger of fs1 and fs2 to fd.' },
    { name: 'fcvt.w.s',  operation: 'rd = f32_to_i32(fs1, rm)', usage: 'rd, fs1, rm', description: 'Convert Single-Precision to Word; Converts a floating-point number in floating-point register fs1 to a signed 32-bit integer in integer register rd.' },
    { name: 'fcvt.wu.s', operation: 'rd = f32_to_u32(fs1, rm)', usage: 'rd, fs1, rm', description: 'Convert Single-Precision to Unsigned Word; Converts a floating-point number in floating-point register fs1 to an unsigned 32-bit integer in integer register rd.' },
    { name: 'fmv.x.w',   operation: 'rd = fs1', usage: 'rd, fs1', description: 'Move Single-Precision Word to Integer Register; Moves the single-precision value in floating-point register fs1 represented in IEEE 754-2008 encoding to the lower 32 bits of integer register rd. The bits are not modified in the transfer.' },
    { name: 'feq.s',     operation: 'rd = (fs1 == fs2) ? 1 : 0', usage: 'rd, fs1, fs2', description: 'Equal Single-Precision; Writes 1 to rd if fs1 and fs2 are equal, and 0 otherwise. If either operand is NaN, the result is 0 (not equal). Positive zero is considered equal to negative zero.' },
    { name: 'flt.s',     operation: 'rd = (f1 < fs2) ? 1 : 0', usage: 'rd, fs1, fs2', description: 'Less Than Single-Precision; Writes 1 to rd if fs1 is less than fs2, and 0 otherwise. If either operand is NaN, the result is 0 (not equal).' },
    { name: 'fle.s',     operation: 'rd = (f1 <= f2) ? 1 : 0', usage: 'rd, fs1, fs2', description: 'Less Than or Equal Single-Precision; Writes 1 to rd if fs1 is less than or equal to fs2, and 0 otherwise. If either operand is NaN, the result is 0 (not equal). Positive zero and negative zero are considered equal.' },
    { name: 'fclass.s',  operation: '', usage: 'rd, fs1', description: 'Classify Single-Precision; Examines the value in floating-point register fs1 and writes to integer register rd a 10-bit mask that indicates the class of the floating-point number.\n\nPlease refer to the [manual](https://riscv.github.io/riscv-unified-db/manual/html/isa/isa_20240411/insts/fclass.s.html) for more details.' },
    { name: 'fcvt.s.w',  operation: 'fd = i32_to_f32(fs1, rm)', usage: 'fd, rs1, rm', description: 'Convert Word to Single-Precision; Converts a 32-bit signed integer in integer register xs1 into a floating-point number in floating-point register fd.\n\nA floating-point register can be initialized to floating-point positive zero using `fcvt.s.w fd, x0`.' },
    { name: 'fcvt.s.wu', operation: 'fd = u32_to_f32(fs1, rm)', usage: 'fd, rs1, rm', description: 'Convert Unsigned Word to Single-Precision; Converts a 32-bit unsigned integer in integer register xs1 into a floating-point number in floating-point register fd.' },
    { name: 'fmv.w.x',   operation: 'fd = rs1', usage: 'fd, rs1', description: 'Move Single-Precision Word from Integer Register; Moves the single-precision value encoded in IEEE 754-2008 standard encoding from the lower 32 bits of integer register xs1 to the floating-point register fd. The bits are not modified in the transfer.' },

    // Pseudo-instructions
    { name: 'nop', operation: '—', usage: '', description: '**(pseudoinstruction)** No operation; expands to addi with zero effect.' },
    { name: 'la', operation: 'rd = symbol address', usage: 'rd, label', description: '**(pseudoinstruction)** Loads the absolute address of a symbol into rd (typically auipc + addi).' },
    { name: 'li', operation: 'rd = immediate', usage: 'rd, imm', description: '**(pseudoinstruction)** Loads a constant immediate into rd using the shortest instruction sequence.' },
    { name: 'j', operation: 'pc = pc + offset', usage: 'offset', description: '**(pseudoinstruction)** Unconditional jump; expands to jal with a discarded link register.' },
    { name: 'jump', operation: 'pc = pc + offset', usage: 'offset', description: '**(pseudoinstruction)** PC-relative long jump via auipc into a scratch register and jalr.' },
    { name: 'mv', operation: 'rd = rs1', usage: 'rd, rs1', description: '**(pseudoinstruction)** Copies the value of rs1 into rd.' },
    { name: 'not', operation: 'rd = ~rs1', usage: 'rd, rs1', description: '**(pseudoinstruction)** Bitwise NOT of rs1 into rd.' },
    { name: 'neg', operation: 'rd = -rs1', usage: 'rd, rs1', description: '**(pseudoinstruction)** Two\'s complement negation of rs1 into rd.' },
    { name: 'seqz', operation: 'rd = (rs1 == 0) ? 1 : 0', usage: 'rd, rs1', description: '**(pseudoinstruction)** Sets rd to 1 if rs1 is zero, else 0.' },
    { name: 'snez', operation: 'rd = (rs1 != 0) ? 1 : 0', usage: 'rd, rs1', description: '**(pseudoinstruction)** Sets rd to 1 if rs1 is non-zero, else 0.' },
    { name: 'sltz', operation: 'rd = (rs1 < 0) ? 1 : 0', usage: 'rd, rs1', description: '**(pseudoinstruction)** Sets rd to 1 if rs1 is negative, else 0.' },
    { name: 'sgtz', operation: 'rd = (rs1 > 0) ? 1 : 0', usage: 'rd, rs1', description: '**(pseudoinstruction)** Sets rd to 1 if rs1 is positive, else 0.' },
    { name: 'beqz', operation: 'if (rs1 == 0) pc += offset', usage: 'rs1, offset', description: '**(pseudoinstruction)** Branches if rs1 is zero.' },
    { name: 'bnez', operation: 'if (rs1 != 0) pc += offset', usage: 'rs1, offset', description: '**(pseudoinstruction)** Branches if rs1 is non-zero.' },
    { name: 'blez', operation: 'if (rs1 <= 0) pc += offset', usage: 'rs1, rs2, offset', description: '**(pseudoinstruction)** Branches if rs1 is less than or equal to zero, signed.' },
    { name: 'bgez', operation: 'if (rs1 >= 0) pc += offset', usage: 'rs1, rs2, offset', description: '**(pseudoinstruction)** Branches if rs1 is greater than or equal to zero, signed.' },
    { name: 'bltz', operation: 'if (rs1 < 0) pc += offset', usage: 'rs1, rs2, offset', description: '**(pseudoinstruction)** Branches if rs1 is negative, signed.' },
    { name: 'bgtz', operation: 'if (rs1 > 0) pc += offset', usage: 'rs1, rs2, offset', description: '**(pseudoinstruction)** Branches if rs1 is positive, signed.' },
    { name: 'bgt', operation: 'if (rs1 > rs2) pc += offset', usage: 'rs1, rs2, offset', description: '**(pseudoinstruction)** Branches if rs1 is greater than rs2, signed (typically via reversed blt).' },
    { name: 'ret', operation: 'pc = ra', usage: '', description: '**(pseudoinstruction)** Returns from a subroutine using the address in ra.' },
  ],
  registers: [
    { name: 'x0', alias: 'zero', kind: 'constant', description: '**x0** — Hardwired zero (alias **zero**); reads always return 0.' },
    { name: 'x1', alias: 'ra', kind: 'link', description: '**x1** — Return address (alias **ra**); holds the link value for jal/jalr.' },
    { name: 'x2', alias: 'sp', kind: 'pointer', description: '**x2** — Stack pointer (alias **sp**); points to the current stack top.' },
    { name: 'x3', alias: 'gp', kind: 'pointer', description: '**x3** — Global pointer (alias **gp**); points near static data for efficient addressing.' },
    { name: 'x4', alias: 'tp', kind: 'pointer', description: '**x4** — Thread pointer (alias **tp**); TLS or runtime thread-local base.' },
    { name: 'x5', alias: 't0', kind: 'temporary', description: '**x5** — Temporary (alias **t0**); caller-saved scratch.' },
    { name: 'x6', alias: 't1', kind: 'temporary', description: '**x6** — Temporary (alias **t1**); caller-saved scratch.' },
    { name: 'x7', alias: 't2', kind: 'temporary', description: '**x7** — Temporary (alias **t2**); caller-saved scratch.' },
    { name: 'x8', alias: 's0', kind: 'saved', description: '**x8** — Saved register / frame pointer (alias **s0**); callee-saved.' },
    { name: 'x9', alias: 's1', kind: 'saved', description: '**x9** — Saved register (alias **s1**); callee-saved.' },
    { name: 'x10', alias: 'a0', kind: 'argument', description: '**x10** — Argument / return (alias **a0**); first argument or return value.' },
    { name: 'x11', alias: 'a1', kind: 'argument', description: '**x11** — Argument / return (alias **a1**); second argument or return value.' },
    { name: 'x12', alias: 'a2', kind: 'argument', description: '**x12** — Argument (alias **a2**); third argument.' },
    { name: 'x13', alias: 'a3', kind: 'argument', description: '**x13** — Argument (alias **a3**); fourth argument.' },
    { name: 'x14', alias: 'a4', kind: 'argument', description: '**x14** — Argument (alias **a4**); fifth argument.' },
    { name: 'x15', alias: 'a5', kind: 'argument', description: '**x15** — Argument (alias **a5**); sixth argument.' },
    { name: 'x16', alias: 'a6', kind: 'argument', description: '**x16** — Argument (alias **a6**); seventh argument.' },
    { name: 'x17', alias: 'a7', kind: 'argument', description: '**x17** — Argument (alias **a7**); eighth argument.' },
    { name: 'x18', alias: 's2', kind: 'saved', description: '**x18** — Saved register (alias **s2**); callee-saved.' },
    { name: 'x19', alias: 's3', kind: 'saved', description: '**x19** — Saved register (alias **s3**); callee-saved.' },
    { name: 'x20', alias: 's4', kind: 'saved', description: '**x20** — Saved register (alias **s4**); callee-saved.' },
    { name: 'x21', alias: 's5', kind: 'saved', description: '**x21** — Saved register (alias **s5**); callee-saved.' },
    { name: 'x22', alias: 's6', kind: 'saved', description: '**x22** — Saved register (alias **s6**); callee-saved.' },
    { name: 'x23', alias: 's7', kind: 'saved', description: '**x23** — Saved register (alias **s7**); callee-saved.' },
    { name: 'x24', alias: 's8', kind: 'saved', description: '**x24** — Saved register (alias **s8**); callee-saved.' },
    { name: 'x25', alias: 's9', kind: 'saved', description: '**x25** — Saved register (alias **s9**); callee-saved.' },
    { name: 'x26', alias: 's10', kind: 'saved', description: '**x26** — Saved register (alias **s10**); callee-saved.' },
    { name: 'x27', alias: 's11', kind: 'saved', description: '**x27** — Saved register (alias **s11**); callee-saved.' },
    { name: 'x28', alias: 't3', kind: 'temporary', description: '**x28** — Temporary (alias **t3**); caller-saved scratch.' },
    { name: 'x29', alias: 't4', kind: 'temporary', description: '**x29** — Temporary (alias **t4**); caller-saved scratch.' },
    { name: 'x30', alias: 't5', kind: 'temporary', description: '**x30** — Temporary (alias **t5**); caller-saved scratch.' },
    { name: 'x31', alias: 't6', kind: 'temporary', description: '**x31** — Temporary (alias **t6**); caller-saved scratch.' },
    { name: 'f0', alias: 'ft0', kind: 'temporary', description: '**f0** — Floating-point temporary register (alias **ft0**); caller-saved scratch' },
    { name: 'f1', alias: 'ft1', kind: 'temporary', description: '**f1** — Floating-point temporary register (alias **ft1**); caller-saved scratch' },
    { name: 'f2', alias: 'ft2', kind: 'temporary', description: '**f2** — Floating-point temporary register (alias **ft2**); caller-saved scratch' },
    { name: 'f3', alias: 'ft3', kind: 'temporary', description: '**f3** — Floating-point temporary register (alias **ft3**); caller-saved scratch' },
    { name: 'f4', alias: 'ft4', kind: 'temporary', description: '**f4** — Floating-point temporary register (alias **ft4**); caller-saved scratch' },
    { name: 'f5', alias: 'ft5', kind: 'temporary', description: '**f5** — Floating-point temporary register (alias **ft5**); caller-saved scratch' },
    { name: 'f6', alias: 'ft6', kind: 'temporary', description: '**f6** — Floating-point temporary register (alias **ft6**); caller-saved scratch' },
    { name: 'f7', alias: 'ft7', kind: 'temporary', description: '**f7** — Floating-point temporary register (alias **ft7**); caller-saved scratch' },
    { name: 'f8', alias: 'fs0', kind: 'saved', description: '**f8** — Floating-point saved register (alias **fs0**); callee-saved' },
    { name: 'f9', alias: 'fs1', kind: 'saved', description: '**f9** — Floating-point saved register (alias **fs1**); callee-saved' },
    { name: 'f10', alias: 'fa0', kind: 'argument', description: '**f10** — Floating-point argument / return (alias **fa0**); first argument or return value.'},
    { name: 'f11', alias: 'fa1', kind: 'argument', description: '**f11** — Floating-point argument / return (alias **fa1**); second argument or return value.'},
    { name: 'f12', alias: 'fa2', kind: 'argument', description: '**f12** — Floating-point argument (alias **fa2**); third argument.' },
    { name: 'f13', alias: 'fa3', kind: 'argument', description: '**f13** — Floating-point argument (alias **fa3**); fourth argument.' },
    { name: 'f14', alias: 'fa4', kind: 'argument', description: '**f14** — Floating-point argument (alias **fa4**); fifth argument.' },
    { name: 'f15', alias: 'fa5', kind: 'argument', description: '**f15** — Floating-point argument (alias **fa5**); sixth argument.' },
    { name: 'f16', alias: 'fa6', kind: 'argument', description: '**f16** — Floating-point argument (alias **fa6**); seventh argument.' },
    { name: 'f17', alias: 'fa7', kind: 'argument', description: '**f17** — Floating-point argument (alias **fa7**); eighth argument.'},
    { name: 'f18', alias: 'fs2', kind: 'saved', description: '**f18** — Floating-point saved register (alias **fs2**); callee-saved' },
    { name: 'f19', alias: 'fs3', kind: 'saved', description: '**f19** — Floating-point saved register (alias **fs3**); callee-saved' },
    { name: 'f20', alias: 'fs4', kind: 'saved', description: '**f20** — Floating-point saved register (alias **fs4**); callee-saved' },
    { name: 'f21', alias: 'fs5', kind: 'saved', description: '**f21** — Floating-point saved register (alias **fs5**); callee-saved' },
    { name: 'f22', alias: 'fs6', kind: 'saved', description: '**f22** — Floating-point saved register (alias **fs6**); callee-saved' },
    { name: 'f23', alias: 'fs7', kind: 'saved', description: '**f23** — Floating-point saved register (alias **fs7**); callee-saved' },
    { name: 'f24', alias: 'fs8', kind: 'saved', description: '**f24** — Floating-point saved register (alias **fs8**); callee-saved' },
    { name: 'f25', alias: 'fs9', kind: 'saved', description: '**f25** — Floating-point saved register (alias **fs9**); callee-saved' },
    { name: 'f26', alias: 'fs10', kind: 'saved', description: '**f26** — Floating-point saved register (alias **fs10**); callee-saved' },
    { name: 'f27', alias: 'fs11', kind: 'saved', description: '**f27** — Floating-point saved register (alias **fs11**); callee-saved' },
    { name: 'f28', alias: 'ft8', kind: 'temporary', description: '**f28** — Floating-point temporary register (alias **ft8**); caller-saved scratch' },
    { name: 'f29', alias: 'ft9', kind: 'temporary', description: '**f29** — Floating-point temporary register (alias **ft9**); caller-saved scratch' },
    { name: 'f30', alias: 'ft10', kind: 'temporary', description: '**f30** — Floating-point temporary register (alias **ft10**); caller-saved scratch' },
    { name: 'f31', alias: 'ft11', kind: 'temporary', description: '**f31** — Floating-point temporary register (alias **ft11**); caller-saved scratch' },
  ],
  consts: [
    {
      name: 'PC_START',
      description:
        'Default address of the **.text** segment and typical entry point (**0x0000**). Use in `la`/`auipc` relocations.',
    },
    {
      name: 'STACK_START',
      description:
        'Initial value loaded into **sp** after reset (**0xC000**).\nThe stack grows downward toward lower addresses.',
    },
    {
      name: 'STACK_END',
      description:
        'End of the stack. Any write to **sp** with **sp >= STACK_END** throws.',
    },
    {
      name: 'FB_START',
      description:
        'First byte of the linear framebuffer (**0x8000**). Contiguous through **FB_END**.\n\n'
        + 'Each byte represents a pixel with a color in the **RGB332** format (3 bits for red, 3 bits for green, 2 bits for blue).\n\n'
        + '**SYSCALL_FILL_SCREEN** fills this range.',
    },
    {
      name: 'FB_END',
      description:
        'Last address of the framebuffer region (**0xA70F**).\n\n'
        + 'Each byte represents a pixel with a color in the **RGB332** format (3 bits for red, 3 bits for green, 2 bits for blue).\n\n'
        + '**SYSCALL_FILL_SCREEN** fills this range.',
    },
    {
      name: 'KBD_STAT',
      description:
        'Memory-mapped word (**0x6000**) indicating if there is any pending keyboard input for the program to read.\n\n'
        + 'Will be set to zero after the program reads the pending keyboard input.',
    },
    {
      name: 'KBD_DATA',
      description:
        'Memory-mapped word (**0x6004**) where the host injects pending keyboard input for the program to read.',
    },
    {
      name: 'SYSCALL_PRINT_INT',
      description:
        '**ecall** service number in **a7** (**10**).\n\n'
        + 'Intended for printing **a0** as a decimal integer.\n\n'
          + 'The int will be printed in the simulator terminal.'
    },
    {
      name: 'SYSCALL_PRINT_STRING',
      description:
        '**ecall** service number in **a7** (**11**).\n\n'
        + '**a0** should hold the address of a string (will print a maximum of 255 bytes or until it finds a null-terminator).\n\n'
        + 'The string will be printed in the simulator terminal.',
    },
    {
      name: 'SYSCALL_PRINT_CHAR',
      description:
        '**ecall** service number in **a7** (**12**).\n\n'
        + '**a0** carries the low byte of the character to print.\n\n'
        + 'The char will be printed in the simulator terminal.',
    },
    {
      name: 'SYSCALL_PRINTF',
      description:
        '**ecall** service number in **a7** (**14**).\n\n'
        + 'Prints a formatted string to the simulator terminal (like a small `printf`).\n\n'
        + '**a0** — address of a null-terminated format string in memory (up to 255 bytes).\n\n'
        + '**a1** through **a6** — values substituted left to right for each conversion in the format string (first placeholder uses **a1**, second uses **a2**, and so on).\n\n'
        + 'Supported conversions: **%d** (signed decimal), **%u** (unsigned decimal), **%x** / **%X** (hex), **%c** (character), **%p** (pointer), **%f** (single-precision float), **%%** (literal `%`).',
    },
    {
      name: 'SYSCALL_UPDATE_SCREEN',
      description:
        '**ecall** service number in **a7** (**20**).\n'
        + 'Flushes framebuffer changes to the UI.\n\n'
        + 'Only effective when used along with `.option OPTION_EXPLICIT_SCREEN_UPDATE`',
    },
    {
      name: 'SYSCALL_FILL_SCREEN',
      description:
        '**ecall** service number in **a7** (**21**).\n'
        + 'Fills the framebuffer with the value in **a0**',
    },
    {
      name: 'SYSCALL_RANDOM_BYTES',
      description:
        '**ecall** service number in **a7** (**30**).\n\n'
        + '**a0** — base address in memory where bytes are written.\n\n'
        + '**a1** — how many bytes to write (1, 2, 3 or 4). Values greater than **4** are treated as **4**; **0** is treated as **4**.\n\n'
        + 'Writes up to four pseudo-random bytes.',
    },
    {
      name: 'OPTION_EXPLICIT_SCREEN_UPDATE',
      description:
        'Token for the **.option** keyword.\n\n'
        + 'When used as `.option OPTION_EXPLICIT_SCREEN_UPDATE`, the simulator will only update the screen after **SYSCALL_UPDATE_SCREEN** instead of every step.',
    },
  ],
};
