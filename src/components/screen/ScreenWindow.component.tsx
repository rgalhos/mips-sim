import { Button } from "@/components/ui/button";
import { EWorkerCommand, type WorkerMessageResponse } from "@/hardware/common/worker-service";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { Monitor, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

const SCREEN_DISPLAY_SIZE = 400;

function rgb332ToRgb888(v: number): [number, number, number] {
  const r3 = (v >> 5) & 7;
  const g3 = (v >> 2) & 7;
  const b2 = v & 3;
  return [Math.round((r3 * 255) / 7), Math.round((g3 * 255) / 7), Math.round((b2 * 255) / 3)];
}

export function ScreenWindow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { simulator } = useSimulator();

  // @ts-expect-error bleeeeeh
  const FB_START = Number(simulator.processor.FB_START);
  // @ts-expect-error bleeeeeh
  const FB_END = Number(simulator.processor.FB_END);
  const SCREEN_SIZE = Math.max(1, Math.floor(Math.sqrt(Math.max(0, FB_END - FB_START + 1))));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const dragStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let imageData = imageDataRef.current;
    if (!imageData || imageData.width !== SCREEN_SIZE || imageData.height !== SCREEN_SIZE) {
      imageData = ctx.createImageData(SCREEN_SIZE, SCREEN_SIZE);
      imageDataRef.current = imageData;
    }

    const memory = simulator.processor.memory;
    const { data } = imageData;
    const pixelCount = SCREEN_SIZE * SCREEN_SIZE;

    for (let i = 0; i < pixelCount; i++) {
      const addr = FB_START + i;
      const value = addr < memory.length ? (memory[addr] ?? 0) : 0;
      const [r, g, b] = rgb332ToRgb888(value);
      const o = i * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }, [FB_START, SCREEN_SIZE, simulator.processor]);

  useEffect(() => {
    if (!open) return;
    redraw();
  }, [open, redraw]);

  useEffect(() => {
    if (!open) return;

    const ws = simulator.workerService;

    const onDump = (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.CPU_DUMP }>) => {
      if (simulator.processor.optExplicitScreenUpdate) return;

      for (const addrStr in response.data.memoryDiff) {
        const addr = Number(addrStr);
        if (addr >= FB_START && addr <= FB_END) {
          redraw();
          return;
        }
      }
    };

    ws.on(EWorkerCommand.CPU_DUMP, onDump);
    ws.on(EWorkerCommand.UPDATE_SCREEN, redraw);
    ws.on(EWorkerCommand.CPU_RESET, redraw);
    ws.requestCpuDump();

    return () => {
      ws.off(EWorkerCommand.CPU_DUMP, onDump);
      ws.off(EWorkerCommand.UPDATE_SCREEN, redraw);
      ws.off(EWorkerCommand.CPU_RESET, redraw);
    };
  }, [open, simulator, redraw, FB_START, FB_END]);

  const handleDragPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;

    dragStateRef.current = { startX: e.clientX, startY: e.clientY, originX: position.x, originY: position.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDragPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;

    setPosition({ x: drag.originX + (e.clientX - drag.startX), y: drag.originY + (e.clientY - drag.startY) });
  };

  const handleDragPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStateRef.current = null;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    simulator.handleKeyPress(e.nativeEvent);
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed z-50 flex flex-col gap-2 rounded-xl border bg-popover p-3 text-popover-foreground shadow-2xl ring-1 ring-foreground/10"
      style={{
        left: "50%",
        top: "50%",
        width: SCREEN_DISPLAY_SIZE + 24,
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
      }}
    >
      <div
        className="flex cursor-grab items-center justify-between gap-2 border-b pb-2 select-none active:cursor-grabbing"
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerUp}
        onPointerCancel={handleDragPointerUp}
      >
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Monitor className="size-4" />
          Screen
        </span>

        <Button variant="ghost" size="icon-xs" aria-label="Close screen" onClick={onClose}>
          <X />
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        width={SCREEN_SIZE}
        height={SCREEN_SIZE}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="bg-black outline-none"
        style={{
          imageRendering: "pixelated",
          width: SCREEN_DISPLAY_SIZE,
          height: SCREEN_DISPLAY_SIZE,
        }}
      />
    </div>,
    document.body
  );
}
