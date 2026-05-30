# FluxoLab v0.2.0 - Structured Control Flow with Typed Arrows & Auto-Curves

## 🎯 Release Highlights

Esta release implementa as **3 correções críticas** solicitadas no análise de engenheiro/arquiteto:

### 1. ✅ **Setas e Tipos de Caminhos** (EdgeKind)
- Categorização semântica: `default`, `true`, `false`, `loop`, `return`
- Rótulos "Sim/Não" em decisões agora detectados automaticamente
- Suporte a múltiplas saídas via `fromPort` (top, right, bottom, left)

**Arquivos**:
- `src/components/flowchart/types.ts` — Novos tipos `EdgeKind` e `PortSide`

### 2. ✅ **Curvas Automáticas e Desfazimento de Cruzamentos**
- Arestas paralelas (fan-out) curvas simetricamente para evitar tangling
- Back-edges (loops, retornos) renderizados como arcos suaves (cubic Bézier)
- Algoritmo `computeEdgeCurves()` que automatiza a separação visual

**Arquivos**:
- `src/components/flowchart/geometry.ts` — `edgePath()` e `computeEdgeCurves()`

### 3. ✅ **Agrupador como Container Estruturado**
- Novo módulo **`controlFlow.ts`** — IR de fluxo estruturado (if/while/seq)
- Reconstrução automática de fluxo honrando:
  - Loops detectados por back-edges
  - Decisões em múltiplos caminhos
  - Grupos como regiões semânticas
  
- Reescrita completa dos **5 geradores de código** (Python, C#, Java, JavaScript, C++):
  - Agora emitem **controle de fluxo estruturado** (if/while real)
  - Regiões de grupo comentadas (`#region Grupo1` / `// region Grupo1`)
  - Grupos deixam de ser ignorados → moldam a saída

**Arquivos**:
- `src/components/flowchart/controlFlow.ts` (novo)
- `src/components/flowchart/codeBlueprints.ts` — Rewritten generators

## 📊 Quality Metrics

✅ **27 testes passando** (0 falhas)  
✅ **Build sucesso** (Vite SSR + Bun)  
✅ **Code size**: +487 insertions, -180 deletions (net ~307 lines)

## 📦 Docker Image

### Disponível em:
```bash
docker pull rubenslyra/fluxolab:0.2.0
docker pull rubenslyra/fluxolab:latest
```

### Usar local:
```bash
docker run -p 3000:80 rubenslyra/fluxolab:0.2.0
# Acesse em http://localhost:3000
```

### Compose:
```yaml
services:
  fluxolab:
    image: rubenslyra/fluxolab:0.2.0
    ports:
      - "3000:80"
    environment:
      NODE_ENV: production
    healthcheck:
      test: ["CMD", "wget", "-q", "-O-", "http://127.0.0.1/healthz"]
      interval: 30s
      timeout: 3s
      retries: 3
```

## 🔄 Próximas Fases (Sugeridas)

- [ ] UI para **colorir grupos** (color picker)
- [ ] **Redimensionar grupos** (resize handles)
- [ ] Inspecionadores de edge (edge kind + port dropdowns)
- [ ] Validação avançada (detectar loops irreducíveis)
- [ ] Exportação UML/SQL com mapping de grupos

## 🔗 Referências

- **Commit**: f065c27 (Estrutura de fluxo controlado...)
- **Branch**: main
- **Tag git**: (próxima: v0.2.0)

---

**Preparado por**: Arquiteto & Engenheiro de Software  
**Data**: 2026-05-29  
**Status**: ✅ Pronto para produção
