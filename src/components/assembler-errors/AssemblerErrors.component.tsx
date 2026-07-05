import { stringifySemanticError } from "@/hardware/rv32/analyzer/rv32-analyzer.assembler";
import { stringifyTokenizerError, type IToken } from "@/hardware/rv32/analyzer/rv32-lexer.assembler";
import { stringifyParseError } from "@/hardware/rv32/analyzer/rv32-parser.assembler";
import { useEditor } from "@/lib/contexts/editor.context";
import { cn } from "@/lib/utils";
import { TriangleAlertIcon } from "lucide-react";
import { useMemo } from "react";

function stringifyAssemblerError(e: Error) {
  if (e.message === "ASSEMBLER_PARSE_ERROR") return stringifyParseError(e);
  if (e.message === "ASSEMBLER_SEMANTIC_ERROR") return stringifySemanticError(e);
  return stringifyTokenizerError(e);
}

function errorLine(e: Error): number {
  const cause = e.cause;
  if (cause && typeof cause === "object" && "line" in cause && typeof cause.line === "number") {
    return cause.line;
  }
  const tokens = (cause as IToken[] | undefined) ?? [];
  return tokens.find((v) => v.origin !== 0)?.origin ?? 0;
}

export function AssemblerErrors({ errors }: { errors: Error[] }) {
  const { focusLine } = useEditor();

  const digestedErrors = useMemo(() => {
    return errors.map((e) => ({
      error: e,
      line: errorLine(e),
      str: stringifyAssemblerError(e),
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
