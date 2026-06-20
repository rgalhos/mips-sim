import { EWorkerCommand, type WorkerMessageResponse } from "@/hardware/common/worker-service";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { MemoryCanvasView } from "./MemoryCanvasView";
import { useMemoryInvalidation } from "./use-memory-invalidation";

type IMemoryMeta = {
  cycle: number;
  lastExecutedInstruction: unknown;
};

const MemoryViewHeader = memo(function MemoryViewHeader({
  cycle,
  lastInstruction,
}: {
  cycle: number;
  lastInstruction: string;
}) {
  return (
    <div className="mb-2 flex flex-col gap-1">
      <p className="font-bold">Last executed instruction: {lastInstruction}</p>
      <p className="font-bold">Current cycle: {cycle}</p>
    </div>
  );
});

function MemoMemoryViewContainer({ visible = false }: { visible?: boolean }) {
  const { simulator } = useSimulator();
  const { invalidation, applyMemoryDiff, bumpEpoch } = useMemoryInvalidation();

  const [meta, setMeta] = useState<IMemoryMeta>({ cycle: 0, lastExecutedInstruction: null });

  const onDump = useCallback(
    (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
      const { cycle, lastExecutedInstruction, memoryDiff, halted } = response.data;

      setMeta({ cycle, lastExecutedInstruction });

      const diffKeys = Object.keys(memoryDiff);
      if (diffKeys.length === 0 && halted && cycle === 0) {
        bumpEpoch();
        return;
      }

      applyMemoryDiff(memoryDiff);
    },
    [applyMemoryDiff, bumpEpoch]
  );

  useEffect(() => {
    if (!visible) return;

    bumpEpoch();

    const ws = simulator.workerService;
    ws.on(EWorkerCommand.CPU_DUMP, onDump);
    ws.requestCpuDump();

    return () => {
      ws.off(EWorkerCommand.CPU_DUMP, onDump);
    };
  }, [visible, simulator.workerService, onDump, bumpEpoch]);

  const lastInstruction = useMemo(() => {
    if (!meta.lastExecutedInstruction) return "-";

    return simulator.processor.stringifyInstruction(meta.lastExecutedInstruction);
  }, [meta.lastExecutedInstruction, simulator.processor]);

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-2">
      <MemoryViewHeader cycle={Number(meta.cycle) || 0} lastInstruction={lastInstruction} />

      <MemoryCanvasView invalidation={invalidation} />
    </div>
  );
}

export const MemoryViewContainer = memo(MemoMemoryViewContainer);
