import React, { useCallback, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { EWorkerCommand, WorkerMessageResponse } from '../../../../hardware/common/worker-service';
import { useSimulator } from '../../../../hooks/simulator.hook';

const SCREEN_DIV_SIZE = 500;

export default function Screen({ visible = false }: { visible?: boolean }) {
  const { simulator } = useSimulator();

  const FB_START = Number(simulator.processor.FB_START);
  const FB_END = Number(simulator.processor.FB_END);
  const FB_BYTE_LEN = Math.max(0, FB_END - FB_START + 1);
  const SCREEN_SIZE = Math.floor(Math.sqrt(FB_BYTE_LEN));
  const CANVAS_PIXELS = SCREEN_SIZE * SCREEN_SIZE;

  const screenRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const fbSnapshotRef = useRef(new Uint8Array(0));

  if (fbSnapshotRef.current.length !== FB_BYTE_LEN) {
    fbSnapshotRef.current = new Uint8Array(FB_BYTE_LEN);
  }

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx = canvasCtxRef.current;
    if (!ctx || ctx.canvas !== canvas) {
      ctx = canvas.getContext('2d');
      canvasCtxRef.current = ctx;
    }

    if (!ctx) return;
    if (SCREEN_SIZE < 1) return;

    let imageData = imageDataRef.current;
    if (!imageData || imageData.width !== SCREEN_SIZE || imageData.height !== SCREEN_SIZE) {
      imageData = ctx.createImageData(SCREEN_SIZE, SCREEN_SIZE);
      imageDataRef.current = imageData;
    }

    const fb = fbSnapshotRef.current;
    const { data } = imageData;

    for (let i = 0; i < CANVAS_PIXELS; i++) {
      const v = i < fb.length ? fb[i]! : 0;
      const r3 = (v >> 5) & 7;
      const g3 = (v >> 2) & 7;
      const b2 = v & 3;
      const o = i * 4;
      data[o] = Math.round((r3 * 255) / 7);
      data[o + 1] = Math.round((g3 * 255) / 7);
      data[o + 2] = Math.round((b2 * 255) / 3);
      data[o + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }, [SCREEN_SIZE, CANVAS_PIXELS, visible]);

  const onDump = useCallback(
    (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
      const newDump = response.data;

      const isFullMemory = newDump.memory.length > 0;
      const diff = newDump.memoryDiff;
      let framebufferTouched = isFullMemory;
      const fb = fbSnapshotRef.current;

      if (isFullMemory) {
        const memory = newDump.memory;
        const copyLen = Math.min(fb.length, FB_BYTE_LEN, Math.max(0, memory.length - FB_START));
        fb.set(memory.subarray(FB_START, FB_START + copyLen));
      }

      for (const addrStr in diff) {
        if (!Object.prototype.hasOwnProperty.call(diff, addrStr)) continue;

        const addr = Number(addrStr);
        if (addr < FB_START || addr > FB_END) continue;

        const fbIdx = addr - FB_START;
        if (fbIdx >= fb.length) continue;

        fb[fbIdx] = diff[addrStr]!;
        framebufferTouched = true;
      }

      if (!framebufferTouched) {
        return;
      }

      const explicitScreenUpdate = simulator.processor.optExplicitScreenUpdate;

      if (!explicitScreenUpdate && visible) {
        redraw();
      }
    },
    [redraw, FB_START, FB_END, FB_BYTE_LEN, visible, simulator.processor],
  );

  const onUpdateScreen = useCallback(() => {
    if (visible) {
      redraw();
    }
  }, [visible, redraw]);

  useEffect(() => {
    if (!visible) return;
    redraw();
  }, [visible, redraw, SCREEN_SIZE]);

  useEffect(() => {
    const ws = simulator.workerService;
    ws.on(EWorkerCommand.CPU_DUMP, onDump);
    ws.on(EWorkerCommand.UPDATE_SCREEN, onUpdateScreen);
    ws.on(EWorkerCommand.CPU_RESET, redraw);
    ws.requestCpuDump();

    return () => {
      ws.off(EWorkerCommand.CPU_DUMP, onDump);
      ws.off(EWorkerCommand.UPDATE_SCREEN, onUpdateScreen);
      ws.off(EWorkerCommand.CPU_RESET, redraw);
    };
  }, [simulator.workerService, onDump, onUpdateScreen, redraw]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!visible) return;

      e.preventDefault();
      e.stopPropagation();

      simulator.handleKeyPress(e);
    },
    [simulator, visible],
  );

  useEffect(() => {
    const ref = screenRef.current;

    ref?.addEventListener('keydown', handleKeyPress, true);

    return () => ref?.removeEventListener('keydown', handleKeyPress, true);
  }, [handleKeyPress]);

  return (
    <Draggable>
      <div
        style={{
          cursor: 'grab',
          backgroundColor: 'grey',
          width: SCREEN_DIV_SIZE,
          height: SCREEN_DIV_SIZE,
          left: window.innerWidth / 2 - SCREEN_DIV_SIZE / 2,
          top: window.innerHeight / 2 - SCREEN_DIV_SIZE / 2,
          zIndex: 10,
          position: 'absolute',
          boxShadow: '0 2px 10px 20px rgba(0, 0, 0, 0.5)',
        }}
        onClick={() => screenRef.current?.focus({ preventScroll: true })}
      >
        <canvas
          ref={canvasRef}
          width={SCREEN_SIZE}
          height={SCREEN_SIZE}
          style={{
            imageRendering: 'pixelated',
            position: 'absolute',
            width: SCREEN_DIV_SIZE,
            height: SCREEN_DIV_SIZE,
          }}
        />

        <input type="text" style={{ opacity: 0, maxWidth: 0, maxHeight: 0 }} ref={screenRef} />
      </div>
    </Draggable>
  );
}
