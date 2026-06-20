import { SimulatorActions } from "@/components/simulator-actions/SimulatorActions.component";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorContainer } from "@/containers/editor/Editor.container";
import { HexViewContainer } from "@/containers/hex-view/HexView.container";
import { RegisterViewContainer } from "@/containers/register-view/RegisterView.container";
import type { IAssemblerResult } from "@/hardware/common/simulator";
import { useEditor } from "@/lib/contexts/editor.context";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { MemoryViewContainer } from "../memory-view/MemoryView.container";

const enum ETabs {
  EDITOR,
  HEX_VIEW,
  MEMORY,
}

export function SimulatorContainer() {
  const { simulator, createSimulatorWorker } = useSimulator();
  const { editor } = useEditor();

  const [program, setProgram] = useState<IAssemblerResult>({ instructions: [], labels: {} });
  const [pendingChanges, setPendingChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<ETabs>(ETabs.EDITOR);

  function handleEditorChange() {
    setPendingChanges(true);
  }

  const onAssemble = useCallback(() => {
    if (!editor) {
      console.error("No editor!", { editor });
      return;
    }

    const code = editor.getValue() as string;

    createSimulatorWorker();

    try {
      const t0 = performance.now();
      const assembled = simulator.assembleCode(code);
      const t1 = performance.now();

      setProgram(assembled);

      console.log(`perf: Code assemble took ${t1 - t0}ms`);

      simulator.syncWorker();

      setPendingChanges(false);

      toast.success("Your code has been assembled.");
    } catch (e) {
      toast.error("err: " + e?.toString());
    }
  }, [editor, simulator, createSimulatorWorker]);

  const onToggleExecution = useCallback(() => {
    if (!simulator) {
      console.log("onToggleExecution: no simulator?????");
      return;
    } else if (!simulator.workerService.worker) {
      onAssemble();
    }

    if (simulator.processor.halted) {
      simulator.workerService.runCode();
    } else {
      simulator.workerService.setHalted(true);
    }
  }, [simulator, onAssemble]);

  const onStep = useCallback(() => {
    if (!simulator || !simulator.workerService.worker) {
      console.log("No simulator or worker");
      return;
    }

    simulator.workerService.stepCode();
  }, [simulator]);

  return (
    <TooltipProvider>
      <Tabs
        value={activeTab}
        onValueChange={(tab) => setActiveTab(tab as ETabs)}
        className="flex min-h-0 w-full flex-1 flex-col"
      >
        <div className="sticky top-0 z-10 shrink-0 bg-background">
          <TabsList variant="line" className="my-2">
            <TabsTrigger value={ETabs.EDITOR}>Editor</TabsTrigger>
            <TabsTrigger value={ETabs.HEX_VIEW}>Hex view</TabsTrigger>
            <TabsTrigger value={ETabs.MEMORY}>Memory</TabsTrigger>

            <SimulatorActions
              pendingChanges={pendingChanges}
              onAssemble={onAssemble}
              onToggleExecution={onToggleExecution}
              onStep={onStep}
            />
          </TabsList>
        </div>

        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel defaultSize="66.67%" className="flex min-h-0 flex-col">
            <TabsContent value={ETabs.EDITOR} keepMounted className="flex min-h-0 flex-1 flex-col">
              <EditorContainer handleEditorChange={handleEditorChange} />
            </TabsContent>

            <TabsContent value={ETabs.HEX_VIEW} keepMounted className="flex min-h-0 flex-1 flex-col">
              <HexViewContainer program={program} />
            </TabsContent>

            <TabsContent value={ETabs.MEMORY} keepMounted className="flex min-h-0 flex-1 flex-col">
              <MemoryViewContainer visible={activeTab === ETabs.MEMORY} />
            </TabsContent>
          </ResizablePanel>

          <ResizableHandle withHandle className="mx-4" />

          <ResizablePanel
            defaultSize="20%"
            maxSize="350px"
            minSize="50px"
            className="flex min-h-0 flex-col overflow-auto"
          >
            <RegisterViewContainer />
          </ResizablePanel>
        </ResizablePanelGroup>
      </Tabs>
    </TooltipProvider>
  );
}
