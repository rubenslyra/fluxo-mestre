import type { FlowDoc } from "./types";

function buildStandaloneSvg(doc: FlowDoc, innerHtml: string) {
  const xs = doc.nodes.map((n) => n.x - n.w / 2);
  const ys = doc.nodes.map((n) => n.y - n.h / 2);
  const xe = doc.nodes.map((n) => n.x + n.w / 2);
  const ye = doc.nodes.map((n) => n.y + n.h / 2);
  const minX = Math.min(...xs) - 40;
  const minY = Math.min(...ys) - 40;
  const maxX = Math.max(...xe) + 40;
  const maxY = Math.max(...ye) + 40;
  const w = maxX - minX;
  const h = maxY - minY;
  const sanitized = innerHtml
    .replace(/var\(--color-node\)/g, "white")
    .replace(/var\(--color-node-stroke\)/g, "#222")
    .replace(/var\(--color-node-selected\)/g, "#222")
    .replace(/var\(--color-edge\)/g, "#222")
    .replace(/var\(--color-foreground\)/g, "#111")
    .replace(/var\(--color-card\)/g, "white")
    .replace(/var\(--color-border\)/g, "#222")
    .replace(/var\(--color-accent\)/g, "white");
  // arrow marker definition (since we strip <defs> indirectly when only #world is used)
  const defs = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#222"/></marker></defs>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${w} ${h}" width="${w}" height="${h}"><style>text{font-family:system-ui,sans-serif}</style>${defs}<rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="white"/>${sanitized}</svg>`;
  return { svg, w, h };
}

export function downloadSvg(doc: FlowDoc, innerHtml: string, filename = "fluxograma.svg") {
  const { svg } = buildStandaloneSvg(doc, innerHtml);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPng(
  doc: FlowDoc,
  innerHtml: string,
  scale = 2,
  filename = "fluxograma.png",
) {
  const { svg, w, h } = buildStandaloneSvg(doc, innerHtml);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => {
          if (!b) return reject(new Error("Falha ao gerar PNG"));
          const u = URL.createObjectURL(b);
          const a = document.createElement("a");
          a.href = u;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(u);
          resolve();
        }, "image/png");
      };
      img.onerror = () => reject(new Error("Falha ao renderizar SVG"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
