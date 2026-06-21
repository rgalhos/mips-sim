import type { IDecodedInstruction } from "@/hardware/common/processor";
import { EWorkerCommand, type WorkerMessageResponse } from "@/hardware/common/worker-service";
import type { RVProcessor } from "@/hardware/rv32/rv32.processor";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { MemoryCanvasView } from "./MemoryCanvasView";
import type { IByteSelection } from "./memory-byte-selection";
import { byteRange } from "./memory-byte-selection";
import { useMemoryInvalidation } from "./use-memory-invalidation";

type IMemoryMeta = {
  cycle: number;
  lastExecutedInstruction: IDecodedInstruction | null;
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

// @ts-expect-error bigint as index
const stringifyCache: Record<bigint, string> = {};

function MemoMemoryViewContainer({ visible = false }: { visible?: boolean }) {
  const { simulator } = useSimulator();
  const { invalidation, applyMemoryDiff, bumpEpoch } = useMemoryInvalidation();
  const processor = simulator.processor as RVProcessor;

  const [meta, setMeta] = useState<IMemoryMeta>({ cycle: 0, lastExecutedInstruction: null });
  const [pcHighlight, setPcHighlight] = useState<IByteSelection | null>(() =>
    byteRange(Number(processor.cpu.pc), processor.ILEN / 8, processor.memorySize)
  );

  const onDump = useCallback(
    (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
      const { cycle, lastExecutedInstruction, memoryDiff, halted, cpu } = response.data;

      setMeta({ cycle, lastExecutedInstruction: lastExecutedInstruction as IDecodedInstruction });
      setPcHighlight(byteRange(Number(cpu.pc), processor.ILEN / 8, processor.memorySize));

      const diffKeys = Object.keys(memoryDiff);
      if (diffKeys.length === 0 && halted && cycle === 0) {
        bumpEpoch();
        return;
      }

      applyMemoryDiff(memoryDiff);
    },
    [applyMemoryDiff, bumpEpoch, processor.ILEN, processor.memorySize]
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

    // @ts-expect-error bigint as index
    const v = stringifyCache[meta.lastExecutedInstruction.bytecode];
    if (v) return v;

    // @ts-expect-error bigint as index
    // eslint-disable-next-line
    return (stringifyCache[meta.lastExecutedInstruction.bytecode] = simulator.processor.stringifyInstruction(
      meta.lastExecutedInstruction
    ));
  }, [meta.lastExecutedInstruction, simulator.processor]);

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-2">
      <MemoryViewHeader cycle={Number(meta.cycle) || 0} lastInstruction={lastInstruction} />

      <MemoryCanvasView invalidation={invalidation} pcHighlight={pcHighlight} />
    </div>
  );
}

export const MemoryViewContainer = memo(MemoMemoryViewContainer);
