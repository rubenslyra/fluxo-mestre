import { SYMBOLS, getShapePath, type SymbolKind } from "./symbols";
import type { FlowNode } from "./types";

interface NodeShapeProps {
  node: FlowNode;
  selected?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
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

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: "move" }}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      <path
        d={path}
        fill="var(--color-node)"
        stroke={selected ? "var(--color-node-selected)" : "var(--color-node-stroke)"}
        strokeWidth={selected ? 3 : 2}
      />
      <foreignObject x={-node.w / 2 + 8} y={-node.h / 2 + 4} width={node.w - 16} height={node.h - 8}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontSize: 13,
            color: "var(--color-foreground)",
            fontFamily: "var(--font-display)",
            wordBreak: "break-word",
            lineHeight: 1.2,
            userSelect: "none",
          }}
        >
          {node.label}
        </div>
      </foreignObject>

      {/* Out port(s) */}
      {isDecision ? (
        <>
          <PortDot cx={node.w / 2} cy={0} label="S" onMouseDown={(e) => onPortMouseDown?.("out", e)} />
          <PortDot cx={0} cy={node.h / 2} label="N" onMouseDown={(e) => onPortMouseDown?.("out", e)} />
        </>
      ) : (
        <PortDot cx={0} cy={node.h / 2} onMouseDown={(e) => onPortMouseDown?.("out", e)} />
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
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle
        r={6}
        fill="var(--color-accent)"
        stroke="var(--color-node-stroke)"
        strokeWidth={1.5}
        style={{ cursor: "crosshair" }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown?.(e);
        }}
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
    <svg width={size * ratio} height={size} viewBox={`${-(size * ratio) / 2} ${-size / 2} ${size * ratio} ${size}`}>
      <path d={path} fill="var(--color-node)" stroke="var(--color-node-stroke)" strokeWidth={1.5} />
    </svg>
  );
}
