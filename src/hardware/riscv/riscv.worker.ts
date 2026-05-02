/* eslint-disable no-restricted-globals -- DedicatedWorkerGlobalScope */
import type { WorkerMessage, WorkerMessageResponse } from '../common/worker-service';
import { EWorkerCommand } from '../common/worker-service';
import { RVProcessor } from './riscv.processor';

const cpu = new RVProcessor();

const CPU_DUMP_EVERY_N_CYCLES = 10n;

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
  cpu.halted || (cpu.cycle > 0n && cpu.cycle % CPU_DUMP_EVERY_N_CYCLES === 0n);

let runTimer: ReturnType<typeof setTimeout> | null = null;

const cancelRunLoop = () => {
  if (runTimer !== null) {
    clearTimeout(runTimer);
    runTimer = null;
  }
};

const runLoopTick = () => {
  runTimer = null;
  if (cpu.halted) {
    return;
  }

  cpu.step();
  if (shouldPostDumpAfterStep()) {
    postCpuDump();
  }

  if (cpu.halted) {
    return;
  }

  const hz = Math.max(1, cpu.frequency);
  runTimer = setTimeout(runLoopTick, 1000 / hz);
};

const startRunLoop = () => {
  cancelRunLoop();
  runLoopTick();
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

    cpu.step();
    postCpuDump();
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

    console.log('SYNC INSIDE WORKER', { cpu, data });

    postCpuDump(true);
  }
};

export {};
