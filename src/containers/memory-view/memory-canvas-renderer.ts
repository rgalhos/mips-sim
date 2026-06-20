// @todo: i'm not used to manipulating <canvas> so cursor helped me a lot here; this code is a mess

import {
  BASE_TEXT_COLOR,
  CANVAS_FONT,
  HIGHLIGHT_ACTIVE_FILL,
  HIGHLIGHT_ACTIVE_STROKE,
  HIGHLIGHT_DIM_FILL,
  HIGHLIGHT_SELECTION_FILL,
  HIGHLIGHT_SELECTION_STROKE,
  byteColor,
} from "./memory-canvas.colors";
import type { IByteSelection } from "./memory-byte-selection";
import { HEX_DIGITS, MEM_ROW_BYTES, MEM_ROW_HEIGHT_PX } from "./use-memory-invalidation";

type IColumnLayout = {
  x: number;
  width: number;
};

export type IMemoryCanvasLayout = {
  rowHeight: number;
  addrX: number;
  addrWidth: number;
  hexCols: IColumnLayout[];
  asciiCols: IColumnLayout[];
};

function asciiChar(byte: number) {
  return byte > 31 && byte < 127 ? String.fromCharCode(byte) : ".";
}

export function buildMemoryCanvasLayout(ctx: CanvasRenderingContext2D): IMemoryCanvasLayout {
  ctx.font = CANVAS_FONT;

  const ch = ctx.measureText("0").width;
  const addrWidth = ctx.measureText("00000000").width;
  const addrPadding = 6 + 14; // old value was mr-1.5 + pr-3.5
  const hexStartX = addrWidth + addrPadding;

  const hexCols: IColumnLayout[] = [];
  let hx = hexStartX + ch;

  for (let i = 0; i < MEM_ROW_BYTES; i++) {
    const width = ctx.measureText("00").width;
    hexCols.push({ x: hx, width });
    hx += width + ch;
  }

  const asciiCols: IColumnLayout[] = [];
  let ax = hexCols[MEM_ROW_BYTES - 1]!.x + hexCols[MEM_ROW_BYTES - 1]!.width + 4 * ch + ch;

  for (let i = 0; i < MEM_ROW_BYTES; i++) {
    const width = ctx.measureText("W").width;
    asciiCols.push({ x: ax, width });
    ax += width + ch;
  }

  return {
    rowHeight: MEM_ROW_HEIGHT_PX,
    addrX: 0,
    addrWidth,
    hexCols,
    asciiCols,
  };
}

