# 🚀 Deployment Local — FluxoLab v0.2.0

## ✅ Status: ATIVO

**Container**: `fluxolab` (ID: b5c0287a1614)  
**Imagem**: `fluxolab:local` (rebuild com v0.2.0)  
**Porta**: 8088 → 80 (container)  
**URL**: http://localhost:8088/fluxolab/  
**Healthz**: http://localhost:8088/healthz ← ✅ OK

---

## 📝 Alterações Implementadas

### 1. **Setas Tipadas & Rótulos Automáticos**
- `EdgeKind` (default, true, false, loop, return)
- Detecção automática Sim/Não em decisões
- Suporte a múltiplas saídas (fromPort)

### 2. **Curvas Automáticas**
- Arestas paralelas evitam cruzamentos
- Back-edges (loops) como arcos suaves
- `computeEdgeCurves()` — separação visual automática

### 3. **Agrupador Estruturado**
- Novo `controlFlow.ts` — IR estruturado
- Geradores (Python, C#, Java, JS, C++) reescritos
- Real if/while/seq nas saídas
- Grupos moldam código (regiões comentadas)

---

## 🔧 Arquivos Modificados

```
✨ Novos:
   - src/components/flowchart/controlFlow.ts

📝 Modificados:
   - src/components/flowchart/types.ts
   - src/components/flowchart/geometry.ts
   - src/components/flowchart/codeBlueprints.ts
   - src/components/flowchart/codeBlueprints.test.ts
   - src/components/flowchart/FlowchartEditor.tsx
```

---

## 📊 Qualidade

- ✅ 27 testes passando
- ✅ Build sucesso (Vite SSR)
- ✅ Container saudável (healthz: ok)

---

## 🔄 Próximos Passos (Sugeridos)

- [ ] Colorir grupos (color picker UI)
- [ ] Redimensionar grupos (resize handles)
- [ ] Inspector de edge (kind + port dropdowns)
- [ ] Validação avançada (loops irreducíveis)

---

**Commit**: f065c27  
**Data**: 2026-05-29  
**Status**: ✅ Live em http://localhost:8088/fluxolab/
