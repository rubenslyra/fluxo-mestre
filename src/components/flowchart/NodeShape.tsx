import { SYMBOLS, getShapePath, type SymbolKind } from "./symbols";
import type { FlowNode } from "./types";

interface NodeShapeProps {
  node: FlowNode;
  selected?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onPortMouseDown?: (port: "out", e: React.MouseEvent) => void;
  onPortMouseUp?: () => void;
}

export function NodeShape({
  node,
  selected,
  onMouseDown,
  onDoubleClick,
  onPortMouseDown,
  onPortMouseUp,
}: NodeShapeProps) {
  const path = getShapePath(node.kind, node.w, node.h);
  const isDecision = node.kind === "decision";
  const isGroup = node.kind === "group";

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
            fill="var(--color-background)"
            fillOpacity={0.45}
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
        </>
      ) : (
        <path
          d={path}
          fill="var(--color-node)"
          stroke={selected ? "var(--color-node-selected)" : "var(--color-node-stroke)"}
          strokeWidth={selected ? 3 : 2}
        />
      )}
      <foreignObject
        x={-node.w / 2 + 8}
        y={isGroup ? -node.h / 2 + 8 : -node.h / 2 + 4}
        width={node.w - 16}
        height={isGroup ? node.h - 16 : node.h - 8}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: isGroup ? "center" : "center",
            justifyContent: isGroup ? "flex-start" : "center",
            textAlign: "center",
            fontSize: isGroup ? 12 : 13,
            fontWeight: isGroup ? 700 : 400,
            color: "var(--color-foreground)",
            fontFamily: "var(--font-display)",
            wordBreak: "break-word",
            lineHeight: isGroup ? 1.18 : 1.2,
            userSelect: "none",
            paddingTop: isGroup ? 10 : 0,
          }}
        >
          {node.label}
        </div>
      </foreignObject>

      {/* In hover area */}
      <rect
        x={-node.w / 2}
        y={-node.h / 2}
        width={node.w}
        height={node.h}
        fill="transparent"
        onMouseUp={onPortMouseUp}
      />

      {/* Out port(s) */}
      {isGroup ? null : isDecision ? (
        <>
          <PortDot
            cx={node.w / 2}
            cy={0}
            label="S"
            onMouseDown={(e) => onPortMouseDown?.("out", e)}
          />
          <PortDot
            cx={0}
            cy={node.h / 2}
            label="N"
            onMouseDown={(e) => onPortMouseDown?.("out", e)}
          />
        </>
      ) : (
        <PortDot cx={0} cy={node.h / 2} onMouseDown={(e) => onPortMouseDown?.("out", e)} />
      )}
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
        r={12}
        fill="transparent"
        style={{ cursor: "crosshair" }}
        onMouseDown={handleMouseDown}
      />
      <circle
        r={6}
        fill="var(--color-accent)"
        stroke="var(--color-node-stroke)"
        strokeWidth={1.5}
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
