import type { FlowNode } from "./types";

// Compute connection point on the boundary of a node along the line from node center to target point
export function anchorPoint(node: FlowNode, tx: number, ty: number): { x: number; y: number } {
  const cx = node.x;
  const cy = node.y;
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const hw = node.w / 2;
  const hh = node.h / 2;

  if (node.kind === "decision") {
    // diamond: |x|/hw + |y|/hh = 1
    const t = 1 / (Math.abs(dx) / hw + Math.abs(dy) / hh);
    return { x: cx + dx * t, y: cy + dy * t };
  }
  if (node.kind === "connector") {
    const r = Math.min(hw, hh);
    const len = Math.hypot(dx, dy);
    return { x: cx + (dx / len) * r, y: cy + (dy / len) * r };
  }
  // rectangle approx
  const tx1 = hw / Math.abs(dx || 1e-6);
  const ty1 = hh / Math.abs(dy || 1e-6);
  const t = Math.min(tx1, ty1);
  return { x: cx + dx * t, y: cy + dy * t };
}

export function edgePath(from: FlowNode, to: FlowNode): { d: string; mid: { x: number; y: number } } {
  const a = anchorPoint(from, to.x, to.y);
  const b = anchorPoint(to, from.x, from.y);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  // simple orthogonal-ish curve
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const c1x = a.x + dx * 0.5;
  const c1y = a.y;
  const c2x = b.x - dx * 0.5;
  const c2y = b.y;
  const d =
    Math.abs(dy) > Math.abs(dx)
      ? `M ${a.x} ${a.y} C ${a.x} ${a.y + dy * 0.5}, ${b.x} ${b.y - dy * 0.5}, ${b.x} ${b.y}`
      : `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`;
  return { d, mid: { x: mx, y: my } };
}
