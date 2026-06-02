import type { EdgeKind, FlowDoc, FlowEdge, FlowNode, FlowPoint } from "./types";

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

type ConnectionDraft = Pick<FlowEdge, "from" | "label"> &
  Partial<Pick<FlowEdge, "to" | "toPoint" | "kind" | "fromPort">>;

type ConnectionOptions = {
  forbidCycles?: boolean;
  ignoreEdgeId?: string;
};

function normalizeConnectionOptions(
  options: boolean | ConnectionOptions,
): Required<ConnectionOptions> {
  if (typeof options === "boolean") {
    return { forbidCycles: options, ignoreEdgeId: "" };
  }
  return {
    forbidCycles: options.forbidCycles ?? true,
    ignoreEdgeId: options.ignoreEdgeId ?? "",
  };
}

function hasPathBetween(
  doc: FlowDoc,
  from: string,
  to: string,
  options: Pick<ConnectionOptions, "ignoreEdgeId"> = {},
): boolean {
  if (from === to) return true;

  const visited = new Set<string>();
  const queue = [from];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === to) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    doc.edges
      .filter((e) => e.id !== options.ignoreEdgeId && e.from === current && e.to)
      .forEach((e) => {
        if (e.to && !visited.has(e.to)) queue.push(e.to);
      });
  }
  return false;
}

function inferEdgeKind(
  doc: FlowDoc,
  edge: Pick<FlowEdge, "from" | "kind"> & Partial<Pick<FlowEdge, "to">>,
): EdgeKind | undefined {
  if (edge.kind) return edge.kind;
  if (!edge.to) return undefined;
  return hasPathBetween(doc, edge.to, edge.from) ? "return" : undefined;
}

function allowsCycle(kind: EdgeKind | undefined) {
  return kind === "loop" || kind === "return";
}

function isFinitePoint(point: FlowPoint | undefined): point is FlowPoint {
  return Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y));
}

export function canConnectFlowNodes(
  doc: FlowDoc,
  edge: ConnectionDraft,
  options: boolean | ConnectionOptions = true,
) {
  const { forbidCycles, ignoreEdgeId } = normalizeConnectionOptions(options);

  const nodeIds = new Set(doc.nodes.map((node) => node.id));
  if (!nodeIds.has(edge.from)) return false;

  if (!edge.to) {
    return isFinitePoint(edge.toPoint);
  }

  if (edge.from === edge.to) return false;
  if (!nodeIds.has(edge.to)) return false;

  const normalizedLabel = edge.label?.trim() || undefined;
  if (
    doc.edges.some(
      (existing) =>
        existing.id !== ignoreEdgeId &&
        existing.from === edge.from &&
        existing.to === edge.to &&
        (existing.label?.trim() || undefined) === normalizedLabel,
    )
  ) {
    return false;
  }

  const kind = inferEdgeKind(doc, edge);
  if (
    forbidCycles &&
    !allowsCycle(kind) &&
    hasPathBetween(doc, edge.to, edge.from, { ignoreEdgeId })
  ) {
    return false;
  }

  return true;
}

export function connectFlowNodes(
  doc: FlowDoc,
  edge: Pick<FlowEdge, "id"> & ConnectionDraft,
): FlowDoc {
  if (!canConnectFlowNodes(doc, edge)) return doc;
  const normalizedLabel = edge.label?.trim() || undefined;
  const kind = inferEdgeKind(doc, edge);
  const toPoint = edge.to ? undefined : edge.toPoint;

  return {
    ...doc,
    edges: [
      ...doc.edges,
      {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        toPoint,
        label: normalizedLabel,
        kind,
        fromPort: edge.fromPort,
      },
    ],
  };
}

export function documentBounds(nodes: FlowNode[], padding = 40, points: FlowPoint[] = []): Bounds {
  if (nodes.length === 0 && points.length === 0) {
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
  points.forEach((point) => {
    xs.push(point.x);
    ys.push(point.y);
    xe.push(point.x);
    ye.push(point.y);
  });
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xe) + padding;
  const maxY = Math.max(...ye) + padding;
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}
