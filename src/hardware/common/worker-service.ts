import EventEmitter from 'events';
import { ICPU, IDecodedInstruction, IProcessor } from './processor';
import { IAssembledInstruction } from './simulator';

export const enum EWorkerCommand {
  GET_CPU_HALT = 'GET_CPU_HALT',
  SET_CPU_HALT = 'SET_CPU_HALT',
  CPU_SETUP = 'CPU_SETUP',
  CPU_RUN = 'CPU_RUN',
  CPU_STEP = 'CPU_STEP',
  CPU_RESET = 'CPU_RESET',
  SET_FREQUENCY = 'SET_FREQUENCY',
  GET_FREQUENCY = 'GET_FREQUENCY',
  KEY_EVENT = 'KEY_EVENT',
  LOAD_PROGRAM = 'LOAD_PROGRAM',
  SET_MEMORY_SIZE = 'SET_MEMORY_SIZE',
  MEMORY_RETRIEVE = 'MEMORY_RETRIEVE',
  CPU_DUMP = 'CPU_DUMP',
  CPU_DEBUG_DUMP = 'CPU_DEBUG_DUMP',
  MEMORY_OVERWRITE = 'MEMORY_OVERWRITE',
  ASSEMBLE_CODE = 'ASSEMBLE_CODE',
  SYNC_WORKER = 'SYNC_WORKER',
  TERMINAL_PRINT = 'TERMINAL_PRINT',
}

export interface IWorkerCPUDump {
  memory: Uint8Array;
  memoryDiff: Record<number, number>;
  cpu: ICPU;
  cycle: number;
  halted: boolean;
  lastExecutedInstruction: any;
}

export interface IWorkerCPUDebugDump {
  memory: Array<{ address: number; value: number; pc: bigint; cycle: number }>;
  registers: Array<{ reg: string; value: bigint; pc: bigint; cycle: number }>;
}

export type WorkerMessage =
  | {
      command: EWorkerCommand.SET_CPU_HALT;
      data: boolean;
    }
  | {
      command: EWorkerCommand.ASSEMBLE_CODE;
      data: string;
    }
  | {
      command: EWorkerCommand.SYNC_WORKER;
      data: {
        cpu: ICPU;
        memory: Uint8Array;
        frequency: number;
      };
    }
  | {
      command: EWorkerCommand.SET_FREQUENCY | EWorkerCommand.SET_MEMORY_SIZE | EWorkerCommand.KEY_EVENT;
      data: number;
    }
  | {
      command: EWorkerCommand.LOAD_PROGRAM;
      data: IAssembledInstruction[];
    }
  | {
      command:
        | EWorkerCommand.GET_CPU_HALT
        | EWorkerCommand.GET_FREQUENCY
        | EWorkerCommand.CPU_SETUP
        | EWorkerCommand.CPU_RUN
        | EWorkerCommand.CPU_STEP
        | EWorkerCommand.CPU_RESET
        | EWorkerCommand.MEMORY_RETRIEVE
        | EWorkerCommand.CPU_DUMP
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
      command: EWorkerCommand.MEMORY_RETRIEVE;
      data: Uint8Array;
    }
  | {
      command: EWorkerCommand.CPU_DUMP;
      data: IWorkerCPUDump;
    }
  | {
      command: EWorkerCommand.TERMINAL_PRINT;
      data: string;
    }
  | {
      command: EWorkerCommand.CPU_DEBUG_DUMP;
      data: IWorkerCPUDebugDump;
    }
  | {
      command: EWorkerCommand.CPU_SETUP | EWorkerCommand.CPU_RUN | EWorkerCommand.CPU_STEP | EWorkerCommand.CPU_RESET;
      data: never;
    };

export class WorkerService extends EventEmitter {
  private _worker: Worker | null = null;

  public get worker() {
    return this._worker;
  }

  private _workerRunning = false;

  public get workerRunning() {
    return this._workerRunning;
  }

  private _postMessage(...args: Parameters<Worker['postMessage']>) {
    if (!this._worker) {
      console.log('cpu worker: tried to send message but worker is not running', args);

      return;
    }

    return this._worker.postMessage(...args);
  }

  private _onMessage = (event: MessageEvent<WorkerMessageResponse>) => {
    this.emit(event.data.command, event.data);
  };

  createCpuWorker(createWorker: () => Worker) {
    if (!!this._worker) {
      console.warn(`worker service: cpu worker creation requested but a worker already exists!`, {
        worker: this._worker,
      });

      return;
    }

    this._workerRunning = true;
    const w = createWorker();

    w.onerror = (ev) => {
      console.error('cpu worker:', ev.message, ev.filename, ev.lineno, ev.colno);
    };

    w.addEventListener('message', this._onMessage);

    return (this._worker = w);
  }

  runCode() {
    this._postMessage({ command: EWorkerCommand.CPU_RUN } as WorkerMessage);
  }

  stepCode() {
    this._postMessage({ command: EWorkerCommand.CPU_STEP } as WorkerMessage);
  }

  resetCpu() {
    this._postMessage({ command: EWorkerCommand.CPU_RESET } as WorkerMessage);
  }

  setHalted(halted: boolean) {
    this._postMessage({ command: EWorkerCommand.SET_CPU_HALT, data: halted } as WorkerMessage);
  }

  setFrequency(freq: number) {
    this._postMessage({ command: EWorkerCommand.SET_FREQUENCY, data: freq } as WorkerMessage);
  }

  setMemorySize(size: number) {
    this._postMessage({ command: EWorkerCommand.SET_FREQUENCY, data: size } as WorkerMessage);
  }

  requestCpuDump() {
    this._postMessage({ command: EWorkerCommand.CPU_DUMP } as WorkerMessage);
  }

  sendKey(key: number) {
    this._postMessage({ command: EWorkerCommand.KEY_EVENT, data: key } as WorkerMessage);
  }

  syncWorker(data: IProcessor<IDecodedInstruction>) {
    this._postMessage({
      command: EWorkerCommand.SYNC_WORKER,
      data: {
        cpu: data.cpu,
        memory: data.memory,
        frequency: data.frequency,
      },
    });
  }

  loadProgram(program: Parameters<IProcessor<IDecodedInstruction>['loadProgram']>[0]) {
    this._postMessage({ command: EWorkerCommand.LOAD_PROGRAM, data: program } as WorkerMessage);
  }

  terminate() {
    if (!this._worker) {
      console.log('cpu worker: tried to terminate a non initialized worker');
    }

    this._worker?.removeEventListener('message', this._onMessage);
    this._worker?.terminate();
    this._worker = null;
    this._workerRunning = false;
  }
}
