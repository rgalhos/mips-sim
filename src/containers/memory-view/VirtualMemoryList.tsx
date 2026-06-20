import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RVProcessor } from "@/hardware/rv32/rv32.processor";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";
import { MemHexRow } from "./HexRow";
import { MEM_ROW_BYTES, MEM_ROW_HEIGHT_PX } from "./use-memory-invalidation";

type IVirtualMemoryListProps = {
  getRowVersion: (rowAddr: number) => number;
};

export function VirtualMemoryList({ getRowVersion }: IVirtualMemoryListProps) {
  const { simulator } = useSimulator();

  const memory = simulator.processor.memory;
  const memorySize = simulator.processor.memorySize;

  const scrollRef = useRef<HTMLDivElement>(null);
  const totalRows = Math.ceil(memorySize / MEM_ROW_BYTES);

  // @todo make generic
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
    [simulator]
  );

  const virtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => MEM_ROW_HEIGHT_PX,
    overscan: 8,
  });

  const scrollToAddress = (address: number) => {
    const clamped = Math.max(0, Math.min(address, memorySize - 1));
    const rowIndex = Math.floor(clamped / MEM_ROW_BYTES);
    virtualizer.scrollToIndex(rowIndex, { align: "start" });
  };

  // @todo: this sucks
  const handleMouseOver: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;

    if (!target || !target.hasAttribute("data-address") || !scrollRef.current) return;

    const addr = parseInt(target.getAttribute("data-address") as string, 10);
    const columnAddr = addr & 15;

    const elements = Array.from(scrollRef.current.querySelectorAll<HTMLElement>(`[data-address="${addr}"]`));

    const elementsColumn: HTMLElement[] = [];
    for (let i = 1; i < 32; i++) {
      const el = scrollRef.current.querySelector(`[data-address="${addr - i * 16}"]`);
      if (!el) break;

      elementsColumn.push(el as HTMLElement);
    }

    elementsColumn.push(document.querySelector(`[data-column="${columnAddr}"]`)!);

    const elementsRow = Array.from((elements[0].parentElement as HTMLElement).children).slice(
      0,
      columnAddr + 1
    ) as HTMLElement[];

    elements.forEach((el) => el.classList.add("active"));
    elementsRow.forEach((el) => el.classList.add("active-dim"));
    elementsColumn.forEach((el) => el.classList.add("active-dim"));

    target.addEventListener(
      "mouseleave",
      () => {
        elements.forEach((el) => el.classList.remove("active"));
        elementsRow.forEach((el) => el.classList.remove("active-dim"));
        elementsColumn.forEach((el) => el.classList.remove("active-dim"));
      },
      { once: true }
    );
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
        <div className="mem-hex-row shrink-0 border-b">
          <span className="mr-1.5 border-r pr-3.5">————————</span>
          <span className="byte" data-column={0x00}>
            00
          </span>
          <span className="byte" data-column={0x01}>
            01
          </span>
          <span className="byte" data-column={0x02}>
            02
          </span>
          <span className="byte" data-column={0x03}>
            03
          </span>
          <span className="byte" data-column={0x04}>
            04
          </span>
          <span className="byte" data-column={0x05}>
            05
          </span>
          <span className="byte" data-column={0x06}>
            06
          </span>
          <span className="byte" data-column={0x07}>
            07
          </span>
          <span className="byte" data-column={0x08}>
            08
          </span>
          <span className="byte" data-column={0x09}>
            09
          </span>
          <span className="byte" data-column={0x0a}>
            0A
          </span>
          <span className="byte" data-column={0x0b}>
            0B
          </span>
          <span className="byte" data-column={0x0c}>
            0C
          </span>
          <span className="byte" data-column={0x0d}>
            0D
          </span>
          <span className="byte" data-column={0x0e}>
            0E
          </span>
          <span className="byte" data-column={0x0f}>
            0F
          </span>
          <span className="ml-20" />
          ASCII...........
        </div>

        <div ref={scrollRef} className="memory-hex-scroll min-h-0 flex-1 overflow-y-auto">
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
            onMouseOver={handleMouseOver}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const rowAddr = virtualRow.index * MEM_ROW_BYTES;

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <MemHexRow memory={memory} rowAddr={rowAddr} version={getRowVersion(rowAddr)} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
