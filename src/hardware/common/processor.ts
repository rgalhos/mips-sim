import { IAssembledInstruction } from './simulator';

type TAnyEnum = Record<string, any>;

export interface IDecodedInstruction {
  // Instruction bytecode
  bytecode: bigint;

  // Instruction codec
  codec: unknown;

  // Instruction opcode
  opcode: number;

  // From instruction enum
  _op: unknown;
}

export type ICPU = Record<string, unknown> & {
  register: Record<number, bigint>;
  pc: number;
};

export abstract class IProcessor<TDecodedInstruction extends IDecodedInstruction> {
  /**
   * List of registes used by
   * Must be a non-const TS enum
   */
  abstract readonly registers: TAnyEnum;

  /**
   * Must be a non-const TS enum
   */
  abstract readonly instructions: TAnyEnum;

  /**
   * Simulator memory
   */
  public memory: number[] = [];

  /**
   * Architecture base address
   */
  protected readonly DRAM_BASE_ADDRESS: bigint = 0x00000000000n;

  /**
   * Architecture instruction length
   */
  public readonly INSTRUCTION_LENGTH: number = 4;

  /**
   * CPU
   */
  protected abstract readonly cpu: ICPU;

  private _halted = false;

  /**
   * Is the CPU halted?
   */
  public get halted() {
    return this._halted;
  }

  public setHalted(halted: boolean) {
    this._halted = halted;
  }

  /**
   * Function that will be used by the assembler
   * It takes a decoded instruction object and returns the instruction in bytecode
   */
  abstract toBytecode(instruction: Partial<TDecodedInstruction>): bigint;

  /**
   * Function that will be used by the disassembler
   * It takes the instruction bytecode and returns a decoded instruction object
   */
  abstract fromBytecode(instruction: bigint): TDecodedInstruction;

  /**
   * Function that will execute the instruction
   */
  abstract execute(instruction: Partial<TDecodedInstruction>): void;

  /**
   * Helper function used to stringify an instruction
   */
  abstract stringifyInstruction(instruction: Partial<TDecodedInstruction>): string;

  protected registerRead(reg: number): bigint {
    if (!this.registers[reg]) {
      console.error('WIMS: Reading inexistent register: ', reg);
    }

    return this.cpu.register[reg];
  }

  protected registerWrite(reg: number, value: bigint) {
    if (!this.registers[reg]) {
      console.error('WIMS: Writing to inexistent register: ', reg);
    }

    this.cpu.register[reg] = value;
  }

  protected memoryWrite(address: number | bigint, value: bigint, bits: 8 | 16 | 32 = 8): void {
    address = Number(address);
    switch (bits) {
      // case 64:
      //   this.memory[address + 7] = (value >> 56) & 0xff;
      //   this.memory[address + 6] = (value >> 48) & 0xff;
      //   this.memory[address + 5] = (value >> 40) & 0xff;
      //   this.memory[address + 4] = (value >> 32) & 0xff;
      // @ts-expect-error // eslint-disable-next-line no-fallthrough
      case 32: {
        this.memory[address + 3] = Number((value >> 24n) & 0xffn);
        this.memory[address + 2] = Number((value >> 16n) & 0xffn);
      }
      // @ts-expect-error // eslint-disable-next-line no-fallthrough
      case 16: {
        this.memory[address + 1] = Number((value >> 8n) & 0xffn);
      } // eslint-disable-next-line no-fallthrough
      default: {
        this.memory[address + 0] = Number(value & 0xffn);
      }
    }
  }

  protected memoryRead(address: number | bigint, bits: 8 | 16 | 32 | 64 = 8): bigint {
    address = Number(address);
    // If address is empty we generate a random number (garbage) and save it to the address.
    const read = (addr: number) => {
      let v = BigInt(this.memory[addr]);
      if (typeof v === 'undefined') {
        v = BigInt((Math.random() * 32768) & 255);
        this.memoryWrite(addr, v);
      }
      return v;
    };

    let v = 0n;

    switch (bits) {
      // case 64: {
      //   v |=
      //     ((read(address + 7) << 56n) & 0xffn) |
      //     ((read(address + 6) << 48n) & 0xffn) |
      //     ((read(address + 5) << 40n) & 0xffn) |
      //     ((read(address + 4) << 32n) & 0xffn);
      // }
      // @ts-expect-error // eslint-disable-next-line no-fallthrough
      case 32: {
        v |= ((read(address + 3) & 0xffn) << 24n) | ((read(address + 2) & 0xffn) << 16n);
      } // @ts-expect-error // eslint-disable-next-line no-fallthrough
      case 16: {
        v |= (read(address + 1) & 0xffn) << 8n;
      } // eslint-disable-next-line no-fallthrough
      default: {
        v |= read(address + 0) & 0xffn;
      }
    }

    return v;
  }

  public abstract loadProgram(program: Array<IAssembledInstruction>): void;
}
