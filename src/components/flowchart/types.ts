import type { SymbolKind } from "./symbols";

export interface FlowNode {
  id: string;
  kind: SymbolKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Optional technical name used for code/architecture generation. */
  name?: string;
  label: string;
  textStyle?: FlowNodeTextStyle;
  /** Optional accent color (groups use it to tint the container and identify the set). */
  color?: string;
}

export interface FlowPoint {
  x: number;
  y: number;
}

export type NodeTextAlign = "left" | "center" | "right";
export type NodeTextListStyle = "plain" | "bulleted" | "numbered";
export type NodeFontFamily = "display" | "sans" | "serif" | "mono";

export interface FlowNodeTextStyle {
  align?: NodeTextAlign;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: NodeFontFamily;
  listStyle?: NodeTextListStyle;
}

/**
 * Semantic + visual classification of a connection.
 * - `default`: a plain sequential flow.
 * - `true` / `false`: the two outcomes of a decision (Sim / Não).
 * - `loop`: a back-edge that returns to an earlier step (repetition).
 * - `return`: a corrective jump back to a previous step when a condition fails.
 */
export type EdgeKind = "default" | "true" | "false" | "loop" | "return";

/** Which anchor on the source node the edge leaves from. */
export type PortSide = "top" | "right" | "bottom" | "left";

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export interface FlowEdge {
  id: string;
  from: string;
  to?: string;
  /** Free endpoint used while a connection is intentionally not attached to a target node. */
  toPoint?: FlowPoint;
  label?: string;
  kind?: EdgeKind;
  /** Preferred exit side of the source node (decision Sim/Não, manual routing). */
  fromPort?: PortSide;
}

export interface FlowDoc {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
