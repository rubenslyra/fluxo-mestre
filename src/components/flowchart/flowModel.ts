import type { FlowDoc, FlowEdge, FlowNode } from "./types";

export type Point = { x: number; y: number };
export type SelectionBox = { startX: number; startY: number; x: number; y: number };
export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  w: number;
  h: number;
};

export function normalizeSelectionBox(box: SelectionBox) {
  const x = Math.min(box.startX, box.x);
  const y = Math.min(box.startY, box.y);
  const w = Math.abs(box.x - box.startX);
  const h = Math.abs(box.y - box.startY);
  return { x, y, w, h };
}

export function nodeIntersectsSelection(
  node: FlowNode,
  rect: { x: number; y: number; w: number; h: number },
) {
  const left = node.x - node.w / 2;
  const right = node.x + node.w / 2;
  const top = node.y - node.h / 2;
  const bottom = node.y + node.h / 2;
  return rect.x <= right && rect.x + rect.w >= left && rect.y <= bottom && rect.y + rect.h >= top;
}

export function findTopNodeAtPoint(
  nodes: FlowNode[],
  point: Point,
  options: { excludeId?: string } = {},
) {
  const hits = [...nodes]
    .reverse()
    .filter(
      (node) =>
        node.id !== options.excludeId &&
        point.x >= node.x - node.w / 2 &&
        point.x <= node.x + node.w / 2 &&
        point.y >= node.y - node.h / 2 &&
        point.y <= node.y + node.h / 2,
    );
  return hits.find((node) => node.kind !== "group") ?? hits[0];
}

export function moveNodesTo(
  doc: FlowDoc,
  positions: Array<{ id: string; x: number; y: number }>,
): FlowDoc {
  const byId = new Map(positions.map((position) => [position.id, position]));
  return {
    ...doc,
    nodes: doc.nodes.map((node) => {
      const position = byId.get(node.id);
      return position ? { ...node, x: position.x, y: position.y } : node;
    }),
  };
}

export function canConnectFlowNodes(doc: FlowDoc, edge: Pick<FlowEdge, "from" | "to" | "label">) {
  if (edge.from === edge.to) return false;

  const nodeIds = new Set(doc.nodes.map((node) => node.id));
  if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) return false;

  const normalizedLabel = edge.label?.trim() || undefined;
  return !doc.edges.some(
    (existing) =>
      existing.from === edge.from &&
      existing.to === edge.to &&
      (existing.label?.trim() || undefined) === normalizedLabel,
  );
}

export function connectFlowNodes(
  doc: FlowDoc,
  edge: Pick<FlowEdge, "id" | "from" | "to" | "label">,
): FlowDoc {
  if (!canConnectFlowNodes(doc, edge)) return doc;
  const normalizedLabel = edge.label?.trim() || undefined;

  return {
    ...doc,
    edges: [...doc.edges, { id: edge.id, from: edge.from, to: edge.to, label: normalizedLabel }],
  };
}

export function documentBounds(nodes: FlowNode[], padding = 40): Bounds {
  if (nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 800,
      maxY: 600,
      w: 800,
      h: 600,
    };
  }

  const xs = nodes.map((node) => node.x - node.w / 2);
  const ys = nodes.map((node) => node.y - node.h / 2);
  const xe = nodes.map((node) => node.x + node.w / 2);
  const ye = nodes.map((node) => node.y + node.h / 2);
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xe) + padding;
  const maxY = Math.max(...ye) + padding;
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}
