## Próximos Itens — Unificação de Estatísticas + Dashboard de Avaliação de Contato

### 1. Hook `usePeopleStats` unificado

**Problema**: Hoje `Secretaria.tsx` e `useDashboardStats.ts` calculam estatísticas de pessoas com lógica similar mas separada, o que gera risco de divergência.

**Solução**: Criar `src/hooks/usePeopleStats.ts` que centraliza:
- Contagem por `spiritual_status` (membros, decididos, visitantes, batizados, inativos)
- Contagem por `network` (homens, mulheres, jovens, kids, sem rede)
- Filtro por congregação e período (reutilizando a lógica existente)
- Retorno tipado e memoizado

**Refatoração**:
- `Secretaria.tsx`: substituir o `stats` useMemo por `usePeopleStats(members)`
- `useDashboardStats.ts`: usar `usePeopleStats` como base para as contagens, mantendo apenas os dados exclusivos do dashboard (aniversários, alertas, consolidação)

### 2. Dashboard de Avaliação de Contato dos Visitantes

**Contexto**: `consolidation_records` já armazena `contact_made` (boolean) e `contact_evaluation` (positiva / neutra / negativa / sem_resposta). Não existe visualização dessas métricas.

**Entregáveis**:

A) **Novo componente** `src/components/consolidation/VisitorContactDashboard.tsx`:
- Card com métricas do período (usando o filtro de data já existente na Consolidação):
  - Total de visitantes no período
  - Taxa de contato feito (%)
  - Distribuição das avaliações: positiva, neutra, negativa, sem resposta
  - Visitantes pendentes de contato (lista rápida)
- Gráfico de barras simples (usando as cores semânticas do funil)
- Cada métrica clicável abrindo Sheet com a lista de pessoas

B) **Integração em `Consolidacao.tsx`**:
- Inserir o `VisitorContactDashboard` logo abaixo do funil espiritual, antes das tabs
- Reutilizar o `periodMode/filterMonth/filterYear` já existente para filtrar os dados

C) **Hook de dados** (reutilizar `useConsolidation` ou criar `useVisitorContactStats`):
- Buscar `consolidation_records` com `stage='visitante'` e campos de contato
- Calcular métricas no frontend via `useMemo`

### Detalhes Técnicos

- **Sem migração de banco**: os campos `contact_made` e `contact_evaluation` já existem
- **Cores**: usar os tokens semânticos `chart-*` já criados (`--chart-visitante`, etc.)
- **UX**: hover, cursor-pointer, skeleton loading e empty states conforme padrão enterprise já estabelecido
- **Performance**: memoizar listas e contagens, evitar re-render desnecessário

### Arquivos esperados
- Novo: `src/hooks/usePeopleStats.ts`
- Novo: `src/components/consolidation/VisitorContactDashboard.tsx`
- Editado: `src/pages/Secretaria.tsx` (substituir stats local)
- Editado: `src/hooks/useDashboardStats.ts` (usar usePeopleStats)
- Editado: `src/pages/Consolidacao.tsx` (inserir dashboard de contato)
