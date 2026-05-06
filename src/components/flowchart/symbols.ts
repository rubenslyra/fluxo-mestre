// ISO 5807 flowchart symbol definitions
export type SymbolKind =
  | "terminator"
  | "process"
  | "decision"
  | "data"
  | "predefined"
  | "preparation"
  | "document"
  | "manual"
  | "display"
  | "connector";

export interface SymbolDef {
  kind: SymbolKind;
  name: string;
  description: string;
  defaultLabel: string;
  defaultWidth: number;
  defaultHeight: number;
}

export const SYMBOLS: Record<SymbolKind, SymbolDef> = {
  terminator: {
    kind: "terminator",
    name: "Terminal",
    description: "Início ou fim do fluxo",
    defaultLabel: "Início",
    defaultWidth: 140,
    defaultHeight: 60,
  },
  process: {
    kind: "process",
    name: "Processo",
    description: "Operação ou cálculo",
    defaultLabel: "Processar",
    defaultWidth: 160,
    defaultHeight: 70,
  },
  decision: {
    kind: "decision",
    name: "Decisão",
    description: "Desvio condicional (Sim/Não)",
    defaultLabel: "Condição?",
    defaultWidth: 160,
    defaultHeight: 100,
  },
  data: {
    kind: "data",
    name: "Dados (E/S)",
    description: "Entrada ou saída de dados",
    defaultLabel: "Ler / Escrever",
    defaultWidth: 170,
    defaultHeight: 70,
  },
  predefined: {
    kind: "predefined",
    name: "Sub-rotina",
    description: "Processo pré-definido (função)",
    defaultLabel: "Sub-rotina",
    defaultWidth: 170,
    defaultHeight: 70,
  },
  preparation: {
    kind: "preparation",
    name: "Preparação",
    description: "Inicialização (ex: laços)",
    defaultLabel: "Inicializar i = 0",
    defaultWidth: 180,
    defaultHeight: 70,
  },
  document: {
    kind: "document",
    name: "Documento",
    description: "Saída em documento",
    defaultLabel: "Documento",
    defaultWidth: 160,
    defaultHeight: 80,
  },
  manual: {
    kind: "manual",
    name: "Entrada manual",
    description: "Entrada manual (teclado)",
    defaultLabel: "Digite valor",
    defaultWidth: 170,
    defaultHeight: 70,
  },
  display: {
    kind: "display",
    name: "Exibição",
    description: "Mostrar na tela",
    defaultLabel: "Exibir resultado",
    defaultWidth: 170,
    defaultHeight: 70,
  },
  connector: {
    kind: "connector",
    name: "Conector",
    description: "Conector de página",
    defaultLabel: "A",
    defaultWidth: 60,
    defaultHeight: 60,
  },
};

// Returns the SVG shape <path>/<polygon>/etc. for a given symbol centered at (0,0) with width w and height h
export function getShapePath(kind: SymbolKind, w: number, h: number): string {
  const x = -w / 2;
  const y = -h / 2;
  switch (kind) {
    case "terminator": {
      const r = h / 2;
      return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
    }
    case "process":
      return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
    case "decision":
      return `M 0 ${y} L ${x + w} 0 L 0 ${y + h} L ${x} 0 Z`;
    case "data": {
      const skew = 18;
      return `M ${x + skew} ${y} H ${x + w} L ${x + w - skew} ${y + h} H ${x} Z`;
    }
    case "predefined": {
      const inset = 12;
      return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z M ${x + inset} ${y} V ${y + h} M ${x + w - inset} ${y} V ${y + h}`;
    }
    case "preparation": {
      const k = 22;
      return `M ${x + k} ${y} H ${x + w - k} L ${x + w} 0 L ${x + w - k} ${y + h} H ${x + k} L ${x} 0 Z`;
    }
    case "document": {
      const wave = 12;
      return `M ${x} ${y} H ${x + w} V ${y + h - wave} Q ${x + (w * 3) / 4} ${y + h + wave} ${x + w / 2} ${y + h - wave / 2} T ${x} ${y + h - wave} Z`;
    }
    case "manual": {
      const slope = 14;
      return `M ${x} ${y + slope} L ${x + w} ${y} V ${y + h} H ${x} Z`;
    }
    case "display": {
      const curve = 18;
      return `M ${x + curve} ${y} H ${x + w - curve} L ${x + w} 0 L ${x + w - curve} ${y + h} H ${x + curve} Q ${x - curve / 2} 0 ${x + curve} ${y} Z`;
    }
    case "connector": {
      const r = Math.min(w, h) / 2;
      return `M ${-r} 0 A ${r} ${r} 0 1 0 ${r} 0 A ${r} ${r} 0 1 0 ${-r} 0 Z`;
    }
  }
}
