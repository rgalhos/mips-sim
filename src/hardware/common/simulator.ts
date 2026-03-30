import type { IUserManual } from './manual';
import type { IProcessor } from './processor';

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

  private _stepSpeed = 1000;

  get stepSpeed() {
    return this._stepSpeed;
  }

  public setStepSpeed(speed: number) {
    return this._stepSpeed;
  }

  private _cpuWorker?: Worker;

  get cpuWorker() {
    return this._cpuWorker;
  }

  public createCpuWorker(workerOptions?: WorkerOptions) {
    if (!!this._cpuWorker) {
      console.warn(`ISimulator: CPU worker creation requested but a worker already exists!`);
    }

    return (this._cpuWorker = new Worker(this.cpuWorkerLocation, workerOptions));
  }

  public abstract assembleLine(tokens: string[]): any;
}
