import { IToken } from '../analyzer/tokenizer';
import type { IUserManual } from './manual';
import type { IDecodedInstruction, IProcessor } from './processor';
import { WorkerService } from './worker-service';

export interface IAssembledInstruction<TDecoded extends IDecodedInstruction = IDecodedInstruction> {
  code: string;
  lineNumber: string;
  tokens: IToken[];
  decoded: TDecoded;
  address: bigint;
  scope?: string;
}

export abstract class ISimulator<TProcessor extends IProcessor<any> = IProcessor<any>> {
  public abstract readonly name: string;

  /**
   * Object that will be used to mount the examples.
   * This object must be static.
   */
  public abstract readonly manual: IUserManual;

  public abstract readonly processor: TProcessor;

  public abstract readonly instructionKeywords: string[];

  public abstract readonly registerKeywords: string[];

  public abstract readonly directives: string[];

  public abstract readonly consts: string[];

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

  get cpuWorker() {
    return this.workerService.worker;
  }

  get cpuWorkerRunning() {
    return this.workerService.workerRunning;
  }

  protected abstract createCpuWorkerInstance(workerOptions?: WorkerOptions): Worker;

  public abstract assembleCode(code: string): Array<IAssembledInstruction>;

  public createCpuWorker(workerOptions?: WorkerOptions) {
    this.workerService.createCpuWorker(() => this.createCpuWorkerInstance(workerOptions));
  }

  public syncWorker() {
    if (!this.workerService.worker) {
      return;
    }

    console.log('syncWorker', { proc: this.processor });

    this.workerService.syncWorker(this.processor);
  }

  public handleKeyPress(event: KeyboardEvent) {
    console.log('simulator: received unhandled key press event', { event });
  }

  public linkToManual(instruction: string): string {
    void instruction;

    return '#';
  }
}
