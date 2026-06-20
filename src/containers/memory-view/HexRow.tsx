import { memo, useMemo, type ReactElement } from "react";
import { HEX_DIGITS, MEM_ROW_BYTES } from "./use-memory-invalidation";

function formatHexRow(memory: Uint8Array, offset: number) {
  const cells: ReactElement[] = [];
  const ascii: ReactElement[] = [];

  for (let i = 0; i < MEM_ROW_BYTES; i++) {
    const r = memory[offset + i] ?? 0;
    const hi = HEX_DIGITS[r >> 4]!;
    const lo = HEX_DIGITS[r & 0xf]!;
    const c = r > 31 && r < 127 ? String.fromCharCode(r) : ".";
    const address = offset + i;

    cells.push(
      <span key={`h${address}`} className={`byte nibble-${hi} nibble2-${lo}`} data-address={address}>
        {hi}
        {lo}
      </span>
    );

    ascii.push(
      <span key={`a${address}`} className={`char nibble-${hi} nibble2-${lo}`} data-address={address}>
        {c}
      </span>
    );
  }

  return { cells, ascii };
}

export const HexRow = memo(
  function HexRow({ memory, rowAddr, version }: { memory: Uint8Array; rowAddr: number; version: number }) {
    const { cells, ascii } = useMemo(() => formatHexRow(memory, rowAddr), [memory, rowAddr, version]);

    return (
      <>
        {cells}
        <span className="ml-20" />
        {ascii}
      </>
    );
  },
  (prev, next) => prev.rowAddr === next.rowAddr && prev.version === next.version
);

export const MemHexRow = memo(
  function MemHexRow({ memory, rowAddr, version }: { memory: Uint8Array; rowAddr: number; version: number }) {
    return (
      <div className="mem-hex-row">
        <span className="mr-1.5 border-r pr-3.5" data-row={rowAddr}>
          {rowAddr.toString(16).toUpperCase().padStart(8, "0")}
        </span>
        <HexRow memory={memory} rowAddr={rowAddr} version={version} />
      </div>
    );
  },
  (prev, next) => prev.rowAddr === next.rowAddr && prev.version === next.version
);
