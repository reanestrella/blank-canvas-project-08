# Correções de Consistência — Dashboard, Consolidação, Financeiro e Formulários

Plano dividido em 6 lotes independentes. Confirmar para iniciar (ou indicar quais lotes priorizar).

---

## Lote 1 — Fonte única de métricas de Consolidação

**Problema:** Dashboard mostra 1 em consolidação, página Consolidação mostra 2 — fontes diferentes.

**Solução:**
- Criar `src/lib/consolidationMetrics.ts` exportando `getConsolidationMetrics({ churchId, congregationId, dateFrom, dateTo })`.
- Retorna: `{ emAcompanhamento, concluidos, desistentes, decididos, total, registros[] }`.
- Regra única: usa `consolidation_records` filtrado por `church_id` + período (em `decision_date` ou `created_at` quando ausente) + congregação opcional.
- Refatorar para usar essa função:
  - `src/hooks/useDashboardStats.ts` (cards "Em Consolidação", "Consolidados", "Desistentes")
  - `src/pages/Consolidacao.tsx` (estatísticas e filtros)
  - `src/components/dashboard/SpiritualFunnel.tsx` (etapa "Decididos / Consolidação")
  - Exportações PDF da Consolidação
- Adicionar filtro de mês/ano padronizado (componente `PeriodFilter` reutilizado).

---

## Lote 2 — Visitante mantém histórico ao virar Decidido

**Problema:** Quando visitante muda `spiritual_status` para "decidido", deixa de aparecer na contagem de visitantes do mês.

**Solução:**
- Adicionar coluna `members.first_visit_date date` (preenche com `created_at::date` no backfill quando `spiritual_status` foi visitante).
- Ajustar `usePeopleStats.ts`: `visitantes` = membros cuja `first_visit_date` cai no período filtrado, **independente** do status atual.
- `decididos` = membros com `conversion_date` no período (já implementado parcialmente).
- Mesma pessoa pode contar nas duas métricas no mesmo mês.
- Atualizar:
  - Dashboard (cards e Funil Espiritual)
  - Secretaria (resumos)
  - Consolidação (estatísticas)
  - Gráficos e PDFs

**Migration necessária:**
```sql
ALTER TABLE members ADD COLUMN first_visit_date date;
UPDATE members SET first_visit_date = created_at::date 
  WHERE spiritual_status IN ('visitante','decidido','membro') AND first_visit_date IS NULL;
-- trigger: ao inserir com status visitante, preenche first_visit_date = today se nulo
```

---

## Lote 3 — Persistência de formulários (anti-fechamento)

**Problema:** Modais perdem dados ao trocar aba/app.

**Solução:**
- Criar hook `useFormPersistence(key, values, { ttlMs = 120000 })`:
  - Salva em `sessionStorage` com debounce 500ms.
  - Restaura ao montar se TTL não expirou.
  - Limpa ao submeter com sucesso ou ao cancelar explicitamente.
- Garantir que modais **não fechem** em `visibilitychange` / `blur` (revisar `Dialog onOpenChange` e remover qualquer auto-close).
- Aplicar em: `TransactionModal`, `MemberModal`, `EventModal`, modal de Consolidação, `CellReportModal`.

---

## Lote 4 — Parcelamento em Contas a Pagar

**Solução:**
- Adicionar campos em `financial_payables`: `installment_number int`, `installment_total int`, `installment_group_id uuid`.
- No `useFinancialPayables.createPayable`, aceitar `{ installments: number }`:
  - Gera N registros, mesmo `installment_group_id`, `due_date` mensal incremental, descrição `"X (3/10)"`.
- UI em `PayablesTab`:
  - Switch "Parcelado" + input nº parcelas.
  - Coluna mostrando "3/10" e badge de status do grupo (pagas/pendentes).
  - Filtro por competência (mês de vencimento).

**Migration:**
```sql
ALTER TABLE financial_payables 
  ADD COLUMN installment_number int,
  ADD COLUMN installment_total int,
  ADD COLUMN installment_group_id uuid;
```

---

## Lote 5 — PDFs respeitam filtros ativos

**Problema:** Exportações ignoram filtros de tela.

**Solução:**
- Centralizar geração: passar sempre `{ dateFrom, dateTo, congregationId, ...filters }` para funções de export.
- Refatorar:
  - `src/lib/pdfExport.ts` — aceitar filtros e aplicar antes do render.
  - `ExtratoTab` — passar filtros atuais ao baixar extrato.
  - Consolidação — exportar apenas registros filtrados.
  - Secretaria — exportar apenas membros do filtro ativo.
- Cabeçalho do PDF mostra o período/filtros aplicados.

---

## Lote 6 — Padronização final e QA

- Criar `src/lib/periodFilter.ts` com helpers (`getMonthRange`, `getYearRange`, `formatPeriodLabel`).
- Padronizar componente `<PeriodFilter />` reutilizado em todas as páginas.
- Adicionar `console.debug` com tag `[Metrics]` em pontos-chave para auditoria.
- Smoke test manual: comparar números de Dashboard ↔ Consolidação ↔ PDF para o mesmo período.

---

## Ordem sugerida de execução

1. Lote 2 (migration `first_visit_date`) + Lote 1 (métricas unificadas) — base de tudo.
2. Lote 4 (migration parcelamento) + UI.
3. Lote 3 (persistência forms).
4. Lote 5 (PDFs).
5. Lote 6 (QA + padronização).

**Pode confirmar para eu iniciar pelo Lote 1+2 (com a migration)?**
