import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RVProcessor } from "@/hardware/rv32/rv32.processor";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MemoryByteInspector } from "./MemoryByteInspector";
import { MemoryCanvasRenderer } from "./memory-canvas-renderer";
import type { IByteSelection } from "./memory-byte-selection";
import { normalizeByteSelection } from "./memory-byte-selection";
import { MEM_ROW_BYTES, MEM_ROW_HEIGHT_PX } from "./use-memory-invalidation";

type IMemoryCanvasViewProps = {
  invalidation: { epoch: number; rows: Map<number, number> };
  pcHighlight: IByteSelection | null;
};

function clientToAddr(
  renderer: MemoryCanvasRenderer,
  scrollEl: HTMLDivElement,
  clientX: number,
  clientY: number
) {
  const rect = scrollEl.getBoundingClientRect();
  return renderer.hitTest(clientX - rect.left, clientY - rect.top);
}

export function MemoryCanvasView({ invalidation, pcHighlight }: IMemoryCanvasViewProps) {
  const { simulator } = useSimulator();

  const memory = simulator.processor.memory;
  const memorySize = simulator.processor.memorySize;

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<MemoryCanvasRenderer | null>(null);
  const hoverColumnRef = useRef<number | null>(null);
  const dragAnchorRef = useRef<number | null>(null);
  const selectionRef = useRef<IByteSelection | null>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);

  const [inspectorSelection, setInspectorSelection] = useState<IByteSelection | null>(null);
  const [inspectorAnchor, setInspectorAnchor] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalRows = Math.ceil(memorySize / MEM_ROW_BYTES);
  const totalHeightPx = totalRows * MEM_ROW_HEIGHT_PX;

  const processor = simulator.processor as RVProcessor;
  const regions = useMemo(
    () => [
      {
        label: ".text",
        address: Number(processor.PC_START),
        tooltip: "Executable section of the program.",
      },
      { label: ".rodata", address: Number(processor.RODATA_START), tooltip: "Store constant data" },
      { label: ".data", address: Number(processor.DATA_START), tooltip: "Global and static variables" },
      {
        label: ".bss",
        address: Number(processor.BSS_START),
        tooltip: "Uninitialized global and static variables",
      },
      {
        label: "System",
        address: Number(processor.KBD_STAT),
        tooltip: "Keyboard, terminal and other simulator I/O",
      },
      { label: "Video Memory", address: Number(processor.FB_START), tooltip: "Framebuffer" },
      {
        label: "Stack",
        address: Number(processor.STACK_START),
        tooltip: "Used for temporary storage; grows downward",
      },
    ],
    [processor]
  );

  const applySelection = useCallback((sel: IByteSelection | null) => {
    selectionRef.current = sel;
    rendererRef.current?.setSelection(sel);
  }, []);

  const closeInspector = useCallback(() => {
    setInspectorSelection(null);
    setInspectorAnchor(null);
    applySelection(null);
  }, [applySelection]);

  const updateInspectorAnchor = useCallback((sel: IByteSelection) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const bounds = renderer.getSelectionBounds(sel);
    if (!bounds) return;

    setInspectorAnchor({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height,
    });
  }, []);

  const setHeaderColumnHighlight = useCallback((column: number | null) => {
    const header = headerRef.current;
    if (!header) return;

    if (hoverColumnRef.current != null) {
      header.querySelector(`[data-column="${hoverColumnRef.current}"]`)?.classList.remove("active-dim");
    }

    hoverColumnRef.current = column;

    if (column != null) {
      header.querySelector(`[data-column="${column}"]`)?.classList.add("active-dim");
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new MemoryCanvasRenderer(canvas, memory, memorySize, setHeaderColumnHighlight);
    rendererRef.current = renderer;

    const syncSize = () => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
      renderer.resize(scrollEl.clientWidth, scrollEl.clientHeight);
      renderer.setScrollTop(scrollEl.scrollTop);
    };

    syncSize();

    const resizeObserver = new ResizeObserver(syncSize);
    if (scrollRef.current) resizeObserver.observe(scrollRef.current);

    return () => {
      resizeObserver.disconnect();
      renderer.destroy();
      rendererRef.current = null;
      setHeaderColumnHighlight(null);
    };
  }, [memory, memorySize, setHeaderColumnHighlight]);

  useEffect(() => {
    rendererRef.current?.setMemory(memory, memorySize);
  }, [memory, memorySize]);

  useEffect(() => {
    rendererRef.current?.schedulePaint();
  }, [invalidation]);

  useEffect(() => {
    rendererRef.current?.setPcHighlight(pcHighlight);
  }, [pcHighlight]);

  useEffect(() => {
    if (inspectorSelection) {
      updateInspectorAnchor(inspectorSelection);
    }
  }, [inspectorSelection, updateInspectorAnchor, invalidation]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (inspectorSelection && inspectorRef.current && !inspectorRef.current.contains(e.target as Node)) {
        const scrollEl = scrollRef.current;
        if (scrollEl && !scrollEl.contains(e.target as Node)) {
          closeInspector();
        }
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [inspectorSelection, closeInspector]);

  const scrollToAddress = (address: number) => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    closeInspector();

    const clamped = Math.max(0, Math.min(address, memorySize - 1));
    const rowIndex = Math.floor(clamped / MEM_ROW_BYTES);
    const top = rowIndex * MEM_ROW_HEIGHT_PX;

    scrollEl.scrollTo({ top });
    rendererRef.current?.setScrollTop(top);
  };

  const handleScroll = () => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    rendererRef.current?.setScrollTop(scrollEl.scrollTop);

    if (inspectorSelection) {
      updateInspectorAnchor(inspectorSelection);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    const renderer = rendererRef.current;
    const scrollEl = scrollRef.current;
    if (!renderer || !scrollEl) return;

    const addr = clientToAddr(renderer, scrollEl, e.clientX, e.clientY);
    if (addr == null) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    dragAnchorRef.current = addr;
    setIsDragging(true);
    setInspectorSelection(null);
    setInspectorAnchor(null);
    renderer.setHoverAddr(null);

    const sel = normalizeByteSelection(addr, addr, memorySize);
    applySelection(sel);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const renderer = rendererRef.current;
    const scrollEl = scrollRef.current;
    if (!renderer || !scrollEl) return;

    if (dragAnchorRef.current != null) {
      const addr = clientToAddr(renderer, scrollEl, e.clientX, e.clientY);
      if (addr == null) return;

      const sel = normalizeByteSelection(dragAnchorRef.current, addr, memorySize);
      applySelection(sel);
      return;
    }

    const addr = clientToAddr(renderer, scrollEl, e.clientX, e.clientY);
    renderer.setHoverAddr(addr);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragAnchorRef.current == null) return;

    dragAnchorRef.current = null;
    setIsDragging(false);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const sel = selectionRef.current;
    if (!sel) {
      applySelection(null);
      return;
    }

    applySelection(sel);
    setInspectorSelection(sel);
    updateInspectorAnchor(sel);
  };

  const handlePointerLeave = () => {
    if (dragAnchorRef.current == null) {
      rendererRef.current?.setHoverAddr(null);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    dragAnchorRef.current = null;
    setIsDragging(false);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    applySelection(null);
  };

  return (
    <div className="memory-hex-block flex h-full min-h-0 w-full flex-col">
      <div className="mb-2 flex flex-wrap gap-1">
        <ButtonGroup>
          {regions.map(({ label, address, tooltip }) => {
            if (!tooltip) {
              return (
                <Button key={label} variant="outline" onClick={() => scrollToAddress(address)}>
                  {label}
                </Button>
              );
            }

            return (
              <Tooltip key={label}>
                <TooltipTrigger render={<Button variant="outline" onClick={() => scrollToAddress(address)} />}>
                  {label}
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            );
          })}
        </ButtonGroup>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border px-2 py-1.5 font-mono tracking-tight tabular-nums">
        <div ref={headerRef} className="mem-hex-row shrink-0 border-b">
          <span className="mr-1.5 pr-4"> Address</span>
          <span className="byte mr-0.25" data-column={0}>
            00
          </span>
          <span className="byte mr-0.25" data-column={1}>
            01
          </span>
          <span className="byte mr-0.25" data-column={2}>
            02
          </span>
          <span className="byte mr-0.25" data-column={3}>
            03
          </span>
          <span className="byte mr-0.25" data-column={4}>
            04
          </span>
          <span className="byte mr-0.25" data-column={5}>
            05
          </span>
          <span className="byte mr-0.25" data-column={6}>
            06
          </span>
          <span className="byte mr-0.25" data-column={7}>
            07
          </span>
          <span className="byte mr-0.25" data-column={8}>
            08
          </span>
          <span className="byte mr-0.25" data-column={9}>
            09
          </span>
          <span className="byte mr-0.25" data-column={10}>
            0A
          </span>
          <span className="byte mr-0.25" data-column={11}>
            0B
          </span>
          <span className="byte mr-0.25" data-column={12}>
            0C
          </span>
          <span className="byte mr-0.25" data-column={13}>
            0D
          </span>
          <span className="byte mr-0.25" data-column={14}>
            0E
          </span>
          <span className="byte mr-0.25" data-column={15}>
            0F
          </span>
          <span className="ml-11.5" />A S C I I
        </div>

        <div ref={viewportRef} className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            className={`memory-hex-scroll h-full overflow-y-auto select-none ${isDragging ? "cursor-crosshair" : ""}`}
            onScroll={handleScroll}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerCancel}
          >
            <div style={{ height: `${totalHeightPx}px` }} aria-hidden />
          </div>

          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 block h-full w-full" />

          {inspectorSelection && inspectorAnchor && (
            <div ref={inspectorRef}>
              <MemoryByteInspector
                selection={inspectorSelection}
                memory={memory}
                anchor={inspectorAnchor}
                onClose={closeInspector}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
