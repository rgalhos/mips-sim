import { EWorkerCommand } from '../common/worker-service';
import { RVProcessor } from './riscv.processor';

const cpu = new RVProcessor();

const postMessage = (message/*WorkerMessageResponse*/) => {
  self.postMessage(message);
};

self.onmessage = (event/*: MessageEvent<WorkerMessage>*/) => {
  const { command, data } = event.data;

  console.log('worker:', { command, data });

  if (command === EWorkerCommand.CPU_SETUP) {
    //@todo
  } else if (command === EWorkerCommand.CPU_RESET) {
    // @todo
  } else if (command === EWorkerCommand.CPU_RUN) {
    // @todo
  } else if (command === EWorkerCommand.CPU_STEP) {
    // @todo
  } else if (command === EWorkerCommand.SET_CPU_HALT) {
    const halted = cpu.setHalted(data);

    // postMessage({ command: EWorkerCommand.GET_CPU_HALT, data: halted });
  } else if (command === EWorkerCommand.GET_CPU_HALT) {
    postMessage({ command: EWorkerCommand.GET_CPU_HALT, data: cpu.halted });
  } else if (command === EWorkerCommand.SET_FREQUENCY) {
    const freq = cpu.setFrequency(data);

    //postMessage({ command: EWorkerCommand.GET_FREQUENCY, data: freq });
  } else if (command === EWorkerCommand.GET_FREQUENCY) {
    postMessage({ command: EWorkerCommand.GET_FREQUENCY, data: cpu.frequency });
  } else if (command === EWorkerCommand.LOAD_PROGRAM) {
    console.log('loaded cuuu', data)
    cpu.loadProgram(data);
  }
};
