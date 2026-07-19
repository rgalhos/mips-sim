import { Button } from "@/components/ui/button";
import { editorOptions, handleEditorWillMount } from "@/config/editor/editor.config";
import type { IManualExample } from "@/hardware/common/examples";
import { useEditor } from "@/lib/contexts/editor.context";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { EPage, setPage } from "@/lib/stores/page.store";
import { Editor } from "@monaco-editor/react";
import { memo, useEffect, useState } from "react";

const ExampleCard = memo(function MemoExampleCard({ example }: { example: IManualExample }) {
  const { editor } = useEditor();

  const handleLoad = () => {
    editor?.setValue(example.code);
    setPage(EPage.SIMULATOR);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-sm font-medium">{example.name}</p>

      <div className="overflow-hidden rounded-md border">
        <Editor
          height="200px"
          defaultValue={example.code}
          theme="rvsim-dark"
          beforeMount={handleEditorWillMount}
          options={{ ...editorOptions, readOnly: true, fontSize: 14, minimap: { enabled: false } }}
        />
      </div>

      <Button onClick={handleLoad} className="self-start">
        Load
      </Button>
    </div>
  );
});

function MemoExamplesPage() {
  const { simulator } = useSimulator();
  const [examples, setExamples] = useState<IManualExample[]>([]);

  useEffect(() => {
    let cancelled = false;

    simulator.examples().then((result) => {
      if (!cancelled) setExamples(result);
    });

    return () => {
      cancelled = true;
    };
  }, [simulator]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto pb-8">
      <h1 className="font-heading text-lg font-semibold">Examples</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {examples.map((example) => (
          <ExampleCard key={example.name} example={example} />
        ))}
      </div>
    </div>
  );
}

export const ExamplesPage = memo(MemoExamplesPage);
