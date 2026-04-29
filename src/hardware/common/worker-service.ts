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
  LOAD_PROGRAM = 'LOAD_PROGRAM',
  SET_MEMORY_SIZE = 'SET_MEMORY_SIZE',
  MEMORY_RETRIEVE = 'MEMORY_RETRIEVE',
  CPU_DUMP = 'CPU_DUMP',
  MEMORY_OVERWRITE = 'MEMORY_OVERWRITE',
  ASSEMBLE_CODE = 'ASSEMBLE_CODE',
  SYNC_WORKER = 'SYNC_WORKER',
}

export interface IWorkerCPUDump {
  memory: Uint8Array;
  cpu: ICPU;
  cycle: bigint;
  halted: boolean;
  lastExecutedInstruction: any;
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
      };
    }
  | {
      command: EWorkerCommand.SET_FREQUENCY | EWorkerCommand.SET_MEMORY_SIZE;
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
        | EWorkerCommand.CPU_DUMP;
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
      command: EWorkerCommand.CPU_SETUP | EWorkerCommand.CPU_RUN | EWorkerCommand.CPU_STEP | EWorkerCommand.CPU_RESET;
      data: never;
    };

export class WorkerService {
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

  syncWorker(data: IProcessor<IDecodedInstruction>) {
    console.log('SYNC', data);
    this._postMessage({
      command: EWorkerCommand.SYNC_WORKER,
      data: {
        cpu: data.cpu,
        memory: data.memory,
      },
    });
  }

  loadProgram(program: Parameters<IProcessor<IDecodedInstruction>['loadProgram']>[0]) {
    this._postMessage({ command: EWorkerCommand.LOAD_PROGRAM, data: program } as WorkerMessage);
  }

  requestCpuDump(timeoutMs = 3000): Promise<IWorkerCPUDump> {
    const worker = this._worker;
    if (!worker) {
      return Promise.reject(new Error('Worker CPU não está ativo'));
    }

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        worker.removeEventListener('message', onMessage);
        reject(new Error(`CPU_DUMP: tempo esgotado (${timeoutMs} ms)`));
      }, timeoutMs);

      const onMessage = (ev: MessageEvent<WorkerMessageResponse>) => {
        const msg = ev.data;
        if (msg.command !== EWorkerCommand.CPU_DUMP) {
          return;
        }
        window.clearTimeout(timer);
        worker.removeEventListener('message', onMessage);
        resolve(msg.data);
      };

      worker.addEventListener('message', onMessage);
      this._postMessage({ command: EWorkerCommand.CPU_DUMP } as WorkerMessage);
    });
  }

  terminate() {
    if (!this._worker) {
      console.log('cpu worker: tried to terminate a non initialized worker');
    }

    this._worker?.terminate();
    this._worker = null;
    this._workerRunning = false;
  }
}
