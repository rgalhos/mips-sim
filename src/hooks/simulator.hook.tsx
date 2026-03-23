import { createContext, ReactNode, useContext, useState } from 'react';
import { ISimulator } from '../hardware/common/simulator';
import { RVSimulator } from '../hardware/riscv/riscv.simulator';

const SimulatorContext = createContext(
  {} as {
    simulator: ISimulator;
    setSimulator: (simulaltor: ISimulator) => void;
  },
);

export const SimulatorProvider = ({ children }: { children: ReactNode }) => {
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
