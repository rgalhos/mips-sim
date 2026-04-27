import { IAssembledInstruction } from './simulator';

export const enum EWorkerCommand {
  GET_CPU_HALT,
  SET_CPU_HALT,
  CPU_SETUP,
  CPU_RUN,
  CPU_STEP,
  CPU_RESET,
  SET_FREQUENCY,
  GET_FREQUENCY,
  LOAD_PROGRAM,
}

export type WorkerMessage =
  | {
      command: EWorkerCommand.SET_CPU_HALT;
      data: boolean;
    }
  | {
      command: EWorkerCommand.SET_FREQUENCY;
      data: number;
    }
  | {
      command: EWorkerCommand.LOAD_PROGRAM;
      data: any;
    }
  | {
      command:
        | EWorkerCommand.GET_CPU_HALT
        | EWorkerCommand.GET_FREQUENCY
        | EWorkerCommand.CPU_SETUP
        | EWorkerCommand.CPU_RUN
        | EWorkerCommand.CPU_STEP
        | EWorkerCommand.CPU_RESET;
      data: never;
    };

export type WorkerMessageResponse =
  | {
      command: EWorkerCommand.GET_CPU_HALT;
      data: boolean;
    }
  | {
      command: EWorkerCommand.GET_FREQUENCY;
      data: number;
    }
  | {
      command: EWorkerCommand.CPU_SETUP | EWorkerCommand.CPU_RUN | EWorkerCommand.CPU_STEP | EWorkerCommand.CPU_RESET;
      data: never;
    };

export class WorkerService {
  public worker: Worker | null = null;

  private _workerRunning = false;

  public get workerRunning() {
    return this._workerRunning;
  }

  createCpuWorker(workerLocation: string | URL, workerOptions?: WorkerOptions) {
    if (!!this.worker) {
      console.warn(`worker service: CPU worker creation requested but a worker already exists!`);
      return;
    }

    this._workerRunning = true;
    return (this.worker = new Worker(workerLocation, { type: 'module' }));
  }

  runCode() {
    this.worker?.postMessage({ command: EWorkerCommand.CPU_RUN } as WorkerMessage);
  }

  stepCode() {
    this.worker?.postMessage({ command: EWorkerCommand.CPU_STEP } as WorkerMessage);
  }

  resetCpu() {
    this.worker?.postMessage({ command: EWorkerCommand.CPU_RESET } as WorkerMessage);
  }

  setHalted(halted: boolean) {
    this.worker?.postMessage({ command: EWorkerCommand.SET_CPU_HALT, data: halted } as WorkerMessage);
  }

  setFrequency(freq: number) {
    this.worker?.postMessage({ command: EWorkerCommand.SET_FREQUENCY, data: freq } as WorkerMessage);
  }

  loadProgram(program: IAssembledInstruction[]) {
    this.worker?.postMessage({ command: EWorkerCommand.LOAD_PROGRAM, data: program } as WorkerMessage);
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this._workerRunning = false;
  }
}
