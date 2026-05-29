import { describe, expect, test } from "bun:test";
import {
  canConnectFlowNodes,
  connectFlowNodes,
  documentBounds,
  findTopNodeAtPoint,
  moveNodesTo,
  nodeIntersectsSelection,
  normalizeSelectionBox,
} from "./flowModel";
import type { FlowDoc, FlowEdge, FlowNode } from "./types";

function node(init: Partial<FlowNode> & Pick<FlowNode, "id">): FlowNode {
  return {
    id: init.id,
    kind: init.kind ?? "process",
    x: init.x ?? 0,
    y: init.y ?? 0,
    w: init.w ?? 160,
    h: init.h ?? 70,
    label: init.label ?? init.id,
  };
}

function edge(from: string, to: string, label?: string): FlowEdge {
  return { id: `${from}-${to}-${label ?? "main"}`, from, to, label };
}

describe("flowModel", () => {
  test("finds the top node under a point, including data/input bounds", () => {
    const nodes = [
      node({ id: "input", kind: "data", x: 100, y: 100, w: 170, h: 70 }),
      node({ id: "process", x: 100, y: 100, w: 160, h: 70 }),
    ];

    expect(findTopNodeAtPoint(nodes, { x: 100, y: 135 })?.id).toBe("process");
    expect(findTopNodeAtPoint(nodes, { x: 100, y: 135 }, { excludeId: "process" })?.id).toBe(
      "input",
    );
    expect(findTopNodeAtPoint(nodes, { x: 100, y: 136 }, { excludeId: "process" })?.id).toBe(
      undefined,
    );
  });

  test("prefers regular nodes over overlapping grouping containers", () => {
    const nodes = [
      node({ id: "group", kind: "group", x: 100, y: 100, w: 300, h: 220 }),
      node({ id: "process", x: 100, y: 100, w: 160, h: 70 }),
    ];

    expect(findTopNodeAtPoint(nodes, { x: 100, y: 100 })?.id).toBe("process");
    expect(findTopNodeAtPoint(nodes, { x: 20, y: 20 })?.id).toBe("group");
  });

  test("connects valid nodes and rejects self, missing, and duplicate edges", () => {
    const doc: FlowDoc = {
      nodes: [node({ id: "a" }), node({ id: "b" })],
      edges: [],
    };

    const connected = connectFlowNodes(doc, { id: "e1", from: "a", to: "b", label: " Sim " });
    expect(connected.edges).toEqual([{ id: "e1", from: "a", to: "b", label: "Sim" }]);
    expect(canConnectFlowNodes(connected, { from: "a", to: "b", label: "Sim" })).toBe(false);
    expect(connectFlowNodes(connected, { id: "e2", from: "a", to: "a" })).toBe(connected);
    expect(connectFlowNodes(connected, { id: "e3", from: "a", to: "missing" })).toBe(connected);
    expect(connectFlowNodes(connected, { id: "e4", from: "a", to: "b", label: "Sim" })).toBe(
      connected,
    );
  });

  test("moves only known nodes", () => {
    const doc: FlowDoc = {
      nodes: [node({ id: "a", x: 10, y: 10 }), node({ id: "b", x: 30, y: 30 })],
      edges: [edge("a", "b")],
    };

    const moved = moveNodesTo(doc, [
      { id: "a", x: 80, y: 90 },
      { id: "missing", x: 0, y: 0 },
    ]);

    expect(moved.nodes.map(({ id, x, y }) => ({ id, x, y }))).toEqual([
      { id: "a", x: 80, y: 90 },
      { id: "b", x: 30, y: 30 },
    ]);
    expect(moved.edges).toBe(doc.edges);
  });

  test("normalizes selection and detects node intersection", () => {
    const rect = normalizeSelectionBox({ startX: 50, startY: 60, x: 10, y: 20 });
    expect(rect).toEqual({ x: 10, y: 20, w: 40, h: 40 });
    expect(nodeIntersectsSelection(node({ id: "a", x: 30, y: 40, w: 20, h: 20 }), rect)).toBe(true);
    expect(nodeIntersectsSelection(node({ id: "b", x: 100, y: 100, w: 20, h: 20 }), rect)).toBe(
      false,
    );
  });

  test("returns finite document bounds for empty and populated documents", () => {
    expect(documentBounds([])).toEqual({ minX: 0, minY: 0, maxX: 800, maxY: 600, w: 800, h: 600 });

    const bounds = documentBounds([node({ id: "a", x: 100, y: 100, w: 40, h: 20 })], 10);
    expect(bounds).toEqual({ minX: 70, minY: 80, maxX: 130, maxY: 120, w: 60, h: 40 });
  });
});
