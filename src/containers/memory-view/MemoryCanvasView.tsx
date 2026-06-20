import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RVProcessor } from "@/hardware/rv32/rv32.processor";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { MemoryCanvasRenderer } from "./memory-canvas-renderer";
import { MEM_ROW_BYTES, MEM_ROW_HEIGHT_PX } from "./use-memory-invalidation";

type IMemoryCanvasViewProps = {
  invalidation: { epoch: number; rows: Map<number, number> };
};

export function MemoryCanvasView({ invalidation }: IMemoryCanvasViewProps) {
  const { simulator } = useSimulator();

  const memory = simulator.processor.memory;
  const memorySize = simulator.processor.memorySize;

  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<MemoryCanvasRenderer | null>(null);
  const hoverColumnRef = useRef<number | null>(null);

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

  const scrollToAddress = (address: number) => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

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
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const renderer = rendererRef.current;
    const scrollEl = scrollRef.current;
    if (!renderer || !scrollEl) return;

    const rect = scrollEl.getBoundingClientRect();
    const addr = renderer.hitTest(e.clientX - rect.left, e.clientY - rect.top);
    renderer.setHoverAddr(addr);
  };

  const handleMouseLeave = () => {
    rendererRef.current?.setHoverAddr(null);
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

        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            className="memory-hex-scroll h-full overflow-y-auto"
            onScroll={handleScroll}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div style={{ height: `${totalHeightPx}px` }} aria-hidden />
          </div>

          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 block h-full w-full" />
        </div>
      </div>
    </div>
  );
}
