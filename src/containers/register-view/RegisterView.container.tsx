import { EWorkerCommand, type IWorkerCPUDump, type WorkerMessageResponse } from "@/hardware/common/worker-service";
import { biguint32_to_f } from "@/hardware/rv32/rv32.utils";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

function MemoRegisterViewContainer() {
  const { simulator } = useSimulator();
  const [registerDump, setRegisterDump] = useState<IWorkerCPUDump["cpu"]>(simulator.processor.cpu);
  const [toBlink, setToBlink] = useState<Record<string, 1>>({});

  const onDump = useCallback(
    (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
      setRegisterDump((prev) => {
        const next = response.data.cpu;
        const prevFriendly = simulator.processor.getRegistersFriendly(prev);
        const nextFriendly = simulator.processor.getRegistersFriendly(next);
        const blink: Record<string, 1> = {};

        for (const [reg, val] of Object.entries(nextFriendly)) {
          if (prevFriendly[reg] !== val) blink[reg] = 1;
        }

        setToBlink(blink);

        return next;
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

  const registerValues = useMemo(() => {
    if (!registerDump) return {};

    return simulator.processor.getRegistersFriendly(registerDump);
  }, [registerDump, simulator.processor]);

  return (
    <div className="register-block font-mono text-sm whitespace-pre-wrap">
      {Object.entries(registerValues).map(([reg, val]) => (
        <div key={reg} className={`reg px-1 reg-${reg} ${toBlink[reg] ? "blink-register" : ""}`}>
          {reg.padEnd(5, " ")} 0x{val.toString(16).toUpperCase().padStart(8, "0")} (
          {reg[0] === "f" ? biguint32_to_f(val).toString(10) : val.toString(10)}) {"\n"}
        </div>
      ))}
    </div>
  );
}

export const RegisterViewContainer = memo(MemoRegisterViewContainer);
