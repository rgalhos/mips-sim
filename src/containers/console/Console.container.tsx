import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EWorkerCommand, type WorkerMessageResponse } from "@/hardware/common/worker-service";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { type KeyboardEvent, memo, useEffect, useRef, useState } from "react";

const STDIN_MAX_LEN = 255;

const enum ETabs {
  TERMINAL,
  DEBUG,
}

const consoleTextareaClassName = cn(
  "min-h-[240px] w-full resize-none border border-input bg-background px-3 py-2 text-foreground",
  "select-text placeholder:text-muted-foreground focus-visible:outline-none"
);

function ConsoleClearButton({ onClear }: { onClear: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClear}
      aria-label="Clear console"
      className="absolute top-0 right-0 z-10"
    >
      <Trash2 />
    </Button>
  );
}

function MemoConsoleContainer() {
  const { simulator } = useSimulator();

  const terminalInputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLTextAreaElement>(null);
  const [terminalValue, setTerminalValue] = useState("");

  const debugRef = useRef<HTMLTextAreaElement>(null);
  const [debugValue, setDebugValue] = useState("");

  const handleClearTerminal = () => {
    setTerminalValue("");
  };

  const handleClearDebug = () => {
    setDebugValue("");
  };

  function submitInput() {
    const value = terminalInputRef.current?.value;
    if (!value) return;

    setTerminalValue((curr) => curr + value + "\n");
    terminalInputRef.current!.value = "";

    simulator.handleStdinInput(value);
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submitInput();
    }
  }

  useEffect(() => {
    const onMessage = (response: Extract<WorkerMessageResponse, { command: EWorkerCommand.TERMINAL_PRINT }>) => {
      setTerminalValue((prev) => prev + response.data);
    };

    simulator.workerService.on(EWorkerCommand.CPU_RESET, handleClearTerminal);
    simulator.workerService.on(EWorkerCommand.TERMINAL_PRINT, onMessage);

    return () => {
      simulator.workerService.off(EWorkerCommand.CPU_RESET, handleClearTerminal);
      simulator.workerService.off(EWorkerCommand.TERMINAL_PRINT, onMessage);
    };
  }, [simulator]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalValue]);

  useEffect(() => {
    if (debugRef.current) {
      debugRef.current.scrollTop = debugRef.current.scrollHeight;
    }
  }, [debugValue]);

  return (
    <Tabs value={ETabs.TERMINAL} className="mt-4 flex flex-col">
      <TabsList variant="line">
        <TabsTrigger value={ETabs.TERMINAL}>Terminal</TabsTrigger>
        <TabsTrigger value={ETabs.DEBUG}>Debug</TabsTrigger>
      </TabsList>

      <TabsContent value={ETabs.TERMINAL} keepMounted>
        <div className="relative flex flex-col font-mono">
          <ConsoleClearButton onClear={handleClearTerminal} />

          <textarea
            ref={terminalRef}
            readOnly
            value={terminalValue}
            placeholder="Empty"
            rows={10}
            className={consoleTextareaClassName}
          />

          <input
            ref={terminalInputRef}
            onKeyDown={handleInputKeyDown}
            placeholder="Terminal input"
            maxLength={STDIN_MAX_LEN}
            className={cn(
              "h-8 w-full border border-input bg-background px-3 text-foreground",
              "placeholder:text-muted-foreground focus-visible:outline-none"
            )}
          />
        </div>
      </TabsContent>

      <TabsContent value={ETabs.DEBUG} keepMounted>
        <div className="relative flex flex-col font-mono">
          <ConsoleClearButton onClear={handleClearDebug} />

          <textarea
            ref={debugRef}
            readOnly
            id="debugTxtArea"
            value={debugValue}
            placeholder="Empty"
            rows={10}
            className={consoleTextareaClassName}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

export const ConsoleContainer = memo(MemoConsoleContainer);
