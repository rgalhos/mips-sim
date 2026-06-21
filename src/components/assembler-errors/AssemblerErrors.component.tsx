import { stringifyTokenizerError, type IToken } from "@/hardware/rv32/analyzer/rv32-tokenizer";
import { useEditor } from "@/lib/contexts/editor.context";
import { cn } from "@/lib/utils";
import { TriangleAlertIcon } from "lucide-react";
import { useMemo } from "react";

export function AssemblerErrors({ errors }: { errors: Error[] }) {
  const { focusLine } = useEditor();

  const digestedErrors = useMemo(() => {
    return errors.map((e) => ({
      error: e,
      line: ((e.cause as IToken[]) || []).find((v) => v.lineNumber !== 0)?.lineNumber || 0,
      str: stringifyTokenizerError(e),
    }));
  }, [errors]);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="my-2 flex shrink-0 flex-col gap-1.5 border-t border-border">
      {digestedErrors.map((e, i) => (
        <div
          key={`errorno-${i}`}
          role="alert"
          className={cn(
            "flex cursor-pointer items-start gap-2 border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive"
          )}
          onClick={() => focusLine(e.line)}
        >
          <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{e.str}</span>
        </div>
      ))}
    </div>
  );
}