export class MemoryCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private layout: IMemoryCanvasLayout;
  private scrollTop = 0;
  private hoverAddr: number | null = null;
  private selection: IByteSelection | null = null;
  private paintRaf: number | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    private memory: Uint8Array,
    private memorySize: number,
    private onHoverColumnChange?: (column: number | null) => void
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    this.ctx = ctx;
    this.layout = buildMemoryCanvasLayout(ctx);
  }

  get totalRows() {
    return Math.ceil(this.memorySize / MEM_ROW_BYTES);
  }

  setMemory(memory: Uint8Array, memorySize: number) {
    this.memory = memory;
    this.memorySize = memorySize;
    this.schedulePaint();
  }

  resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;

    this.width = width;
    this.height = height;
    this.dpr = window.devicePixelRatio || 1;

    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.font = CANVAS_FONT;
    this.ctx.textBaseline = "middle";

    this.schedulePaint();
  }

  setScrollTop(scrollTop: number) {
    this.scrollTop = scrollTop;
    this.schedulePaint();
  }

  setHoverAddr(addr: number | null) {
    if (this.hoverAddr === addr) return;

    this.hoverAddr = addr;
    this.onHoverColumnChange?.(addr != null ? addr & (MEM_ROW_BYTES - 1) : null);
    this.schedulePaint();
  }

  setSelection(selection: IByteSelection | null) {
    this.selection = selection;
    this.schedulePaint();
  }

  getSelectionBounds(selection: IByteSelection) {
    const startRow = Math.floor(selection.start / MEM_ROW_BYTES);
    const endRow = Math.floor((selection.end - 1) / MEM_ROW_BYTES);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let row = startRow; row <= endRow; row++) {
      const rowStart = row * MEM_ROW_BYTES;
      const colFrom = row === startRow ? selection.start - rowStart : 0;
      const colTo = row === endRow ? selection.end - 1 - rowStart : MEM_ROW_BYTES - 1;

      const firstHex = this.layout.hexCols[colFrom]!;
      const lastHex = this.layout.hexCols[colTo]!;
      const y = this.rowY(row);

      minX = Math.min(minX, firstHex.x - 2);
      maxX = Math.max(maxX, lastHex.x + lastHex.width + 2);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + this.layout.rowHeight);
    }

    if (!Number.isFinite(minX)) return null;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  hitTest(canvasX: number, canvasY: number) {
    const contentY = canvasY + this.scrollTop;
    const row = Math.floor(contentY / this.layout.rowHeight);

    if (row < 0 || row >= this.totalRows) return null;

    const col = this.columnFromX(canvasX);
    if (col < 0) return null;

    const addr = row * MEM_ROW_BYTES + col;
    if (addr >= this.memorySize) return null;

    return addr;
  }

  schedulePaint() {
    if (this.paintRaf != null) return;

    this.paintRaf = requestAnimationFrame(() => {
      this.paintRaf = null;
      this.paint();
    });
  }

  destroy() {
    if (this.paintRaf != null) {
      cancelAnimationFrame(this.paintRaf);
    }
  }

  private columnFromX(x: number) {
    for (let i = 0; i < MEM_ROW_BYTES; i++) {
      const col = this.layout.hexCols[i]!;
      if (x >= col.x && x < col.x + col.width) return i;
    }

    for (let i = 0; i < MEM_ROW_BYTES; i++) {
      const col = this.layout.asciiCols[i]!;
      if (x >= col.x && x < col.x + col.width) return i;
    }

    return -1;
  }

  private rowY(row: number) {
    return row * this.layout.rowHeight - this.scrollTop;
  }

  private fillHighlight(x: number, y: number, width: number, height: number, fill: string) {
    const { ctx } = this;

    ctx.fillStyle = fill;
    ctx.fillRect(x - 1, y, width + 2, height);
  }

  private drawColumnHighlights() {
    if (this.hoverAddr == null) return;
    const col = this.hoverAddr & (MEM_ROW_BYTES - 1);
    const hoverRow = Math.floor(this.hoverAddr / MEM_ROW_BYTES);
    const endRow = hoverRow - 1;
    const startRow = Math.max(0, hoverRow - 64);

    if (endRow < startRow) return;

    const { rowHeight } = this.layout;
    const hexCol = this.layout.hexCols[col]!;

    const yTop = this.rowY(startRow);
    const yBottom = this.rowY(endRow) + rowHeight;

    const clipTop = Math.max(0, yTop);
    const clipBottom = Math.min(this.height, yBottom);

    if (clipTop >= clipBottom) return;

    const h = clipBottom - clipTop;

    this.fillHighlight(hexCol.x - 2, clipTop, hexCol.width + 4, h, HIGHLIGHT_DIM_FILL);
  }

  private drawRowHighlight(addr: number) {
    const row = Math.floor(addr / MEM_ROW_BYTES);
    const col = addr & (MEM_ROW_BYTES - 1);
    const { rowHeight } = this.layout;

    const yTop = this.rowY(row);
    const yBottom = yTop + rowHeight;

    const clipTop = Math.max(0, yTop);
    const clipBottom = Math.min(this.height, yBottom);
    if (clipTop >= clipBottom) return;

    const h = clipBottom - clipTop;

    const lastHex = this.layout.hexCols[col]!;
    const x = this.layout.addrX - 2;
    const width = lastHex.x + lastHex.width + 2 - x;

    this.fillHighlight(x, clipTop, width, h - 2, HIGHLIGHT_DIM_FILL);
  }

  private drawCellHighlightFill(addr: number) {
    const row = Math.floor(addr / MEM_ROW_BYTES);
    const col = addr & (MEM_ROW_BYTES - 1);
    const y = this.rowY(row);

    if (y + this.layout.rowHeight < 0 || y > this.height) return;

    const hexCol = this.layout.hexCols[col]!;
    const asciiCol = this.layout.asciiCols[col]!;

    const { ctx } = this;
    ctx.fillStyle = HIGHLIGHT_ACTIVE_FILL;
    ctx.fillRect(hexCol.x - 1, y, hexCol.width + 2, this.layout.rowHeight);
    ctx.fillRect(asciiCol.x - 1, y, asciiCol.width + 2, this.layout.rowHeight);
  }

  private drawCellHighlightStroke(addr: number) {
    const row = Math.floor(addr / MEM_ROW_BYTES);
    const col = addr & (MEM_ROW_BYTES - 1);
    const y = this.rowY(row);

    if (y + this.layout.rowHeight < 0 || y > this.height) return;

    const hexCol = this.layout.hexCols[col]!;
    const asciiCol = this.layout.asciiCols[col]!;

    const { ctx } = this;
    ctx.strokeStyle = HIGHLIGHT_ACTIVE_STROKE;
    ctx.lineWidth = 2;
    ctx.strokeRect(hexCol.x - 1, y, hexCol.width + 2, this.layout.rowHeight);
    ctx.strokeRect(asciiCol.x - 1, y, asciiCol.width + 2, this.layout.rowHeight);
  }

  private drawSelectionFill() {
    if (!this.selection) return;

    const { start, end } = this.selection;
    const startRow = Math.floor(start / MEM_ROW_BYTES);
    const endRow = Math.floor((end - 1) / MEM_ROW_BYTES);
    const { ctx, layout } = this;

    for (let row = startRow; row <= endRow; row++) {
      const rowStart = row * MEM_ROW_BYTES;
      const colFrom = row === startRow ? start - rowStart : 0;
      const colTo = row === endRow ? end - 1 - rowStart : MEM_ROW_BYTES - 1;

      const firstHex = layout.hexCols[colFrom]!;
      const lastHex = layout.hexCols[colTo]!;
      const y = this.rowY(row);

      if (y + layout.rowHeight < 0 || y > this.height) continue;

      const x = firstHex.x - 2;
      const width = lastHex.x + lastHex.width + 2 - x;

      ctx.fillStyle = HIGHLIGHT_SELECTION_FILL;
      ctx.fillRect(x, y, width, layout.rowHeight);
    }
  }

  private drawSelectionStroke() {
    if (!this.selection) return;

    const { start, end } = this.selection;
    const startRow = Math.floor(start / MEM_ROW_BYTES);
    const endRow = Math.floor((end - 1) / MEM_ROW_BYTES);
    const { ctx, layout } = this;

    for (let row = startRow; row <= endRow; row++) {
      const rowStart = row * MEM_ROW_BYTES;
      const colFrom = row === startRow ? start - rowStart : 0;
      const colTo = row === endRow ? end - 1 - rowStart : MEM_ROW_BYTES - 1;

      const firstHex = layout.hexCols[colFrom]!;
      const lastHex = layout.hexCols[colTo]!;
      const y = this.rowY(row);

      if (y + layout.rowHeight < 0 || y > this.height) continue;

      const x = firstHex.x - 2;
      const width = lastHex.x + lastHex.width + 2 - x;

      ctx.strokeStyle = HIGHLIGHT_SELECTION_STROKE;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, layout.rowHeight);
    }
  }

  private drawRow(row: number, y: number) {
    const { ctx, layout } = this;
    const rowAddr = row * MEM_ROW_BYTES;
    const centerY = y + layout.rowHeight / 2;

    ctx.fillStyle = BASE_TEXT_COLOR;
    ctx.fillText(rowAddr.toString(16).toUpperCase().padStart(8, "0"), layout.addrX, centerY);

    for (let col = 0; col < MEM_ROW_BYTES; col++) {
      const addr = rowAddr + col;
      if (addr >= this.memorySize) break;

      const byte = this.memory[addr] ?? 0;
      const hexCol = layout.hexCols[col]!;
      const asciiCol = layout.asciiCols[col]!;

      ctx.fillStyle = byteColor(byte);
      ctx.fillText(HEX_DIGITS[byte >> 4]! + HEX_DIGITS[byte & 0xf]!, hexCol.x, centerY);
      ctx.fillText(asciiChar(byte), asciiCol.x, centerY);
    }
  }

  private paint() {
    if (this.width <= 0 || this.height <= 0) return;

    const { ctx, layout } = this;
    ctx.clearRect(0, 0, this.width, this.height);

    const firstRow = Math.max(0, Math.floor(this.scrollTop / layout.rowHeight));
    const lastRow = Math.min(this.totalRows - 1, Math.ceil((this.scrollTop + this.height) / layout.rowHeight));

    if (this.hoverAddr != null && !this.selection) {
      this.drawColumnHighlights();
      this.drawRowHighlight(this.hoverAddr);
      this.drawCellHighlightFill(this.hoverAddr);
    }

    if (this.selection) {
      this.drawSelectionFill();
    }

    for (let row = firstRow; row <= lastRow; row++) {
      const y = this.rowY(row);
      if (y + layout.rowHeight < 0 || y > this.height) continue;
      this.drawRow(row, y);
    }

    if (this.hoverAddr != null && !this.selection) {
      this.drawCellHighlightStroke(this.hoverAddr);
    }

    if (this.selection) {
      this.drawSelectionStroke();
    }
  }
}
