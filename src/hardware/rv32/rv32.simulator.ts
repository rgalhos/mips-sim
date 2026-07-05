import type { IUserManual } from "../common/manual";
import { type IAssembledInstruction, type IAssemblerResult, ISimulator } from "../common/simulator";
import { EHardwareType } from "../hardware";
import { preprocessor } from "./analyzer/rv32-pre.assembler";
import { analyze, type IAnalyzedUnit } from "./analyzer/rv32-analyzer.assembler";
import { tokenizer } from "./analyzer/rv32-lexer.assembler";
import { parse } from "./analyzer/rv32-parser.assembler";
import type { ISourceLine } from "./analyzer/rv32-pre.assembler";
import { rv_consts, rv_directives, rv_opcode, rv_opcode_pseudo, rv_reg, rv_reg_f } from "./rv32.const";
import { RVProcessor } from "./rv32.processor";
import type { IDecodedRVInstruction } from "./rv32.types";
import RVWorker from "./rv32.worker.ts?worker&inline";
import { rvManual } from "./user/riscv.manual";

export class RVSimulator extends ISimulator<RVProcessor> {
  static simulatorName = "RISC-V (RV32I)";

  public readonly name = RVSimulator.simulatorName;

  public readonly hardwareType = EHardwareType.RV32;

  public readonly manual: IUserManual = rvManual;

  public readonly instructionKeywords = Object.keys({ ...rv_opcode, ...rv_opcode_pseudo })
    .filter((v) => Number.isNaN(+v))
    .slice(1) /* rv_opcode.illegal */;

  public readonly registerKeywords = Object.keys(rv_reg)
    .concat(Object.keys(rv_reg_f))
    .filter((v) => Number.isNaN(+v));

  public readonly directives = Object.keys(rv_directives).filter((v) => Number.isNaN(+v));

  public readonly consts = Object.values(rv_consts);

  public readonly processor: RVProcessor = new RVProcessor();

  protected createCpuWorkerInstance(workerOptions?: WorkerOptions) {
    return new RVWorker(workerOptions);
  }

  public examples = () =>
    import(/* webpackChunkName: "riscv-examples" */ "./user/riscv.examples").then((m) => m.rvExamples);

  private applyAnalyzedUnits(units: IAnalyzedUnit[]) {
    for (const unit of units) {
      switch (unit.kind) {
        case "instruction":
          this.processor.memoryWrite(unit.address, unit.decoded.bytecode, 32);
          break;
        case "data": {
          const step = BigInt(unit.width / 8);
          for (let i = 0; i < unit.values.length; i++) {
            this.processor.memoryWrite(unit.address + step * BigInt(i), unit.values[i], unit.width);
          }
          break;
        }
        case "string":
          for (let i = 0; i < unit.bytes.length; i++) {
            this.processor.memoryWrite(unit.address + BigInt(i), BigInt(unit.bytes[i]), 8);
          }
          if (unit.zeroTerminated) {
            this.processor.memoryWrite(unit.address + BigInt(unit.bytes.length), 0n, 8);
          }
          break;
        case "reserve":
          break;
      }
    }
  }

  private buildInstructions(
    units: IAnalyzedUnit[],
    sourceByParseLine: Map<number, string>
  ): Array<IAssembledInstruction<IDecodedRVInstruction>> {
    return units
      .filter((u): u is Extract<IAnalyzedUnit, { kind: "instruction" }> => u.kind === "instruction")
      .map((unit) => ({
        code: sourceByParseLine.get(unit.parseLine) ?? "",
        lineNumber: unit.line,
        tokens: [],
        decoded: unit.decoded,
        address: unit.address,
        scope: unit.scope,
      }));
  }

  public assembleCode(code: string): IAssemblerResult {
    this.getSharedMemory();
    this.processor.resetState();
    this.processor.optExplicitScreenUpdate = false;

    let preprocessed: ReturnType<typeof preprocessor> = [];
    try {
      preprocessed = preprocessor(code);
    } catch (e) {
      return { instructions: [], labels: {}, errors: [e as Error] };
    }

    const sourceByParseLine = new Map(preprocessed.map(({ line, number }) => [number, line]));
    const lexerInput: ISourceLine[] = preprocessed;

    const parseResult = parse(tokenizer(lexerInput));
    const analyzeResult = analyze(parseResult);

    this.processor.optExplicitScreenUpdate = analyzeResult.optExplicitScreenUpdate;
    this.applyAnalyzedUnits(analyzeResult.units);

    return {
      instructions: this.buildInstructions(analyzeResult.units, sourceByParseLine),
      labels: analyzeResult.symbols.labels,
      errors: analyzeResult.errors,
    };
  }

  public linkToManual(instruction: string) {
    return `https://riscv.github.io/riscv-unified-db/manual/html/isa/isa_20240411/insts/${instruction.toLowerCase()}.html`;
  }
}
