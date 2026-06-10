/* eslint-disable no-restricted-globals -- DedicatedWorkerGlobalScope */
import type { WorkerMessage, WorkerMessageResponse } from '../common/worker-service';
import { EWorkerCommand } from '../common/worker-service';
import { rv_worker_commands } from './riscv.const';
import { RVProcessor } from './riscv.processor';
import { IRVCPU } from './riscv.types';

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
        register: cpu.cpu.register,
        registerF: cpu.cpu.registerF,
      },
      halted: cpu.halted,
      cycle: cpu.cycle,
      lastExecutedInstruction: cpu.lastExecutedInstruction,
    },
  });

  postMessage({
    command: EWorkerCommand.CPU_DEBUG_DUMP,
    data: {
      memory: cpu._dbgMemChanges,
      registers: cpu._dbgRegChanges,
    },
  });

  cpu._dbgMemChanges = [];
  cpu._dbgRegChanges = [];
};

const shouldPostDumpAfterStep = () => cpu.halted || cpu.cycle % Math.max(100, Math.ceil(cpu.frequency / 10)) === 0;

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
  const t0 = Date.now();
  const freq = Math.max(1, cpu.frequency);
  const cyclesPerWake = Math.max(1, Math.ceil(freq / 1000));
  const sliceMs = (cyclesPerWake * 1000) / freq;
  let nextDeadline = Date.now();

  while (!cpu.halted) {
    for (let i = 0; i < cyclesPerWake && !cpu.halted; i++) {
      handleCpuStep();
    }

    nextDeadline += sliceMs;
    const delay = nextDeadline - Date.now();

    if (delay > 0) {
      await sleep(delay);
    }
  }

  const t1 = Date.now();

  const tDelta = t1 - t0;
  console.log(`perf: Program execution took ${tDelta}ms and ${cpu.cycle} cycles. (${cpu.cycle / (tDelta / 1000)}Hz)`);
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

    cpu.cpu = data.cpu as IRVCPU;
    cpu.memory = data.memory;
    cpu.setFrequency(data.frequency);

    postCpuDump(true);
    //@ts-expect-error data: never
    postMessage({ command: EWorkerCommand.CPU_RESET });
  } else if (command === EWorkerCommand.KEY_EVENT) {
    cpu.memoryWrite(cpu.KBD_STAT, 1n, 8);
    cpu.memoryWrite(cpu.KBD_DATA, BigInt(data), 8);
  }
};

export {};
