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
  static name = 'Uninitialized simulator';

  /**
   * Object that will be used to mount the examples.
   * This object must be static.
   */
  public static readonly manual: IUserManual;

  public abstract readonly processor: TProcessor;

  public abstract readonly instructionKeywords: string[];

  public abstract readonly registerKeywords: string[];

  protected abstract readonly cpuWorkerLocation: string | URL;

  public readonly workerService = new WorkerService();

  private _cpuWorkerRunning = false;

  get cpuWorker() {
    return this.workerService.worker;
  }

  get cpuWorkerRunning() {
    return this._cpuWorkerRunning;
  }

  public createCpuWorker(workerOptions?: WorkerOptions) {
    this.workerService.createCpuWorker(this.cpuWorkerLocation, workerOptions);
  }

  public handleKeyPress(event: KeyboardEvent) {
    console.log('simulator: received unhandled key press event', { event });
  }

  public abstract assembleCode(code: string): Array<IAssembledInstruction>;

  public linkToManual(instruction: string): string {
    void instruction;

    return '#';
  }
}
