import { useCallback, useState } from "react";

export const MEM_ROW_BYTES = 16;
export const MEM_ROW_HEIGHT_PX = 23;
export const HEX_DIGITS = "0123456789ABCDEF";
export const MEM_DIFF_FULL_REFRESH_THRESHOLD = 256;

type IMemoryInvalidation = {
  epoch: number;
  rows: Map<number, number>;
};

function rowAddrForByte(addr: number) {
  return addr - (addr % MEM_ROW_BYTES);
}

export function useMemoryInvalidation() {
  const [invalidation, setInvalidation] = useState<IMemoryInvalidation>({ epoch: 0, rows: new Map() });

  const bumpEpoch = useCallback(() => {
    setInvalidation((prev) => ({ epoch: prev.epoch + 1, rows: new Map() }));
  }, []);

  const applyMemoryDiff = useCallback((diff: Record<number, number>) => {
    const addresses = Object.keys(diff);

    if (addresses.length === 0) return;

    if (addresses.length >= MEM_DIFF_FULL_REFRESH_THRESHOLD) {
      setInvalidation((prev) => ({ epoch: prev.epoch + 1, rows: new Map() }));
      return;
    }

    setInvalidation((prev) => {
      const rows = new Map(prev.rows);

      for (const addrStr of addresses) {
        const rowAddr = rowAddrForByte(Number(addrStr));
        rows.set(rowAddr, (rows.get(rowAddr) ?? 0) + 1);
      }

      return { ...prev, rows };
    });
  }, []);

  return { invalidation, applyMemoryDiff, bumpEpoch };
}
