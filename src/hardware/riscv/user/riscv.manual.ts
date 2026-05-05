import { IUserManual } from '../../common/manual';

export const rvManual: IUserManual = {
  instructions: [
    { name: 'lui', operation: 'rd = imm << 12', description: 'Loads the upper 20 bits of rd with imm and clears the low 12 bits.' },
    { name: 'auipc', operation: 'rd = pc + (imm << 12)', description: 'Adds the PC-aligned upper immediate to the program counter and stores the result in rd.' },
    { name: 'jal', operation: 'rd = pc + 4; pc = pc + offset', description: 'Jumps to pc + offset and stores the return address (pc + 4) in rd.' },
    { name: 'jalr', operation: 'rd = pc + 4; pc = rs1 + imm', description: 'Jumps to rs1 + immediate with least bit cleared; stores return address in rd.' },
    { name: 'beq', operation: 'if (rs1 == rs2) pc += offset', description: 'Branches if rs1 equals rs2.' },
    { name: 'bne', operation: 'if (rs1 != rs2) pc += offset', description: 'Branches if rs1 does not equal rs2.' },
    { name: 'blt', operation: 'if (rs1 < rs2) pc += offset', description: 'Branches if rs1 is less than rs2, signed compare.' },
    { name: 'bge', operation: 'if (rs1 >= rs2) pc += offset', description: 'Branches if rs1 is greater than or equal to rs2, signed compare.' },
    { name: 'bltu', operation: 'if (rs1 < rs2) pc += offset', description: 'Branches if rs1 is less than rs2, unsigned compare.' },
    { name: 'bgeu', operation: 'if (rs1 >= rs2) pc += offset', description: 'Branches if rs1 is greater than or equal to rs2, unsigned compare.' },
    { name: 'lb', operation: 'rd = sign_extend8(mem[rs1 + imm])', description: 'Loads a signed byte from memory into rd.' },
    { name: 'lh', operation: 'rd = sign_extend16(mem[rs1 + imm])', description: 'Loads a signed halfword from memory into rd.' },
    { name: 'lw', operation: 'rd = mem[rs1 + imm]', description: 'Loads a word from memory into rd.' },
    { name: 'lbu', operation: 'rd = zero_extend(mem[rs1 + imm])', description: 'Loads an unsigned byte from memory into rd.' },
    { name: 'lhu', operation: 'rd = zero_extend(mem[rs1 + imm])', description: 'Loads an unsigned halfword from memory into rd.' },
    { name: 'sb', operation: 'mem[rs1 + imm] = byte(rs2)', description: 'Stores the low byte of rs2 to memory.' },
    { name: 'sh', operation: 'mem[rs1 + imm] = half(rs2)', description: 'Stores the low halfword of rs2 to memory.' },
    { name: 'sw', operation: 'mem[rs1 + imm] = rs2', description: 'Stores the word in rs2 to memory.' },
    { name: 'addi', operation: 'rd = rs1 + imm', description: 'Adds rs1 and the sign-extended immediate and stores the sum in rd.' },
    { name: 'slti', operation: 'rd = (rs1 < imm) ? 1 : 0', description: 'Sets rd to 1 if rs1 is less than the immediate, signed; otherwise 0.' },
    { name: 'sltiu', operation: 'rd = (rs1 < imm) ? 1 : 0', description: 'Sets rd to 1 if rs1 is less than the immediate, unsigned; otherwise 0.' },
    { name: 'xori', operation: 'rd = rs1 ^ imm', description: 'Bitwise XOR of rs1 and the sign-extended immediate into rd.' },
    { name: 'ori', operation: 'rd = rs1 | imm', description: 'Bitwise OR of rs1 and the sign-extended immediate into rd.' },
    { name: 'andi', operation: 'rd = rs1 & imm', description: 'Bitwise AND of rs1 and the sign-extended immediate into rd.' },
    { name: 'slli', operation: 'rd = rs1 << shamt', description: 'Logical left shift of rs1 by immediate shift amount into rd.' },
    { name: 'srli', operation: 'rd = rs1 >> shamt', description: 'Logical right shift of rs1 by immediate shift amount into rd.' },
    { name: 'srai', operation: 'rd = rs1 >> shamt', description: 'Arithmetic right shift of rs1 by immediate shift amount into rd.' },
    { name: 'add', operation: 'rd = rs1 + rs2', description: 'Adds rs1 and rs2 and stores the result in rd.' },
    { name: 'sub', operation: 'rd = rs1 - rs2', description: 'Subtracts rs2 from rs1 and stores the result in rd.' },
    { name: 'sll', operation: 'rd = rs1 << rs2[4:0]', description: 'Logical left shift of rs1 by the low 5 bits of rs2 into rd.' },
    { name: 'slt', operation: 'rd = (rs1 < rs2) ? 1 : 0', description: 'Sets rd to 1 if rs1 is less than rs2, signed; otherwise 0.' },
    { name: 'sltu', operation: 'rd = (rs1 < rs2) ? 1 : 0', description: 'Sets rd to 1 if rs1 is less than rs2, unsigned; otherwise 0.' },
    { name: 'xor', operation: 'rd = rs1 ^ rs2', description: 'Bitwise XOR of rs1 and rs2 into rd.' },
    { name: 'srl', operation: 'rd = rs1 >> rs2[4:0]', description: 'Logical right shift of rs1 by the low 5 bits of rs2 into rd.' },
    { name: 'sra', operation: 'rd = rs1 >> rs2[4:0]', description: 'Arithmetic right shift of rs1 by the low 5 bits of rs2 into rd.' },
    { name: 'or', operation: 'rd = rs1 | rs2', description: 'Bitwise OR of rs1 and rs2 into rd.' },
    { name: 'and', operation: 'rd = rs1 & rs2', description: 'Bitwise AND of rs1 and rs2 into rd.' },
    { name: 'fence', operation: 'fence pred, succ', description: 'Orders memory accesses; predecessor and successor sets control visible ordering among loads and stores.' },
    { name: 'ecall', operation: 'syscall / env call', description: 'Raises an environment-call exception to invoke the execution environment.' },
    { name: 'ebreak', operation: 'breakpoint', description: 'Raises a breakpoint exception for debuggers.' },

    { name: 'nop', operation: '—', description: '**(pseudoinstruction)** No operation; expands to addi with zero effect.' },
    { name: 'la', operation: 'rd = symbol address', description: '**(pseudoinstruction)** Loads the absolute address of a symbol into rd (typically auipc + addi).' },
    { name: 'li', operation: 'rd = immediate', description: '**(pseudoinstruction)** Loads a constant immediate into rd using the shortest instruction sequence.' },
    { name: 'j', operation: 'pc = pc + offset', description: '**(pseudoinstruction)** Unconditional jump; expands to jal with a discarded link register.' },
    { name: 'jump', operation: 'pc = pc + offset', description: '**(pseudoinstruction)** PC-relative long jump via auipc into a scratch register and jalr.' },
    { name: 'mv', operation: 'rd = rs1', description: '**(pseudoinstruction)** Copies the value of rs1 into rd.' },
    { name: 'not', operation: 'rd = ~rs1', description: '**(pseudoinstruction)** Bitwise NOT of rs1 into rd.' },
    { name: 'neg', operation: 'rd = -rs1', description: '**(pseudoinstruction)** Two\'s complement negation of rs1 into rd.' },
    { name: 'seqz', operation: 'rd = (rs1 == 0) ? 1 : 0', description: '**(pseudoinstruction)** Sets rd to 1 if rs1 is zero, else 0.' },
    { name: 'snez', operation: 'rd = (rs1 != 0) ? 1 : 0', description: '**(pseudoinstruction)** Sets rd to 1 if rs1 is non-zero, else 0.' },
    { name: 'sltz', operation: 'rd = (rs1 < 0) ? 1 : 0', description: '**(pseudoinstruction)** Sets rd to 1 if rs1 is negative, else 0.' },
    { name: 'sgtz', operation: 'rd = (rs1 > 0) ? 1 : 0', description: '**(pseudoinstruction)** Sets rd to 1 if rs1 is positive, else 0.' },
    { name: 'beqz', operation: 'if (rs1 == 0) pc += offset', description: '**(pseudoinstruction)** Branches if rs1 is zero.' },
    { name: 'bnez', operation: 'if (rs1 != 0) pc += offset', description: '**(pseudoinstruction)** Branches if rs1 is non-zero.' },
    { name: 'blez', operation: 'if (rs1 <= 0) pc += offset', description: '**(pseudoinstruction)** Branches if rs1 is less than or equal to zero, signed.' },
    { name: 'bgez', operation: 'if (rs1 >= 0) pc += offset', description: '**(pseudoinstruction)** Branches if rs1 is greater than or equal to zero, signed.' },
    { name: 'bltz', operation: 'if (rs1 < 0) pc += offset', description: '**(pseudoinstruction)** Branches if rs1 is negative, signed.' },
    { name: 'bgtz', operation: 'if (rs1 > 0) pc += offset', description: '**(pseudoinstruction)** Branches if rs1 is positive, signed.' },
    { name: 'bgt', operation: 'if (rs1 > rs2) pc += offset', description: '**(pseudoinstruction)** Branches if rs1 is greater than rs2, signed (typically via reversed blt).' },
    { name: 'ret', operation: 'pc = ra', description: '**(pseudoinstruction)** Returns from a subroutine using the address in ra.' },
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
