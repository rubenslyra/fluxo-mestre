import type {
  FlowNode,
  FlowNodeTextStyle,
  NodeFontFamily,
  NodeTextAlign,
  NodeTextListStyle,
} from "./types";

export const TEXT_ALIGN_OPTIONS: Array<{ value: NodeTextAlign; label: string }> = [
  { value: "left", label: "Esquerda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Direita" },
];

export const TEXT_LIST_OPTIONS: Array<{ value: NodeTextListStyle; label: string }> = [
  { value: "plain", label: "Texto livre" },
  { value: "bulleted", label: "Tópicos" },
  { value: "numbered", label: "Enumeração" },
];

export const FONT_FAMILY_OPTIONS: Array<{ value: NodeFontFamily; label: string }> = [
  { value: "display", label: "Padrão" },
  { value: "sans", label: "Sem serifa" },
  { value: "serif", label: "Serifada" },
  { value: "mono", label: "Monoespacada" },
];

export const CSS_FONT_FAMILY: Record<NodeFontFamily, string> = {
  display: "var(--font-display)",
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-mono)",
};

export const EXPORT_FONT_FAMILY: Record<NodeFontFamily, string> = {
  display: "Space Grotesk, ui-sans-serif, system-ui, sans-serif",
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "JetBrains Mono, ui-monospace, monospace",
};

export const PDF_FONT_RESOURCE: Record<NodeFontFamily, "F1" | "F2" | "F3"> = {
  display: "F1",
  sans: "F1",
  serif: "F2",
  mono: "F3",
};

export interface NodeTextBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const alignValues = new Set<NodeTextAlign>(["left", "center", "right"]);
const listValues = new Set<NodeTextListStyle>(["plain", "bulleted", "numbered"]);
const fontValues = new Set<NodeFontFamily>(["display", "sans", "serif", "mono"]);

export function defaultTextStyle(node: Pick<FlowNode, "kind">): Required<FlowNodeTextStyle> {
  if (node.kind === "group") {
    return {
      align: "left",
      fontSize: 13,
      lineHeight: 1.15,
      fontFamily: "display",
      listStyle: "plain",
    };
  }

  return {
    align: "center",
    fontSize: 13,
    lineHeight: 1.2,
    fontFamily: "display",
    listStyle: "plain",
  };
}

export function resolveTextStyle(node: FlowNode): Required<FlowNodeTextStyle> {
  return {
    ...defaultTextStyle(node),
    ...node.textStyle,
  };
}

export function parseTextStyle(
  value: unknown,
  node: Pick<FlowNode, "kind">,
): FlowNodeTextStyle | undefined {
  if (!value || typeof value !== "object") return undefined;
  const partial = value as Partial<FlowNodeTextStyle>;
  const defaults = defaultTextStyle(node);
  const style: FlowNodeTextStyle = {};

  if (partial.align && alignValues.has(partial.align)) style.align = partial.align;
  if (partial.listStyle && listValues.has(partial.listStyle)) style.listStyle = partial.listStyle;
  if (partial.fontFamily && fontValues.has(partial.fontFamily)) {
    style.fontFamily = partial.fontFamily;
  }

  const fontSize = Number(partial.fontSize);
  if (Number.isFinite(fontSize)) {
    style.fontSize = Math.max(8, Math.min(28, Math.round(fontSize)));
  }

  const lineHeight = Number(partial.lineHeight);
  if (Number.isFinite(lineHeight)) {
    style.lineHeight = Math.max(0.9, Math.min(2, Number(lineHeight.toFixed(2))));
  }

  const entries = Object.entries(style).filter(
    ([key, val]) => defaults[key as keyof FlowNodeTextStyle] !== val,
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function stripExistingMarker(line: string) {
  return line.replace(/^\s*(?:[-*]\s+|\d+[.)-]\s*)/, "");
}

export function formatNodeTextLines(label: string, listStyle: NodeTextListStyle) {
  if (listStyle === "plain") {
    const lines = label.split(/\r?\n/);
    return lines.length ? lines : [""];
  }

  const lines = label
    .split(/\r?\n/)
    .map((line) => stripExistingMarker(line).trim())
    .filter(Boolean);

  if (listStyle === "bulleted") return lines.map((line) => `- ${line}`);
  return lines.map((line, index) => `${index + 1}. ${line}`);
}

export function nodeTextBox(node: Pick<FlowNode, "kind" | "w" | "h">): NodeTextBox {
  if (node.kind === "group") {
    return {
      x: -node.w / 2 + 24,
      y: -node.h / 2 + 15,
      w: Math.max(1, node.w - 48),
      h: 30,
    };
  }

  let left = 16;
  let right = 16;
  let top = 12;
  let bottom = 12;

  switch (node.kind) {
    case "terminator": {
      left = right = Math.max(18, Math.min(30, node.h * 0.32));
      top = bottom = 10;
      break;
    }
    case "decision": {
      left = right = Math.max(34, node.w * 0.24);
      top = bottom = Math.max(20, node.h * 0.24);
      break;
    }
    case "data": {
      left = 32;
      right = 28;
      top = bottom = 12;
      break;
    }
    case "predefined": {
      left = right = 28;
      break;
    }
    case "preparation": {
      left = right = 36;
      top = bottom = 12;
      break;
    }
    case "document": {
      left = right = 16;
      top = 12;
      bottom = 24;
      break;
    }
    case "manual": {
      left = right = 16;
      top = 20;
      bottom = 12;
      break;
    }
    case "display": {
      left = 32;
      right = 28;
      top = bottom = 12;
      break;
    }
    case "connector": {
      left = right = Math.max(12, node.w * 0.2);
      top = bottom = Math.max(12, node.h * 0.2);
      break;
    }
  }

  return {
    x: -node.w / 2 + left,
    y: -node.h / 2 + top,
    w: Math.max(1, node.w - left - right),
    h: Math.max(1, node.h - top - bottom),
  };
}

export function estimateNodeTextSize(node: FlowNode, style = resolveTextStyle(node)) {
  const lines =
    node.kind === "group"
      ? [
          formatNodeTextLines(node.label, "plain")
            .map((line) => line.trim())
            .filter(Boolean)
            .join(" ") ||
            node.name ||
            "Grupo",
        ]
      : formatNodeTextLines(node.label, style.listStyle);
  const charFactor =
    style.fontFamily === "mono" ? 0.62 : style.fontFamily === "serif" ? 0.55 : 0.54;
  const maxLineLength = Math.max(1, ...lines.map((line) => line.length));
  return {
    w: maxLineLength * style.fontSize * charFactor,
    h: Math.max(1, lines.length) * style.fontSize * style.lineHeight,
  };
}
