import type { ISimulator } from "@/hardware/common/simulator";
import { RVSimulator } from "@/hardware/rv32/rv32.simulator";
import { createContext, useContext, useState } from "react";

const SimulatorContext = createContext(
  {} as {
    simulator: ISimulator;
    setSimulator: (simulator: ISimulator) => void;
  }
);

export const SimulatorProvider = ({ children }: { children: React.ReactNode }) => {
  const [simulator, setSimulator] = useState<ISimulator>(new RVSimulator());

  return (
    <SimulatorContext.Provider
      value={{
        simulator,
        setSimulator,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulator = () => useContext(SimulatorContext);
