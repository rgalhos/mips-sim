import { EHardwareType } from "../hardware";
import type { IToken } from "../rv32/analyzer/rv32-tokenizer";
import type { IManualExample } from "./examples";
import type { IUserManual } from "./manual";
import type { IDecodedInstruction, IProcessor } from "./processor";
import { SharedMemory } from "./shared-memory";
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

  private _sharedMemory: SharedMemory | null = null;

  protected getSharedMemory() {
    if (!this._sharedMemory) {
      this._sharedMemory = new SharedMemory(this.memorySize);
      this.processor.attachMemory(this._sharedMemory.view);
    }

    return this._sharedMemory;
  }

  /**
   * Memory size
   */
  private _memorySize = 0;

  public get memorySize() {
    return this._memorySize || this.processor.defaultMemorySize;
  }

  public setMemorySize(size: number) {
    this.workerService.setMemorySize(size);
    this._memorySize = size;
    this.getSharedMemory().resize(size);
    this.processor.attachMemory(this._sharedMemory!.view);
    this.processor.setMemorySize(size);

    if (this.workerService.worker) {
      this.workerService.setupWorker({
        sharedBuffer: this._sharedMemory!.buffer,
        memorySize: size,
      });
    }

    return size;
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

    const sharedMemory = this.getSharedMemory();

    this.workerService.setupWorker({
      sharedBuffer: sharedMemory.buffer,
      memorySize: this.memorySize,
    });
  }

  public syncWorker() {
    if (!this.workerService.worker) {
      return;
    }

    this.workerService.syncWorker(this.processor, { shared: this.getSharedMemory().shared });
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
