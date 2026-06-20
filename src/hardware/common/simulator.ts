import { EHardwareType } from "../hardware";
import type { IToken } from "../rv32/analyzer/rv32-tokenizer";
import type { IManualExample } from "./examples";
import type { IUserManual } from "./manual";
import type { IDecodedInstruction, IProcessor } from "./processor";
import { WorkerService } from "./worker-service";

export interface IAssembledInstruction<TDecoded extends IDecodedInstruction = IDecodedInstruction> {
  code: string;
  lineNumber: number;
  tokens: IToken[];
  decoded: TDecoded;
  address: bigint;
  scope?: string;
}

export interface IAssemblerResult<TDecoded extends IDecodedInstruction = IDecodedInstruction> {
  instructions: Array<IAssembledInstruction<TDecoded>>;
  labels: { [label: string]: bigint | number };
}

export abstract class ISimulator<TProcessor extends IProcessor<any> = IProcessor<any>> {
  public abstract readonly name: string;

  /**
   * Object that will be used to mount the examples.
   * This object must be static.
   */
  public abstract readonly manual: IUserManual;

  public abstract examples: () => Promise<IManualExample[]>;

  public abstract readonly processor: TProcessor;

  public abstract readonly instructionKeywords: string[];

  public abstract readonly registerKeywords: string[];

  public abstract readonly directives: string[];

  public abstract readonly consts: string[];

  public abstract readonly hardwareType: EHardwareType;

  public readonly workerService = new WorkerService();

  /**
   * Memory size
   */
  private _memorySize = 0;

  public get memorySize() {
    return this._memorySize || this.processor.defaultMemorySize;
  }

  public setMemorySize(size: number) {
    this.workerService.setMemorySize(size);
    return (this._memorySize = size);
  }

  public setFrequency(freq: number) {
    this.workerService.setFrequency(freq);
    return this.processor.setFrequency(freq);
  }

  get cpuWorker() {
    return this.workerService.worker;
  }

  get cpuWorkerRunning() {
    return this.workerService.workerRunning;
  }

  protected abstract createCpuWorkerInstance(workerOptions?: WorkerOptions): Worker;

  public abstract assembleCode(code: string): IAssemblerResult;

  public createCpuWorker(workerOptions?: WorkerOptions) {
    this.workerService.createCpuWorker(() => this.createCpuWorkerInstance(workerOptions));
  }

  public syncWorker() {
    if (!this.workerService.worker) {
      return;
    }

    this.workerService.syncWorker(this.processor);
  }

  public handleKeyPress(event: KeyboardEvent) {
    if (this.workerService.workerRunning) {
      this.workerService.sendKey(event.keyCode || event.which);
    }
  }

  public handleStdinInput(line: string) {
    if (this.workerService.workerRunning) {
      this.workerService.sendStdin(line);
    }
  }

  public linkToManual(instruction: string): string {
    void instruction;

    return "#";
  }
}
