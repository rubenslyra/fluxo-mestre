import { edgePath } from "./geometry";
import { getShapePath } from "./symbols";
import type { FlowDoc, FlowNode } from "./types";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapSvgText(value: string, maxChars: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars));
      }
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function svgNodeLabel(node: FlowNode) {
  const fontSize = 13;
  const lines = wrapSvgText(node.label, Math.max(6, Math.floor((node.w - 16) / 7)));
  const lineHeight = fontSize * 1.2;
  const firstDy = -((lines.length - 1) * lineHeight) / 2 + fontSize * 0.35;
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="0" dy="${index === 0 ? firstDy : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  return `<text text-anchor="middle" font-size="${fontSize}" fill="#111" font-family="system-ui, sans-serif">${tspans}</text>`;
}

function buildStandaloneSvg(doc: FlowDoc, _innerHtml: string) {
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
  const nodeMap = new Map(doc.nodes.map((node) => [node.id, node]));
  // arrow marker definition (since we strip <defs> indirectly when only #world is used)
  const defs = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#222"/></marker></defs>`;
  const edges = doc.edges
    .flatMap((edge) => {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) return [];
      const { d, mid } = edgePath(from, to);
      const label = edge.label
        ? `<g transform="translate(${mid.x} ${mid.y})"><rect x="-18" y="-10" width="36" height="18" rx="4" fill="white" stroke="#222"/><text text-anchor="middle" y="4" font-size="11" fill="#111">${escapeXml(edge.label)}</text></g>`
        : "";
      return [
        `<path d="${d}" fill="none" stroke="#222" stroke-width="2" marker-end="url(#arrow)"/>${label}`,
      ];
    })
    .join("");
  const nodes = doc.nodes
    .map((node) => {
      const path = getShapePath(node.kind, node.w, node.h);
      return `<g transform="translate(${node.x} ${node.y})"><path d="${path}" fill="white" stroke="#222" stroke-width="2"/>${svgNodeLabel(node)}</g>`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${w} ${h}" width="${w}" height="${h}"><style>text{font-family:system-ui,sans-serif}</style>${defs}<rect x="${minX}" y="${minY}" width="${w}" height="${h}" fill="white"/>${edges}${nodes}</svg>`;
  return { svg, w, h };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function renderSvgToCanvas(doc: FlowDoc, innerHtml: string, scale: number) {
  const { svg, w, h } = buildStandaloneSvg(doc, innerHtml);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<{
      canvas: HTMLCanvasElement;
      sourceWidth: number;
      sourceHeight: number;
    }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Falha ao preparar canvas"));
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({ canvas, sourceWidth: w, sourceHeight: h });
      };
      img.onerror = () => reject(new Error("Falha ao renderizar SVG"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Falha ao gerar imagem"));
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

const PDF_LOGO_SRC = `${import.meta.env.BASE_URL}logo.png`;
const PDF_LOGO_PIXELS = 160;

function loadBrowserImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`));
    image.src = src;
  });
}

async function loadPdfLogoAsset(): Promise<PdfImageAsset | null> {
  if (typeof document === "undefined" || typeof Image === "undefined") return null;

  try {
    const image = await loadBrowserImage(PDF_LOGO_SRC);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const sourceSize = Math.min(sourceWidth, sourceHeight);
    const canvas = document.createElement("canvas");
    canvas.width = PDF_LOGO_PIXELS;
    canvas.height = PDF_LOGO_PIXELS;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      (sourceWidth - sourceSize) / 2,
      (sourceHeight - sourceSize) / 2,
      sourceSize,
      sourceSize,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await canvasToBlob(canvas, "image/jpeg", 0.86);
    return {
      name: "LogoRLLabs",
      width: canvas.width,
      height: canvas.height,
      bytes: new Uint8Array(await blob.arrayBuffer()),
    };
  } catch {
    return null;
  }
}

function asciiBytes(value: string) {
  return new TextEncoder().encode(value);
}

function concatBytes(chunks: Uint8Array[]) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

interface PdfImageAsset {
  name: string;
  width: number;
  height: number;
  bytes: Uint8Array;
}

function buildPdf(
  pages: string[],
  pageWidth: number,
  pageHeight: number,
  image?: PdfImageAsset | null,
) {
  const imageId = image ? 4 : null;
  const firstPageId = image ? 5 : 4;
  const objectCount = 3 + (image ? 1 : 0) + pages.length * 2;
  const objects = new Map<number, Uint8Array>();
  const kids = pages.map((_, index) => `${firstPageId + index * 2} 0 R`).join(" ");

  objects.set(1, asciiBytes("<< /Type /Catalog /Pages 2 0 R >>"));
  objects.set(2, asciiBytes(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`));
  objects.set(
    3,
    asciiBytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
  );

  if (image && imageId) {
    objects.set(
      imageId,
      concatBytes([
        asciiBytes(
          `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} ` +
            `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`,
        ),
        image.bytes,
        asciiBytes("\nendstream"),
      ]),
    );
  }

  pages.forEach((content, index) => {
    const pageId = firstPageId + index * 2;
    const contentId = pageId + 1;
    const xObjectResource = image && imageId ? `/XObject << /${image.name} ${imageId} 0 R >> ` : "";

    objects.set(
      pageId,
      asciiBytes(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
          `/Resources << /Font << /F1 3 0 R >> ${xObjectResource}>> /Contents ${contentId} 0 R >>`,
      ),
    );
    objects.set(
      contentId,
      asciiBytes(`<< /Length ${asciiBytes(content).length} >>\nstream\n${content}\nendstream`),
    );
  });

  const chunks: Uint8Array[] = [asciiBytes("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
  const offsets = [0];
  let position = chunks[0].length;

  for (let id = 1; id <= objectCount; id += 1) {
    const body = objects.get(id);
    if (!body) throw new Error(`Objeto PDF ausente: ${id}`);
    const objectBytes = concatBytes([asciiBytes(`${id} 0 obj\n`), body, asciiBytes("\nendobj\n")]);
    offsets[id] = position;
    chunks.push(objectBytes);
    position += objectBytes.length;
  }

  const xrefStart = position;
  const xref = [
    "xref",
    `0 ${objectCount + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objectCount + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefStart),
    "%%EOF",
  ].join("\n");
  chunks.push(asciiBytes(xref));

  return new Blob([concatBytes(chunks)], { type: "application/pdf" });
}

function pdfNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0";
}

const PDF_BRAND = {
  cyan: "0.20 0.78 0.92",
  magenta: "0.88 0.05 0.62",
  amber: "0.95 0.58 0.10",
  green: "0.35 0.78 0.24",
  ink: "0.10 0.10 0.16",
  muted: "0.35 0.35 0.45",
  light: "0.92 0.93 0.96",
  paper: "1 1 1",
};

const SYSTEM_VERSION = "FluxoLab v0.1.0";

function nextDocumentId() {
  const date = new Date();
  const pad = (value: number, size = 2) => String(value).padStart(size, "0");
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
  let count = 1;
  try {
    const key = "fluxolab-pdf-export-count-v1";
    count = Number(localStorage.getItem(key) ?? "0") + 1;
    localStorage.setItem(key, String(count));
  } catch {
    // Private browsing or restricted storage should not block PDF generation.
  }
  const random = new Uint8Array(2);
  try {
    crypto.getRandomValues(random);
  } catch {
    random[0] = Math.floor(Math.random() * 256);
    random[1] = Math.floor(Math.random() * 256);
  }
  const suffix = Array.from(random)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `FL-${stamp}-${String(count).padStart(5, "0")}-${suffix}`;
}

function sanitizePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string) {
  return sanitizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: string, maxChars: number) {
  const words = sanitizePdfText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let i = 0; i < word.length; i += maxChars) {
        lines.push(word.slice(i, i + maxChars));
      }
      continue;
    }
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawTextLine(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  align: "left" | "center" | "right" = "left",
) {
  const safe = escapePdfText(text);
  const width = safe.length * fontSize * 0.52;
  const tx = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  return `BT /F1 ${pdfNumber(fontSize)} Tf ${pdfNumber(tx)} ${pdfNumber(y)} Td (${safe}) Tj ET`;
}

function drawCenteredText(
  text: string,
  cx: number,
  cy: number,
  maxWidth: number,
  maxHeight: number,
) {
  let fontSize = 10;
  let lines = wrapText(text, Math.max(6, Math.floor(maxWidth / (fontSize * 0.52))));
  while (lines.length * fontSize * 1.15 > maxHeight && fontSize > 7) {
    fontSize -= 1;
    lines = wrapText(text, Math.max(6, Math.floor(maxWidth / (fontSize * 0.52))));
  }
  const lineHeight = fontSize * 1.15;
  const firstY = cy + ((lines.length - 1) * lineHeight) / 2 - fontSize * 0.35;
  return lines
    .map((line, index) => drawTextLine(line, cx, firstY - index * lineHeight, fontSize, "center"))
    .join("\n");
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  const right = x + w;
  const top = y + h;
  const c = 0.5522847498;
  const k = r * c;
  return [
    `${pdfNumber(x + r)} ${pdfNumber(y)} m`,
    `${pdfNumber(right - r)} ${pdfNumber(y)} l`,
    `${pdfNumber(right - r + k)} ${pdfNumber(y)} ${pdfNumber(right)} ${pdfNumber(y + r - k)} ${pdfNumber(right)} ${pdfNumber(y + r)} c`,
    `${pdfNumber(right)} ${pdfNumber(top - r)} l`,
    `${pdfNumber(right)} ${pdfNumber(top - r + k)} ${pdfNumber(right - r + k)} ${pdfNumber(top)} ${pdfNumber(right - r)} ${pdfNumber(top)} c`,
    `${pdfNumber(x + r)} ${pdfNumber(top)} l`,
    `${pdfNumber(x + r - k)} ${pdfNumber(top)} ${pdfNumber(x)} ${pdfNumber(top - r + k)} ${pdfNumber(x)} ${pdfNumber(top - r)} c`,
    `${pdfNumber(x)} ${pdfNumber(y + r)} l`,
    `${pdfNumber(x)} ${pdfNumber(y + r - k)} ${pdfNumber(x + r - k)} ${pdfNumber(y)} ${pdfNumber(x + r)} ${pdfNumber(y)} c`,
    "h",
  ].join("\n");
}

function circlePath(cx: number, cy: number, r: number) {
  return roundedRectPath(cx - r, cy - r, r * 2, r * 2, r);
}

function nodeShapePath(node: FlowNode, cx: number, cy: number, scale: number) {
  const w = node.w * scale;
  const h = node.h * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const right = x + w;
  const top = y + h;
  switch (node.kind) {
    case "terminator":
      return roundedRectPath(x, y, w, h, h / 2);
    case "decision":
      return [
        `${pdfNumber(cx)} ${pdfNumber(top)} m`,
        `${pdfNumber(right)} ${pdfNumber(cy)} l`,
        `${pdfNumber(cx)} ${pdfNumber(y)} l`,
        `${pdfNumber(x)} ${pdfNumber(cy)} l`,
        "h",
      ].join("\n");
    case "data": {
      const skew = 18 * scale;
      return [
        `${pdfNumber(x + skew)} ${pdfNumber(top)} m`,
        `${pdfNumber(right)} ${pdfNumber(top)} l`,
        `${pdfNumber(right - skew)} ${pdfNumber(y)} l`,
        `${pdfNumber(x)} ${pdfNumber(y)} l`,
        "h",
      ].join("\n");
    }
    case "predefined": {
      const inset = 12 * scale;
      return [
        `${pdfNumber(x)} ${pdfNumber(y)} ${pdfNumber(w)} ${pdfNumber(h)} re`,
        "B",
        `${pdfNumber(x + inset)} ${pdfNumber(y)} m ${pdfNumber(x + inset)} ${pdfNumber(top)} l S`,
        `${pdfNumber(right - inset)} ${pdfNumber(y)} m ${pdfNumber(right - inset)} ${pdfNumber(top)} l`,
      ].join("\n");
    }
    case "preparation": {
      const k = 22 * scale;
      return [
        `${pdfNumber(x + k)} ${pdfNumber(top)} m`,
        `${pdfNumber(right - k)} ${pdfNumber(top)} l`,
        `${pdfNumber(right)} ${pdfNumber(cy)} l`,
        `${pdfNumber(right - k)} ${pdfNumber(y)} l`,
        `${pdfNumber(x + k)} ${pdfNumber(y)} l`,
        `${pdfNumber(x)} ${pdfNumber(cy)} l`,
        "h",
      ].join("\n");
    }
    case "document": {
      const wave = 12 * scale;
      return [
        `${pdfNumber(x)} ${pdfNumber(top)} m`,
        `${pdfNumber(right)} ${pdfNumber(top)} l`,
        `${pdfNumber(right)} ${pdfNumber(y + wave)} l`,
        `${pdfNumber(x + (w * 3) / 4)} ${pdfNumber(y - wave)} ${pdfNumber(x + w / 2)} ${pdfNumber(y + wave / 2)} ${pdfNumber(x)} ${pdfNumber(y + wave)} c`,
        "h",
      ].join("\n");
    }
    case "manual": {
      const slope = 14 * scale;
      return [
        `${pdfNumber(x)} ${pdfNumber(top - slope)} m`,
        `${pdfNumber(right)} ${pdfNumber(top)} l`,
        `${pdfNumber(right)} ${pdfNumber(y)} l`,
        `${pdfNumber(x)} ${pdfNumber(y)} l`,
        "h",
      ].join("\n");
    }
    case "display": {
      const curve = 18 * scale;
      return [
        `${pdfNumber(x + curve)} ${pdfNumber(top)} m`,
        `${pdfNumber(right - curve)} ${pdfNumber(top)} l`,
        `${pdfNumber(right)} ${pdfNumber(cy)} l`,
        `${pdfNumber(right - curve)} ${pdfNumber(y)} l`,
        `${pdfNumber(x + curve)} ${pdfNumber(y)} l`,
        `${pdfNumber(x - curve / 2)} ${pdfNumber(cy)} ${pdfNumber(x + curve)} ${pdfNumber(top)} ${pdfNumber(x + curve)} ${pdfNumber(top)} c`,
        "h",
      ].join("\n");
    }
    case "connector":
      return circlePath(cx, cy, Math.min(w, h) / 2);
    case "process":
    default:
      return `${pdfNumber(x)} ${pdfNumber(y)} ${pdfNumber(w)} ${pdfNumber(h)} re`;
  }
}

interface PdfTransform {
  minX: number;
  pageTop: number;
  scale: number;
  left: number;
  contentTop: number;
}

function transformPoint(point: { x: number; y: number }, tf: PdfTransform) {
  return {
    x: tf.left + (point.x - tf.minX) * tf.scale,
    y: tf.contentTop - (point.y - tf.pageTop) * tf.scale,
  };
}

function svgPathToPdfPath(d: string, tf: PdfTransform) {
  const tokens = d.match(/[MLQ]|-?\d+(?:\.\d+)?/g) ?? [];
  let i = 0;
  let command = "";
  let current: { x: number; y: number } | null = null;
  let previous: { x: number; y: number } | null = null;
  const ops: string[] = [];

  const nextNumber = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/^[MLQ]$/.test(tokens[i])) {
      command = tokens[i++];
    }
    if (command === "M") {
      const point = transformPoint({ x: nextNumber(), y: nextNumber() }, tf);
      ops.push(`${pdfNumber(point.x)} ${pdfNumber(point.y)} m`);
      current = point;
      previous = point;
    } else if (command === "L") {
      const point = transformPoint({ x: nextNumber(), y: nextNumber() }, tf);
      ops.push(`${pdfNumber(point.x)} ${pdfNumber(point.y)} l`);
      previous = current;
      current = point;
    } else if (command === "Q" && current) {
      const control = transformPoint({ x: nextNumber(), y: nextNumber() }, tf);
      const end = transformPoint({ x: nextNumber(), y: nextNumber() }, tf);
      const c1 = {
        x: current.x + (2 / 3) * (control.x - current.x),
        y: current.y + (2 / 3) * (control.y - current.y),
      };
      const c2 = {
        x: end.x + (2 / 3) * (control.x - end.x),
        y: end.y + (2 / 3) * (control.y - end.y),
      };
      ops.push(
        `${pdfNumber(c1.x)} ${pdfNumber(c1.y)} ${pdfNumber(c2.x)} ${pdfNumber(c2.y)} ${pdfNumber(end.x)} ${pdfNumber(end.y)} c`,
      );
      previous = control;
      current = end;
    } else {
      break;
    }
  }

  return { path: ops.join("\n"), previous, current };
}

function drawArrow(
  previous: { x: number; y: number } | null,
  end: { x: number; y: number } | null,
) {
  if (!previous || !end) return "";
  const dx = end.x - previous.x;
  const dy = end.y - previous.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return "";
  const ux = dx / length;
  const uy = dy / length;
  const arrowLength = 8;
  const arrowWidth = 4.5;
  const base = { x: end.x - ux * arrowLength, y: end.y - uy * arrowLength };
  const p1 = { x: base.x - uy * arrowWidth, y: base.y + ux * arrowWidth };
  const p2 = { x: base.x + uy * arrowWidth, y: base.y - ux * arrowWidth };
  return [
    `${pdfNumber(end.x)} ${pdfNumber(end.y)} m`,
    `${pdfNumber(p1.x)} ${pdfNumber(p1.y)} l`,
    `${pdfNumber(p2.x)} ${pdfNumber(p2.y)} l`,
    "h f",
  ].join("\n");
}

function drawLabel(text: string, x: number, y: number) {
  const safe = sanitizePdfText(text);
  const fontSize = 8;
  const width = Math.max(26, safe.length * fontSize * 0.54 + 10);
  const height = 16;
  return [
    "q 1 1 1 rg 0 0 0 RG 0.5 w",
    `${pdfNumber(x - width / 2)} ${pdfNumber(y - height / 2)} ${pdfNumber(width)} ${pdfNumber(height)} re B`,
    "Q",
    drawTextLine(safe, x, y - fontSize * 0.35, fontSize, "center"),
  ].join("\n");
}

function drawRllabsLogo(x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;
  const line = (color: string, x1: number, y1: number, x2: number, y2: number) =>
    `q ${color} RG 2.4 w ${pdfNumber(x + x1 * size)} ${pdfNumber(y + y1 * size)} m ${pdfNumber(x + x2 * size)} ${pdfNumber(y + y2 * size)} l S Q`;
  return [
    `q ${PDF_BRAND.ink} rg ${circlePath(cx, cy, r)} f Q`,
    line(PDF_BRAND.amber, 0.16, 0.36, 0.43, 0.36),
    line(PDF_BRAND.amber, 0.16, 0.5, 0.36, 0.5),
    line(PDF_BRAND.amber, 0.16, 0.64, 0.43, 0.64),
    line(PDF_BRAND.green, 0.45, 0.74, 0.62, 0.54),
    line(PDF_BRAND.green, 0.45, 0.26, 0.62, 0.46),
    `q ${PDF_BRAND.cyan} RG 2.6 w ${pdfNumber(x + size * 0.63)} ${pdfNumber(y + size * 0.24)} m ${pdfNumber(
      x + size * 0.82,
    )} ${pdfNumber(y + size * 0.42)} ${pdfNumber(x + size * 0.82)} ${pdfNumber(y + size * 0.58)} ${pdfNumber(
      x + size * 0.63,
    )} ${pdfNumber(y + size * 0.76)} c S Q`,
    `q ${PDF_BRAND.magenta} RG 2.6 w ${pdfNumber(x + size * 0.48)} ${pdfNumber(y + size * 0.24)} m ${pdfNumber(
      x + size * 0.28,
    )} ${pdfNumber(y + size * 0.42)} ${pdfNumber(x + size * 0.28)} ${pdfNumber(y + size * 0.58)} ${pdfNumber(
      x + size * 0.48,
    )} ${pdfNumber(y + size * 0.76)} c S Q`,
    `q ${PDF_BRAND.paper} rg ${drawTextLine("RL", cx, cy - 4, 12, "center")} Q`,
  ].join("\n");
}

function drawPdfImage(name: string, x: number, y: number, w: number, h: number) {
  return `q ${pdfNumber(w)} 0 0 ${pdfNumber(h)} ${pdfNumber(x)} ${pdfNumber(y)} cm /${name} Do Q`;
}

function drawHeader(
  pageWidth: number,
  pageHeight: number,
  marginX: number,
  documentId: string,
  logo?: PdfImageAsset | null,
) {
  const top = pageHeight - 22;
  const logoSize = 46;
  const logoY = top - logoSize;
  const centerX = pageWidth / 2;
  const rightX = pageWidth - marginX;
  return [
    logo
      ? drawPdfImage(logo.name, marginX, logoY, logoSize, logoSize)
      : drawRllabsLogo(marginX, logoY, logoSize),
    `q ${PDF_BRAND.ink} rg ${drawTextLine("FluxoLab", centerX, top - 18, 18, "center")} Q`,
    `q ${PDF_BRAND.magenta} rg ${drawTextLine("Rubinho Lyra Labs", centerX, top - 35, 10, "center")} Q`,
    `q ${PDF_BRAND.muted} rg ${drawTextLine(`ID ${documentId}`, rightX, top - 18, 7.5, "right")} Q`,
    `q ${PDF_BRAND.muted} rg ${drawTextLine("Documento gerado pela aplicacao", rightX, top - 31, 7, "right")} Q`,
    `q ${PDF_BRAND.amber} RG 1.2 w ${pdfNumber(marginX)} ${pdfNumber(top - 55)} m ${pdfNumber(
      centerX - 40,
    )} ${pdfNumber(top - 55)} l S Q`,
    `q ${PDF_BRAND.magenta} RG 1.2 w ${pdfNumber(centerX - 32)} ${pdfNumber(top - 55)} m ${pdfNumber(
      centerX + 32,
    )} ${pdfNumber(top - 55)} l S Q`,
    `q ${PDF_BRAND.cyan} RG 1.2 w ${pdfNumber(centerX + 40)} ${pdfNumber(top - 55)} m ${pdfNumber(rightX)} ${pdfNumber(
      top - 55,
    )} l S Q`,
  ].join("\n");
}

function drawFooter(pageWidth: number, marginX: number, page: number, pageCount: number) {
  const y = 24;
  return [
    `q ${PDF_BRAND.light} RG 0.8 w ${pdfNumber(marginX)} ${pdfNumber(y + 15)} m ${pdfNumber(pageWidth - marginX)} ${pdfNumber(
      y + 15,
    )} l S Q`,
    `q ${PDF_BRAND.muted} rg ${drawTextLine(SYSTEM_VERSION, marginX, y, 8, "left")} Q`,
    `q ${PDF_BRAND.muted} rg ${drawTextLine(`Pagina ${page} de ${pageCount}`, pageWidth - marginX, y, 8, "right")} Q`,
  ].join("\n");
}

interface SourcePage {
  top: number;
  bottom: number;
}

function paginateWithoutCuttingNodes(
  nodes: FlowNode[],
  minY: number,
  maxY: number,
  sourcePageHeight: number,
): SourcePage[] {
  const boxes = nodes
    .map((node) => ({ top: node.y - node.h / 2 - 12, bottom: node.y + node.h / 2 + 12 }))
    .sort((a, b) => a.top - b.top);
  const pages: SourcePage[] = [];
  let top = minY;
  let guard = 0;

  while (top < maxY - 1 && guard < 100) {
    guard += 1;
    let bottom = Math.min(maxY, top + sourcePageHeight);
    if (bottom < maxY) {
      const crossing = boxes.filter((box) => box.top < bottom && box.bottom > bottom);
      if (crossing.length) {
        const candidate = Math.min(...crossing.map((box) => box.top));
        if (candidate > top + 24) bottom = candidate;
      }
    }
    if (bottom <= top + 1) bottom = Math.min(maxY, top + sourcePageHeight);
    pages.push({ top, bottom });
    top = bottom;
  }

  return pages.length ? pages : [{ top: minY, bottom: maxY }];
}

function buildPdfPages(doc: FlowDoc, documentId: string, logo?: PdfImageAsset | null) {
  const xs = doc.nodes.map((n) => n.x - n.w / 2);
  const ys = doc.nodes.map((n) => n.y - n.h / 2);
  const xe = doc.nodes.map((n) => n.x + n.w / 2);
  const ye = doc.nodes.map((n) => n.y + n.h / 2);
  const minX = Math.min(...xs) - 40;
  const minY = Math.min(...ys) - 40;
  const maxX = Math.max(...xe) + 40;
  const maxY = Math.max(...ye) + 40;
  const sourceWidth = maxX - minX;

  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const marginX = 42.52;
  const contentTop = pageHeight - 98;
  const contentBottom = 58;
  const contentWidth = pageWidth - marginX * 2;
  const contentHeight = contentTop - contentBottom;
  const scale = Math.min(contentWidth / sourceWidth, 1);
  const drawWidth = sourceWidth * scale;
  const left = marginX + (contentWidth - drawWidth) / 2;
  const sourcePageHeight = contentHeight / scale;
  const sourcePages = paginateWithoutCuttingNodes(doc.nodes, minY, maxY, sourcePageHeight);
  const pageCount = sourcePages.length;
  const nodeMap = new Map(doc.nodes.map((node) => [node.id, node]));

  const pages: string[] = [];
  for (let page = 0; page < pageCount; page += 1) {
    const sourcePage = sourcePages[page];
    const pageTop = sourcePage.top;
    const pageBottom = sourcePage.bottom;
    const tf: PdfTransform = { minX, pageTop, scale, left, contentTop };
    const ops: string[] = [
      "q 1 1 1 rg 0 0 0 RG",
      `0 0 ${pdfNumber(pageWidth)} ${pdfNumber(pageHeight)} re f`,
      drawHeader(pageWidth, pageHeight, marginX, documentId, logo),
      drawFooter(pageWidth, marginX, page + 1, pageCount),
      `${pdfNumber(marginX)} ${pdfNumber(contentBottom)} ${pdfNumber(contentWidth)} ${pdfNumber(contentHeight)} re W n`,
      "0 0 0 RG 0 0 0 rg 1.25 w",
    ];

    for (const edge of doc.edges) {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) continue;
      const { d, mid } = edgePath(from, to);
      const converted = svgPathToPdfPath(d, tf);
      ops.push(converted.path, "S", drawArrow(converted.previous, converted.current));
      if (edge.label) {
        const labelPoint = transformPoint(mid, tf);
        ops.push(drawLabel(edge.label, labelPoint.x, labelPoint.y));
      }
    }

    for (const node of doc.nodes) {
      const nodeTop = node.y - node.h / 2 - 12;
      const nodeBottom = node.y + node.h / 2 + 12;
      if (nodeTop < pageTop || nodeBottom > pageBottom) continue;
      const center = transformPoint({ x: node.x, y: node.y }, tf);
      const w = node.w * scale;
      const h = node.h * scale;
      const shape = nodeShapePath(node, center.x, center.y, scale);
      ops.push("q 1 1 1 rg 0 0 0 RG 1 w", shape, node.kind === "predefined" ? "S Q" : "B Q");
      ops.push(
        drawCenteredText(
          node.label,
          center.x,
          center.y,
          Math.max(20, w - 16),
          Math.max(12, h - 10),
        ),
      );
    }

    ops.push("Q");
    pages.push(ops.join("\n"));
  }

  return { pages, pageWidth, pageHeight };
}

export function downloadSvg(doc: FlowDoc, innerHtml: string, filename = "fluxograma.svg") {
  const { svg } = buildStandaloneSvg(doc, innerHtml);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  downloadBlob(blob, filename);
}

export async function downloadPng(
  doc: FlowDoc,
  innerHtml: string,
  scale = 2,
  filename = "fluxograma.png",
) {
  const { canvas } = await renderSvgToCanvas(doc, innerHtml, scale);
  downloadBlob(await canvasToBlob(canvas, "image/png"), filename);
}

export async function downloadPdf(doc: FlowDoc, _innerHtml: string, filename = "fluxograma.pdf") {
  const logo = await loadPdfLogoAsset();
  const { pages, pageWidth, pageHeight } = buildPdfPages(doc, nextDocumentId(), logo);
  downloadBlob(buildPdf(pages, pageWidth, pageHeight, logo), filename);
}
