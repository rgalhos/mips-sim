import { Hammer, Monitor, Pause, Play, Settings, StepForward, Terminal, UndoDot } from "lucide-react";
import { memo, useMemo } from "react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function MemoSimulatorActions(props: {
  pendingChanges: boolean;
  onAssemble: () => void;
  cpuRunning: boolean;
  onToggleExecution: () => void;
  onStep: () => void;
}) {
  const simulatorActions = useMemo(
    () => [
      {
        Icon: props.cpuRunning ? <Pause color="var(--catppuccin-red)" /> : <Play color="var(--catppuccin-green)" />,
        label: "Run program",
        action: props.onToggleExecution,
      },
      { Icon: <UndoDot color="var(--catppuccin-blue)" />, label: "Step back", disabled: true, action: () => void 0 },
      { Icon: <StepForward color="var(--catppuccin-blue)" />, label: "Step one instruction", action: props.onStep },
      { Icon: <Settings />, label: "Simulator settings", action: () => void 0 },
    ],
    [props]
  );

  const simulatorTools = useMemo(
    () => [
      { Icon: <Terminal />, label: "Open terminal", action: () => void 0 },
      { Icon: <Monitor />, label: "Open screen", action: () => void 0 },
    ],
    []
  );

  return (
    <>
      <div className="ml-2 flex items-center gap-2 border-x px-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={
                  props.pendingChanges
                    ? "Your program was modified. Do not forget to reassemble ;)"
                    : "Assemble program."
                }
                onClick={props.onAssemble}
              />
            }
          >
            <Hammer />

            {props.pendingChanges && (
              <div
                style={{
                  marginTop: "-14px",
                  marginRight: "-22px",
                  position: "absolute",
                  width: "8px",
                  height: "8px",
                  background: "var(--catppuccin-red)",
                  borderRadius: "999px",
                }}
              />
            )}
          </TooltipTrigger>
          <TooltipContent>
            {props.pendingChanges ? "Your program was modified. Do not forget to reassemble ;)" : "Assemble program."}
          </TooltipContent>
        </Tooltip>

        {simulatorActions.map(({ Icon, label, action, disabled }) => (
          <Tooltip key={label}>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled ?? false}
                  aria-label={label}
                  onClick={action}
                />
              }
            >
              {Icon}
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex items-center gap-2 border-r px-2">
        {simulatorTools.map(({ Icon, label, action }) => (
          <Tooltip key={label}>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={action} />}>
              {Icon}
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </>
  );
}

export const SimulatorActions = memo(MemoSimulatorActions);
