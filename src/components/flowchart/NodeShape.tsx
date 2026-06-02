import { SYMBOLS, getShapePath, type SymbolKind } from "./symbols";
import { CSS_FONT_FAMILY, formatNodeTextLines, nodeTextBox, resolveTextStyle } from "./textStyle";
import type { FlowNode, ResizeHandle } from "./types";

interface NodeShapeProps {
  node: FlowNode;
  selected?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onPortMouseDown?: (port: "out", e: React.MouseEvent) => void;
  onPortMouseUp?: () => void;
  onResizeHandleMouseDown?: (handle: ResizeHandle, e: React.MouseEvent) => void;
}

export function NodeShape({
  node,
  selected,
  onMouseDown,
  onDoubleClick,
  onPortMouseDown,
  onPortMouseUp,
  onResizeHandleMouseDown,
}: NodeShapeProps) {
  const path = getShapePath(node.kind, node.w, node.h);
  const isGroup = node.kind === "group";
  const canResize = Boolean(selected && onResizeHandleMouseDown);
  const textStyle = resolveTextStyle(node);
  const textBox = nodeTextBox(node);
  const textLines = formatNodeTextLines(node.label, textStyle.listStyle);
  const justifyContent =
    textStyle.align === "left" ? "flex-start" : textStyle.align === "right" ? "flex-end" : "center";
  const title = textLines
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: "move" }}
      onMouseDown={onMouseDown}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDoubleClick?.(e);
      }}
    >
      {isGroup ? (
        <>
          <rect
            x={-node.w / 2}
            y={-node.h / 2}
            width={node.w}
            height={node.h}
            rx={12}
            fill={node.color ?? "var(--color-background)"}
            fillOpacity={node.color ? 0.25 : 0.45}
            stroke={selected ? "var(--color-node-selected)" : "var(--color-accent)"}
            strokeWidth={selected ? 3 : 2}
            strokeDasharray="10 6"
          />
          <path
            d={`M ${-node.w / 2 + 20} ${-node.h / 2 + 30} H ${node.w / 2 - 20}`}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            opacity={0.65}
            pointerEvents="none"
          />
          <foreignObject
            x={textBox.x}
            y={textBox.y}
            width={textBox.w}
            height={textBox.h}
            pointerEvents="none"
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent,
                overflow: "hidden",
                userSelect: "none",
              }}
            >
              <span
                style={{
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  borderRadius: 4,
                  background: "var(--color-background)",
                  padding: "0 8px",
                  color: "var(--color-foreground)",
                  fontFamily: CSS_FONT_FAMILY[textStyle.fontFamily],
                  fontSize: textStyle.fontSize,
                  fontWeight: 700,
                  lineHeight: textStyle.lineHeight,
                }}
              >
                {title || node.name || "Grupo"}
              </span>
            </div>
          </foreignObject>
        </>
      ) : (
        <path
          d={path}
          fill="var(--color-node)"
          stroke={selected ? "var(--color-node-selected)" : "var(--color-node-stroke)"}
          strokeWidth={selected ? 3 : 2}
        />
      )}
      {!isGroup && (
        <foreignObject
          x={textBox.x}
          y={textBox.y}
          width={textBox.w}
          height={textBox.h}
          pointerEvents="none"
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent,
              overflow: "hidden",
              textAlign: textStyle.align,
              fontSize: textStyle.fontSize,
              fontWeight: 400,
              color: "var(--color-foreground)",
              fontFamily: CSS_FONT_FAMILY[textStyle.fontFamily],
              lineHeight: textStyle.lineHeight,
              userSelect: "none",
            }}
          >
            <div style={{ width: "100%", maxHeight: "100%", overflow: "hidden" }}>
              {textLines.map((line, index) => (
                <div key={`${index}-${line}`} style={{ minHeight: "1em", wordBreak: "break-word" }}>
                  {line || "\u00a0"}
                </div>
              ))}
            </div>
          </div>
        </foreignObject>
      )}

      {/* In hover area */}
      <rect
        x={-node.w / 2}
        y={-node.h / 2}
        width={node.w}
        height={node.h}
        fill="transparent"
        onMouseUp={onPortMouseUp}
      />

      {/* Out ports on all 4 sides */}
      {!isGroup && (
        <>
          {/* Top */}
          <PortDot cx={0} cy={-node.h / 2} onMouseDown={(e) => onPortMouseDown?.("out", e)} />
          {/* Right */}
          <PortDot cx={node.w / 2} cy={0} onMouseDown={(e) => onPortMouseDown?.("out", e)} />
          {/* Bottom */}
          <PortDot cx={0} cy={node.h / 2} onMouseDown={(e) => onPortMouseDown?.("out", e)} />
          {/* Left */}
          <PortDot cx={-node.w / 2} cy={0} onMouseDown={(e) => onPortMouseDown?.("out", e)} />
        </>
      )}

      {canResize && (
        <ResizeHandles width={node.w} height={node.h} onMouseDown={onResizeHandleMouseDown} />
      )}
    </g>
  );
}

