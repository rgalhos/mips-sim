/* eslint-disable no-restricted-globals -- DedicatedWorkerGlobalScope */
import { debounce } from '../../utils';
import type { WorkerMessage, WorkerMessageResponse } from '../common/worker-service';
import { EWorkerCommand } from '../common/worker-service';
import { RVProcessor } from './riscv.processor';

const cpu = new RVProcessor();

const postMessage = (message: WorkerMessageResponse) => {
  self.postMessage(message);
};

const postCpuDump = () => {
  postMessage({
    command: EWorkerCommand.CPU_DUMP,
    data: {
      memory: cpu.memory,
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

const debouncedPostCpuDump = debounce(postCpuDump, 100);

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { command, data } = event.data;

  console.log('cpu worker:', { command, data, cpu });

  if (command === EWorkerCommand.CPU_SETUP) {
    //@todo
  } else if (command === EWorkerCommand.CPU_RESET) {
    cpu.resetState();
  } else if (command === EWorkerCommand.CPU_RUN) {
    cpu.resetState();
    cpu.setHalted(false);

    console.log('shall run!!!!!!!!!!!!!!!!!!');

    cpu.run();
    debouncedPostCpuDump();
  } else if (command === EWorkerCommand.CPU_STEP) {
    cpu.setHalted(true);

    console.log('shall step!!!!!!!!!!!!!!!!!!');

    cpu.step();
    debouncedPostCpuDump();
  } else if (command === EWorkerCommand.SET_CPU_HALT) {
    cpu.setHalted(data);

    // postMessage({ command: EWorkerCommand.GET_CPU_HALT, data: halted });
    debouncedPostCpuDump();
  } else if (command === EWorkerCommand.GET_CPU_HALT) {
    postMessage({ command: EWorkerCommand.GET_CPU_HALT, data: cpu.halted });
  } else if (command === EWorkerCommand.SET_FREQUENCY) {
    cpu.setFrequency(data);

    //postMessage({ command: EWorkerCommand.GET_FREQUENCY, data: freq });
  } else if (command === EWorkerCommand.GET_FREQUENCY) {
    postMessage({ command: EWorkerCommand.GET_FREQUENCY, data: cpu.frequency });
  } else if (command === EWorkerCommand.LOAD_PROGRAM) {
    console.log('cpu worker: debug: program loaded', { program: data, cpu });

    cpu.loadProgram(data as Parameters<RVProcessor['loadProgram']>[0]);

    debouncedPostCpuDump();
  } else if (command === EWorkerCommand.MEMORY_RETRIEVE) {
    postMessage({ command: EWorkerCommand.MEMORY_RETRIEVE, data: cpu.memory });
  } else if (command === EWorkerCommand.CPU_DUMP) {
    postCpuDump();
  } else if (command === EWorkerCommand.ASSEMBLE_CODE) {
    //cpu.assembleCode(code:)
  } else if (command === EWorkerCommand.SET_MEMORY_SIZE) {
    cpu.setMemorySize(data);
  } else if (command === EWorkerCommand.SYNC_WORKER) {
    cpu.resetState();

    cpu.cpu = data.cpu;
    cpu.memory = data.memory;

    console.log('SYNC INSIDE WORKER', { cpu, data });

    debouncedPostCpuDump();
  }
};

export {};
