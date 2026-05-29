import { describe, expect, test } from "bun:test";
import { anchorPoint, edgePath } from "./geometry";
import type { FlowNode } from "./types";

function node(init: Partial<FlowNode> & Pick<FlowNode, "id">): FlowNode {
  return {
    id: init.id,
    kind: init.kind ?? "process",
    x: init.x ?? 0,
    y: init.y ?? 0,
    w: init.w ?? 120,
    h: init.h ?? 60,
    label: init.label ?? init.id,
  };
}

describe("edgePath", () => {
  test("uses bottom-to-top anchors for vertical flow", () => {
    const { d, mid } = edgePath(node({ id: "a", x: 0, y: 0 }), node({ id: "b", x: 0, y: 160 }));

    expect(d.startsWith("M 0 30")).toBe(true);
    expect(d.endsWith(" L 0 130")).toBe(true);
    expect(mid).toEqual({ x: 0, y: 80 });
  });

  test("uses side anchors for horizontal flow", () => {
    const { d, mid } = edgePath(node({ id: "a", x: 0, y: 0 }), node({ id: "b", x: 220, y: 0 }));

    expect(d.startsWith("M 60 0")).toBe(true);
    expect(d.endsWith(" L 160 0")).toBe(true);
    expect(mid).toEqual({ x: 110, y: 0 });
  });

  test("does not generate invalid path numbers for overlapping nodes", () => {
    const { d, mid } = edgePath(node({ id: "a" }), node({ id: "b" }));

    expect(d).not.toMatch(/NaN|Infinity/);
    expect(Number.isFinite(mid.x)).toBe(true);
    expect(Number.isFinite(mid.y)).toBe(true);
  });

  test("keeps anchorPoint backward compatible", () => {
    expect(anchorPoint(node({ id: "a", x: 10, y: 20 }), 0, 0)).toEqual({ x: 10, y: 20 });
  });
});
