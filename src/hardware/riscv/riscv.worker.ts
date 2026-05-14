/* eslint-disable no-restricted-globals -- DedicatedWorkerGlobalScope */
import type { WorkerMessage, WorkerMessageResponse } from '../common/worker-service';
import { EWorkerCommand } from '../common/worker-service';
import { rv_worker_commands } from './riscv.const';
import { RVProcessor } from './riscv.processor';

const cpu = new RVProcessor();

const postMessage = (message: WorkerMessageResponse) => {
  self.postMessage(message);
};

const postCpuDump = (fullDump = false) => {
  const memoryDiff = cpu._memoryOperationDiff;
  cpu._memoryOperationDiff = {};

  postMessage({
    command: EWorkerCommand.CPU_DUMP,
    data: {
      memory: fullDump ? cpu.memory : new Uint8Array(),
      memoryDiff: memoryDiff,
      cpu: {
        pc: cpu.cpu.pc,
        register: { ...cpu.cpu.register },
      },
      halted: cpu.halted,
      cycle: cpu.cycle,
      lastExecutedInstruction: cpu.lastExecutedInstruction,
    },
  });
};

const shouldPostDumpAfterStep = () =>
  cpu.halted || (cpu.cycle > 0 && cpu.cycle % Math.min(100, Math.ceil(cpu.frequency / 10)) === 0);

const cancelRunLoop = () => {
  cpu.setHalted(true);
};

const handleCpuStep = () => {
  const ret = +cpu.step();

  if (ret & rv_worker_commands.SYNC_LISTENERS) {
    postCpuDump(true);
  } else if (shouldPostDumpAfterStep()) {
    postCpuDump();
  }

  if (ret & rv_worker_commands.PRINT_STRING) {
    postMessage({ command: EWorkerCommand.TERMINAL_PRINT, data: cpu._workerBuffer });
  }
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const startRunLoop = async () => {
  let nextDeadline = performance.now();

  console.log(cpu.frequency);

  while (!cpu.halted) {
    const freq = Math.max(1, cpu.frequency);
    const periodMs = Math.max(1, 1000 / freq);
    const cyclesPerWake = Math.ceil(1 / periodMs);
    const sliceMs = cyclesPerWake * periodMs;

    for (let i = 0; i < cyclesPerWake && !cpu.halted; i++) {
      handleCpuStep();
    }

    if (cpu.halted) {
      break;
    }

    nextDeadline += sliceMs;
    let delay = nextDeadline - performance.now();

    if (delay > 0) {
      await sleep(delay);
    }
  }
};

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { command, data } = event.data;

  console.log('cpu worker:', { command, data, cpu });

  if (command === EWorkerCommand.CPU_SETUP) {
    //@todo
  } else if (command === EWorkerCommand.CPU_RESET) {
    cancelRunLoop();
    cpu.resetState();
  } else if (command === EWorkerCommand.CPU_RUN) {
    cpu.setHalted(!cpu.halted);

    if (cpu.halted) {
      cancelRunLoop();
    } else {
      startRunLoop();
    }

    postCpuDump();
  } else if (command === EWorkerCommand.CPU_STEP) {
    cancelRunLoop();
    cpu.setHalted(true);

    handleCpuStep();
  } else if (command === EWorkerCommand.SET_CPU_HALT) {
    if (data) {
      cancelRunLoop();
    }
    cpu.setHalted(data);

    // postMessage({ command: EWorkerCommand.GET_CPU_HALT, data: halted });
    postCpuDump();
  } else if (command === EWorkerCommand.GET_CPU_HALT) {
    postMessage({ command: EWorkerCommand.GET_CPU_HALT, data: cpu.halted });
  } else if (command === EWorkerCommand.SET_FREQUENCY) {
    cpu.setFrequency(data);

    //postMessage({ command: EWorkerCommand.GET_FREQUENCY, data: freq });
  } else if (command === EWorkerCommand.GET_FREQUENCY) {
    postMessage({ command: EWorkerCommand.GET_FREQUENCY, data: cpu.frequency });
  } else if (command === EWorkerCommand.LOAD_PROGRAM) {
    cancelRunLoop();
    console.log('cpu worker: debug: program loaded', { program: data, cpu });

    cpu.loadProgram(data as Parameters<RVProcessor['loadProgram']>[0]);

    postCpuDump();
  } else if (command === EWorkerCommand.MEMORY_RETRIEVE) {
    postMessage({ command: EWorkerCommand.MEMORY_RETRIEVE, data: cpu.memory });
  } else if (command === EWorkerCommand.CPU_DUMP) {
    postCpuDump();
  } else if (command === EWorkerCommand.ASSEMBLE_CODE) {
    //cpu.assembleCode(code:)
  } else if (command === EWorkerCommand.SET_MEMORY_SIZE) {
    cpu.setMemorySize(data);
  } else if (command === EWorkerCommand.SYNC_WORKER) {
    cancelRunLoop();
    cpu.resetState();

    cpu.cpu = data.cpu;
    cpu.memory = data.memory;

    postCpuDump(true);
    //@ts-expect-error data: never
    postMessage({ command: EWorkerCommand.CPU_RESET });
  } else if (command === EWorkerCommand.KEY_EVENT) {
    cpu.memoryWrite(cpu.KBD_STAT, 1n, 8);
    cpu.memoryWrite(cpu.KBD_DATA, BigInt(data), 8);
  }
};

export {};
