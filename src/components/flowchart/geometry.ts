import type { FlowNode } from "./types";

// Pick the best side (top/right/bottom/left) of a node to exit toward a target point
type Side = "top" | "right" | "bottom" | "left";

function sideAnchor(node: FlowNode, side: Side): { x: number; y: number } {
  const hw = node.w / 2;
  const hh = node.h / 2;
  switch (side) {
    case "top":
      return { x: node.x, y: node.y - hh };
    case "bottom":
      return { x: node.x, y: node.y + hh };
    case "left":
      return { x: node.x - hw, y: node.y };
    case "right":
      return { x: node.x + hw, y: node.y };
  }
}

function chooseSides(from: FlowNode, to: FlowNode): { fs: Side; ts: Side } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // Prefer vertical flow (top->bottom) which is the natural reading direction for flowcharts
  if (Math.abs(dy) >= Math.abs(dx) * 0.6) {
    if (dy >= 0) return { fs: "bottom", ts: "top" };
    return { fs: "top", ts: "bottom" };
  }
  if (dx >= 0) return { fs: "right", ts: "left" };
  return { fs: "left", ts: "right" };
}

// Orthogonal path with rounded corners
export function edgePath(
  from: FlowNode,
  to: FlowNode,
): { d: string; mid: { x: number; y: number } } {
  const { fs, ts } = chooseSides(from, to);
  const a = sideAnchor(from, fs);
  const b = sideAnchor(to, ts);

  const points: { x: number; y: number }[] = [a];

  // Build orthogonal waypoints based on exit/entry sides
  const fromVertical = fs === "top" || fs === "bottom";
  const toVertical = ts === "top" || ts === "bottom";

  if (fromVertical && toVertical) {
    const my = (a.y + b.y) / 2;
    points.push({ x: a.x, y: my }, { x: b.x, y: my });
  } else if (!fromVertical && !toVertical) {
    const mx = (a.x + b.x) / 2;
    points.push({ x: mx, y: a.y }, { x: mx, y: b.y });
  } else if (fromVertical && !toVertical) {
    points.push({ x: a.x, y: b.y });
  } else {
    points.push({ x: b.x, y: a.y });
  }
  points.push(b);

  // Build path with small rounded corners
  const r = 8;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    const v1x = Math.sign(cur.x - prev.x);
    const v1y = Math.sign(cur.y - prev.y);
    const v2x = Math.sign(next.x - cur.x);
    const v2y = Math.sign(next.y - cur.y);
    const lenIn = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const lenOut = Math.hypot(next.x - cur.x, next.y - cur.y);
    const rr = Math.min(r, lenIn / 2, lenOut / 2);
    const p1 = { x: cur.x - v1x * rr, y: cur.y - v1y * rr };
    const p2 = { x: cur.x + v2x * rr, y: cur.y + v2y * rr };
    d += ` L ${p1.x} ${p1.y} Q ${cur.x} ${cur.y} ${p2.x} ${p2.y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;

  // midpoint along the polyline (for label placement)
  let total = 0;
  const segs: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const l = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    segs.push(l);
    total += l;
  }
  let target = total / 2;
  let mid = { x: a.x, y: a.y };
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) {
      const t = segs[i] === 0 ? 0 : target / segs[i];
      mid = {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
      break;
    }
    target -= segs[i];
  }

  return { d, mid };
}

// kept for backward compat (not used anymore)
export function anchorPoint(node: FlowNode, tx: number, ty: number) {
  return { x: node.x, y: node.y };
}
