import type { IRegisterReadable } from "@/hardware/common/processor";
import { EWorkerCommand, type WorkerMessageResponse } from "@/hardware/common/worker-service";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { fmtWordHex } from "@/lib/utils";
import { memo, useCallback, useEffect, useState } from "react";

const RegisterRow = memo(
  function MemoRegisterRow({
    reg,
    values,
    blink,
  }: {
    reg: string;
    values: IRegisterReadable[keyof IRegisterReadable];
    blink?: boolean;
  }) {
    return (
      <div className={`reg px-1 reg-${reg} ${blink ? "blink-register" : ""}`}>
        {reg.padEnd(5, " ")} {fmtWordHex(values.value)} ({values.str}) {"\n"}
      </div>
    );
  },
  (prev, next) => prev.values.value === next.values.value && prev.blink === next.blink
);

function MemoRegisterViewContainer() {
  const { simulator } = useSimulator();
  const [toBlink, setToBlink] = useState<Record<string, 1>>({});
  const [registers, setRegisters] = useState<IRegisterReadable>(
    simulator.processor.getRegistersReadable(simulator.processor.cpu)
  );

  const onDump = useCallback(
    (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
      setRegisters((prev) => {
        const next = response.data.cpu;
        const nextFriendly = simulator.processor.getRegistersReadable(next);
        const blink: Record<string, 1> = {};

        for (const [reg, v] of Object.entries(nextFriendly)) {
          if (prev[reg].value !== v.value) blink[reg] = 1;
        }

        setToBlink(blink);

        return simulator.processor.getRegistersReadable(next);
      });
    },
    [simulator.processor]
  );

  useEffect(() => {
    const ws = simulator.workerService;
    ws.on(EWorkerCommand.CPU_DUMP, onDump);
    ws.requestCpuDump();

    return () => {
      ws.off(EWorkerCommand.CPU_DUMP, onDump);
    };
  }, [simulator.workerService, onDump]);

  return (
    <div className="register-block font-mono text-sm whitespace-pre-wrap">
      {Object.entries(registers).map(([reg, values]) => (
        <RegisterRow key={reg} reg={reg} values={values} blink={!!toBlink[reg]} />
      ))}
    </div>
  );
}

export const RegisterViewContainer = memo(MemoRegisterViewContainer);
