import { Button } from "@/components/ui/button";
import { biguint32_to_f, biguint64_to_d } from "@/hardware/rv32/rv32.utils";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { X } from "lucide-react";
import { Fragment, useMemo } from "react";
import type { IByteSelection } from "./memory-byte-selection";
import { readUintLE, readUintLEBigInt } from "./memory-byte-selection";

type IMemoryByteInspectorProps = {
  selection: IByteSelection;
  memory: Uint8Array;
  anchor: { x: number; y: number };
  onClose: () => void;
};

function fmtHex(bytes: number[]) {
  return bytes.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

export function MemoryByteInspector({ selection, memory, anchor, onClose }: IMemoryByteInspectorProps) {
  const { simulator } = useSimulator();

  const byteCount = selection.end - selection.start;

  const bytes = useMemo(() => Array.from(memory.slice(selection.start, selection.end)), [memory, selection]);

  const intViews = useMemo(() => {
    const start = selection.start;
    const views: { label: string; value: string }[] = [];

    if (byteCount >= 1) {
      views.push({ label: "uint8", value: (readUintLE(memory, start, 1) & 0xff).toString() });
    }

    if (byteCount >= 2) {
      views.push({ label: "uint16", value: (readUintLE(memory, start, 2) & 0xffff).toString() });
    }

    if (byteCount >= 4) {
      views.push({ label: "uint32", value: readUintLE(memory, start, 4).toString() });
    }

    if (byteCount >= 8) {
      views.push({ label: "uint64", value: readUintLEBigInt(memory, start, 8).toString() });
    }

    if (byteCount >= 4) {
      views.push({ label: "float", value: biguint32_to_f(readUintLEBigInt(memory, start, 4)).toString() });
    }

    if (byteCount >= 8) {
      views.push({ label: "double", value: biguint64_to_d(readUintLEBigInt(memory, start, 8)).toString() });
    }

    if (byteCount == 4) {
      views.push({
        label: "instruction",
        value: simulator.processor.stringifyInstruction(
          simulator.processor.fromBytecode(readUintLEBigInt(memory, start, 4))
        ),
      });
    }

    return views;
  }, [memory, selection, byteCount]);

  // return (
  //   <div
  //     style={{
  //       left: anchor.x,
  //       top: anchor.y + 8,
  //       transform: "translateX(-50%)",
  //     }}
  //     onPointerDown={(e) => e.stopPropagation()}
  //   >
  //     <Popover>
  //       <PopoverContent>
  //         <div className="flex flex-col gap-1 font-mono text-xs">
  //           {intViews.map(({ label, value }) => (
  //             <div key={label} className="flex justify-between gap-4">
  //               <span className="text-muted-foreground">{label}</span>
  //               <span>{value}</span>
  //             </div>
  //           ))}
  //         </div>
  //       </PopoverContent>
  //     </Popover>
  //   </div>
  // );

  return (
    <div
      className="absolute z-50 rounded-md border bg-popover p-3 text-popover-foreground shadow-md"
      style={{
        left: anchor.x,
        top: anchor.y + 8,
        transform: "translateX(-50%)",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-muted-foreground">
            0x{selection.start.toString(16).toUpperCase().padStart(8, "0")}
            {byteCount > 1 && (
              <Fragment> - 0x{(selection.end - 1).toString(16).toUpperCase().padStart(8, "0")}</Fragment>
            )}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-5" onClick={onClose}>
          <X />
        </Button>
      </div>

      <p className="mb-2 font-mono text-sm">{fmtHex(bytes)}</p>

      <div className="flex flex-col gap-1 font-mono">
        {intViews.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
