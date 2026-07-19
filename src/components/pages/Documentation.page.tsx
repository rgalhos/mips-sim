import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { IManualInstruction, IManualRegister } from "@/hardware/common/manual";
import { useSimulator } from "@/lib/contexts/simulator.context";
import { Markdown } from "@/lib/markdown";
import { BookText } from "lucide-react";
import { memo, useMemo } from "react";

const REGISTER_KIND_COLOR: Record<string, string> = {
  pointer: "var(--catppuccin-mauve)",
  temporary: "var(--catppuccin-red)",
  saved: "var(--catppuccin-green)",
  argument: "var(--catppuccin-teal)",
};

const RegisterBadge = memo(function MemoRegisterBadge({ name, alias, kind, description }: IManualRegister) {
  const color = REGISTER_KIND_COLOR[kind] ?? "var(--muted-foreground)";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge variant="outline" style={{ borderColor: color, color }}>
            {alias || name}
          </Badge>
        }
      />
      <TooltipContent className="max-w-xs">
        <Markdown text={description} />
      </TooltipContent>
    </Tooltip>
  );
});

const InstructionSection = memo(function MemoInstructionSection({
  section,
  instructions,
  linkToManual,
}: {
  section: string;
  instructions: IManualInstruction[];
  linkToManual: (instruction: string) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-heading text-sm font-semibold">{section}</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instruction</TableHead>
            <TableHead>Operation</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[80px] text-center">Manual</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instructions.map((inst) => (
            <TableRow key={inst.name}>
              <TableCell className="font-mono">{inst.name}</TableCell>
              <TableCell className="font-mono">{inst.operation}</TableCell>
              <TableCell className="max-w-md min-w-64 whitespace-normal text-muted-foreground">
                <Markdown text={inst.description} />
              </TableCell>
              <TableCell className="text-center">
                <a
                  href={linkToManual(inst.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open manual for ${inst.name}`}
                  className="inline-flex text-muted-foreground hover:text-foreground"
                >
                  <BookText className="size-4" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

function MemoDocumentationPage() {
  const { simulator } = useSimulator();

  const sections = useMemo(() => {
    const bySection = new Map<string, IManualInstruction[]>();

    for (const inst of simulator.manual.instructions) {
      const list = bySection.get(inst.section);
      if (list) {
        list.push(inst);
      } else {
        bySection.set(inst.section, [inst]);
      }
    }

    return [...bySection.entries()];
  }, [simulator]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto pb-8">
      <h1 className="font-heading text-lg font-semibold">{simulator.name} Instruction Set</h1>

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-semibold">Registers</h2>
        <div className="grid grid-cols-[repeat(32,max-content)] gap-1.5">
          {simulator.manual.registers.map((reg) => (
            <RegisterBadge key={reg.name} {...reg} />
          ))}
        </div>
      </div>

      {sections.map(([section, instructions]) => (
        <InstructionSection
          key={section}
          section={section}
          instructions={instructions}
          linkToManual={(instruction) => simulator.linkToManual(instruction)}
        />
      ))}

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-sm font-semibold">Constants</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Constant</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {simulator.manual.consts.map((c) => (
              <TableRow key={c.name}>
                <TableCell className="font-mono">{c.name}</TableCell>
                <TableCell className="max-w-2xl min-w-64 whitespace-normal text-muted-foreground">
                  <Markdown text={c.description} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export const DocumentationPage = memo(MemoDocumentationPage);
