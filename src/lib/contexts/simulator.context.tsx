import type { ISimulator } from "@/hardware/common/simulator";
import { RVSimulator } from "@/hardware/rv32/rv32.simulator";
import { $settings } from "@/lib/stores/settings.store";
import { createContext, useCallback, useContext, useState } from "react";

const SimulatorContext = createContext(
  {} as {
    simulator: ISimulator;
    setSimulator: (simulator: ISimulator) => void;
    createSimulatorWorker: () => void;
  }
);

export const SimulatorProvider = ({ children }: { children: React.ReactNode }) => {
  const [simulator, setSimulator] = useState<ISimulator>(new RVSimulator());

  const createSimulatorWorker = useCallback(() => {
    if (!simulator.workerService.worker) {
      simulator.createCpuWorker();
      simulator.workerService.requestCpuDump();

      simulator.workerService.setFrequency($settings.get().stepSpeed);
    }
  }, [simulator]);

  return (
    <SimulatorContext.Provider
      value={{
        simulator,
        setSimulator,
        createSimulatorWorker,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulator = () => useContext(SimulatorContext);
