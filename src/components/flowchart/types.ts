import type { SymbolKind } from "./symbols";

export interface FlowNode {
  id: string;
  kind: SymbolKind;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  /** Optional accent color (groups use it to tint the container and identify the set). */
  color?: string;
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

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  kind?: EdgeKind;
  /** Preferred exit side of the source node (decision Sim/Não, manual routing). */
  fromPort?: PortSide;
}

export interface FlowDoc {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
