export type IByteSelection = {
  start: number;
  end: number;
};

export function byteRange(start: number, spanBytes: number, memorySize: number): IByteSelection | null {
  const end = start + spanBytes;

  if (start < 0 || spanBytes <= 0 || end > memorySize) return null;

  return { start, end };
}

export const MAX_BYTE_SELECTION = 8;

export function normalizeByteSelection(
  anchor: number,
  current: number,
  memorySize: number
): IByteSelection | null {
  let start = Math.min(anchor, current);
  let end = Math.max(anchor, current) + 1;

  if (end - start > MAX_BYTE_SELECTION) {
    if (current >= anchor) {
      end = start + MAX_BYTE_SELECTION;
    } else {
      start = end - MAX_BYTE_SELECTION;
    }
  }

  start = Math.max(0, start);
  end = Math.min(memorySize, end);

  if (end <= start) return null;

  return { start, end };
}

export function readUintLE(memory: Uint8Array, offset: number, byteLength: number): number {
  let value = 0;

  for (let i = 0; i < byteLength; i++) {
    value |= (memory[offset + i] ?? 0) << (8 * i);
  }

  return value >>> 0;
}

export function readUintLEBigInt(memory: Uint8Array, offset: number, byteLength: number): bigint {
  let value = 0n;

  for (let i = 0; i < byteLength; i++) {
    value |= BigInt(memory[offset + i] ?? 0) << BigInt(8 * i);
  }

  return value;
}
