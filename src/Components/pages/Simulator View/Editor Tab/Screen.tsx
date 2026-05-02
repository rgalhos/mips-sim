import React, { useCallback, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { EWorkerCommand, WorkerMessageResponse } from '../../../../hardware/common/worker-service';
import { useSimulator } from '../../../../hooks/simulator.hook';

const SCREEN_DIV_SIZE = 500;
const SCREEN_SIZE = 100;
const FRAMEBUFFER_PIXELS = SCREEN_SIZE * SCREEN_SIZE;

// Converte o formato RGB332 do simulador para RGB888 que o canvas aceita
export function rgb332ToRgb888(v: number): [number, number, number] {
  const r3 = (v >> 5) & 7;
  const g3 = (v >> 2) & 7;
  const b2 = v & 3;
  return [Math.round((r3 * 255) / 7), Math.round((g3 * 255) / 7), Math.round((b2 * 255) / 3)];
}

export default function Screen() {
  const { simulator } = useSimulator();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const fbSnapshotRef = useRef<Uint8Array>(new Uint8Array(FRAMEBUFFER_PIXELS));
  const mergedMemoryRef = useRef<Uint8Array | null>(null);
  const fbLenWarnedRef = useRef(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let imageData = imageDataRef.current;
    if (!imageData || imageData.width !== SCREEN_SIZE || imageData.height !== SCREEN_SIZE) {
      imageData = ctx.createImageData(SCREEN_SIZE, SCREEN_SIZE);
      imageDataRef.current = imageData;
    }

    const fb = fbSnapshotRef.current;
    const { data } = imageData;
    for (let i = 0; i < FRAMEBUFFER_PIXELS; i++) {
      const [r, g, b] = rgb332ToRgb888(fb[i]);
      const o = i * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);

  const onDump = useCallback(
    (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
      const newDump = response.data;
      const proc = simulator.processor;
      const fbStart = Number(proc.FRAMEBUFFER_START);
      const fbEnd = Number(proc.FRAMEBUFFER_END);
      const fbByteLen = fbEnd - fbStart + 1;

      let memory = mergedMemoryRef.current;
      if (newDump.memory.length > 0) {
        memory = new Uint8Array(newDump.memory);
        mergedMemoryRef.current = memory;
      } else if (!memory) {
        memory = new Uint8Array(proc.memorySize);
        mergedMemoryRef.current = memory;
      }

      const diffEntries = Object.entries(newDump.memoryDiff);
      for (const [addrStr, val] of diffEntries) {
        memory[Number(addrStr)] = val;
      }

      const framebufferTouched =
        newDump.memory.length > 0 ||
        diffEntries.some(([addrStr]) => {
          const a = Number(addrStr);
          return a >= fbStart && a <= fbEnd;
        });

      if (!framebufferTouched) {
        return;
      }

      const fb = fbSnapshotRef.current;
      const copyLen = Math.min(FRAMEBUFFER_PIXELS, fbByteLen, Math.max(0, memory.length - fbStart));
      for (let i = 0; i < copyLen; i++) {
        fb[i] = memory[fbStart + i]!;
      }
      for (let i = copyLen; i < FRAMEBUFFER_PIXELS; i++) {
        fb[i] = 0;
      }

      if (fbByteLen !== FRAMEBUFFER_PIXELS && !fbLenWarnedRef.current) {
        fbLenWarnedRef.current = true;
        console.warn(
          `[Screen] FRAMEBUFFER length ${fbByteLen} ≠ ${FRAMEBUFFER_PIXELS}; extra bytes ignored or padded with 0.`,
        );
      }

      redraw();
    },
    [redraw, simulator.processor],
  );

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const ws = simulator.workerService;
    ws.on(EWorkerCommand.CPU_DUMP, onDump);
    ws.requestCpuDump();

    return () => {
      ws.off(EWorkerCommand.CPU_DUMP, onDump);
    };
  }, [simulator.workerService, onDump]);

  return (
    <>
      <Draggable>
        <div
          style={{
            cursor: 'grab',
            backgroundColor: 'grey',
            width: SCREEN_DIV_SIZE,
            height: SCREEN_DIV_SIZE,
            left: window.screen.width / 2 - 200,
            top: window.screen.height / 2 - 300,
            zIndex: 10,
            position: 'absolute',
            boxShadow: '0 2px 10px 20px rgba(0, 0, 0, 0.5)',
          }}
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
        </div>
      </Draggable>
    </>
  );
}
