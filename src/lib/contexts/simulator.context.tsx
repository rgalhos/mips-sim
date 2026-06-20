import type { ISimulator } from "@/hardware/common/simulator";
import { RVSimulator } from "@/hardware/rv32/rv32.simulator";
import { createContext, useCallback, useContext, useRef } from "react";

const SimulatorContext = createContext(
  {} as {
    simulator: ISimulator;
    createSimulatorWorker: () => void;
  }
);

export const SimulatorProvider = ({ children }: { children: React.ReactNode }) => {
  const simulatorRef = useRef<ISimulator | null>(null);

  if (!simulatorRef.current) {
    simulatorRef.current = new RVSimulator();
  }

  const simulator = simulatorRef.current;

  const createSimulatorWorker = useCallback(() => {
    if (!simulator.workerService.worker) {
      simulator.createCpuWorker();
      simulator.workerService.requestCpuDump();
    }
  }, [simulator]);

  return (
    <SimulatorContext.Provider
      value={{
        simulator,
        createSimulatorWorker,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulator = () => useContext(SimulatorContext);
