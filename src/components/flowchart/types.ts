import type { SymbolKind } from "./symbols";

export interface FlowNode {
  id: string;
  kind: SymbolKind;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface FlowDoc {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