function ResizeHandles({
  width,
  height,
  onMouseDown,
}: {
  width: number;
  height: number;
  onMouseDown?: (handle: ResizeHandle, e: React.MouseEvent) => void;
}) {
  const offset = 14;
  const points: Array<{ handle: ResizeHandle; cx: number; cy: number }> = [
    { handle: "nw", cx: -width / 2 - offset, cy: -height / 2 - offset },
    { handle: "n", cx: 0, cy: -height / 2 - offset },
    { handle: "ne", cx: width / 2 + offset, cy: -height / 2 - offset },
    { handle: "e", cx: width / 2 + offset, cy: 0 },
    { handle: "se", cx: width / 2 + offset, cy: height / 2 + offset },
    { handle: "s", cx: 0, cy: height / 2 + offset },
    { handle: "sw", cx: -width / 2 - offset, cy: height / 2 + offset },
    { handle: "w", cx: -width / 2 - offset, cy: 0 },
  ];

  return (
    <>
      {points.map((point) => (
        <ResizeHandle
          key={point.handle}
          cx={point.cx}
          cy={point.cy}
          handle={point.handle}
          onMouseDown={onMouseDown}
        />
      ))}
    </>
  );
}

function ResizeHandle({
  cx,
  cy,
  handle,
  onMouseDown,
}: {
  cx: number;
  cy: number;
  handle: ResizeHandle;
  onMouseDown?: (handle: ResizeHandle, e: React.MouseEvent) => void;
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onMouseDown?.(handle, e);
  };

  const cursorMap: Record<ResizeHandle, string> = {
    nw: "nwse-resize",
    n: "ns-resize",
    ne: "nesw-resize",
    e: "ew-resize",
    se: "nwse-resize",
    s: "ns-resize",
    sw: "nesw-resize",
    w: "ew-resize",
  };

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <rect
        width={12}
        height={12}
        x={-6}
        y={-6}
        fill="var(--color-node-selected)"
        stroke="var(--color-node)"
        strokeWidth={1}
        rx={2}
        style={{ cursor: cursorMap[handle] ?? "default", pointerEvents: "auto" }}
        onMouseDown={handleMouseDown}
      />
    </g>
  );
}

function PortDot({
  cx,
  cy,
  label,
  onMouseDown,
}: {
  cx: number;
  cy: number;
  label?: string;
  onMouseDown?: (e: React.MouseEvent) => void;
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMouseDown?.(e);
  };

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle
        r={10}
        fill="transparent"
        style={{ cursor: "crosshair" }}
        onMouseDown={handleMouseDown}
      />
      <circle
        r={5}
        fill="var(--color-accent)"
        stroke="var(--color-node-stroke)"
        strokeWidth={1}
        style={{ pointerEvents: "none" }}
      />
      {label && (
        <text
          x={10}
          y={4}
          fontSize={11}
          fontWeight={700}
          fill="var(--color-foreground)"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

export function SymbolPreview({ kind, size = 56 }: { kind: SymbolKind; size?: number }) {
  const def = SYMBOLS[kind];
  const ratio = def.defaultWidth / def.defaultHeight;
  const w = size * ratio * 0.9;
  const h = size * 0.9;
  const path = getShapePath(kind, w, h);
  return (
    <svg
      width={size * ratio}
      height={size}
      viewBox={`${-(size * ratio) / 2} ${-size / 2} ${size * ratio} ${size}`}
    >
      <path d={path} fill="var(--color-node)" stroke="var(--color-node-stroke)" strokeWidth={1.5} />
    </svg>
  );
}
