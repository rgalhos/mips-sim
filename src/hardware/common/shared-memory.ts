export function isSharedMemoryAvailable(): boolean {
  return typeof SharedArrayBuffer !== "undefined" && globalThis.crossOriginIsolated === true;
}

export class SharedMemory {
  private _buffer: SharedArrayBuffer | ArrayBuffer;
  private _view: Uint8Array;

  constructor(size: number) {
    if (isSharedMemoryAvailable()) {
      this._buffer = new SharedArrayBuffer(size);

      console.log("simulator: we're in a cross-origin isolated secure context. using SharedArrayBuffer! yay");
    } else {
      this._buffer = new ArrayBuffer(size);

      console.warn(
        "simulator: not in a cross-origin isolared sceure context; SharedArrayBuffer unavailable! memory will be copied between threads."
      );
    }

    this._view = new Uint8Array(this._buffer);
  }

  get shared() {
    return this._buffer instanceof SharedArrayBuffer;
  }

  static attach(buffer: SharedArrayBuffer | ArrayBuffer, byteLength: number): Uint8Array {
    return new Uint8Array(buffer, 0, byteLength);
  }

  get buffer() {
    return this._buffer;
  }

  get view() {
    return this._view;
  }

  get byteLength() {
    return this._view.byteLength;
  }

  clear() {
    this._view.fill(0);
  }

  resize(size: number) {
    if (size === this._view.byteLength) return;

    const prev = this._view;
    const next = new SharedMemory(size);
    next._view.set(prev.subarray(0, Math.min(size, prev.byteLength)));

    this._buffer = next._buffer;
    this._view = next._view;
  }
}
