/**
 * Got these colors from:
 * https://simonomi.dev/blog/color-code-your-bytes/
 * That blog post also inspired me to build this hex viewer
 **/
export const NIBBLE_COLORS = [
  "oklch(75% 0.18 360)",
  "oklch(75% 0.18 23)",
  "oklch(75% 0.18 50)",
  "oklch(75% 0.18 65)",
  "oklch(75% 0.18 77)",
  "oklch(75% 0.18 103)",
  "oklch(75% 0.18 130)",
  "oklch(75% 0.18 142)",
  "oklch(75% 0.18 150)",
  "oklch(75% 0.18 163)",
  "oklch(75% 0.18 184)",
  "oklch(75% 0.18 209)",
  "oklch(75% 0.18 232)",
  "oklch(75% 0.18 254)",
  "oklch(75% 0.18 294)",
  "oklch(75% 0.18 328)",
] as const;

export const CANVAS_FONT = 'bold 16px ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

export const BASE_TEXT_COLOR = "oklch(70.8% 0 0)";
export const BYTE_COLOR_00 = "gray";
export const BYTE_COLOR_FF = "white";

export const HIGHLIGHT_ACTIVE_FILL = "rgba(255, 255, 255, 0.25)";
export const HIGHLIGHT_ACTIVE_STROKE = "#f38ba8";
export const HIGHLIGHT_DIM_FILL = "rgba(255, 255, 255, 0.1)";
export const HIGHLIGHT_DIM_STROKE = "rgba(255, 255, 255, 0.2)";
export const HIGHLIGHT_SELECTION_FILL = "rgba(137, 180, 250, 0.35)";
export const HIGHLIGHT_SELECTION_STROKE = "#89b4fa";

export function byteColor(byte: number) {
  if (byte === 0) return BYTE_COLOR_00;
  if (byte === 0xff) return BYTE_COLOR_FF;

  const hi = byte >> 4;
  return NIBBLE_COLORS[hi]!;
}
