# Plano: Consolidação, Dashboard, Auditoria e Exclusão Segura

Vou entregar em 4 lotes para manter qualidade e revisão. Confirmação a cada lote.

---

## Lote 1 — Coerência de datas (Decididos / Funil) e Secretaria

**Objetivo:** os números do Dashboard, Funil Espiritual, Consolidação e Relatórios precisam bater usando sempre `conversion_date` (decididos), `created_at`/`visit_date` (visitantes) e `baptism_date` (batizados).

- `usePeopleStats`: aceitar critério por data temática:
  - Decididos: `conversion_date` cai no período (com fallback para `created_at` se nulo).
  - Visitantes: `created_at` ou `visit_date` no período.
  - Batizados: `baptism_date` no período.
- `SpiritualFunnel`: usar a mesma fonte/critério do Dashboard.
- `Consolidacao` (estatísticas/funil): mesma fonte.
- `MemberModal` (Secretaria): remover campo "Consolidador Responsável" (movido para Consolidação).
- Regra: cadastrar como `novo_convertido` com `conversion_date` antiga → conta no período correto.

## Lote 2 — Consolidadores múltiplos + métricas

**Schema (migration):**
- Nova tabela `consolidation_assignees(id, consolidation_id, consolidator_member_id, assigned_at, assigned_by)` com RLS por igreja.
- Manter `consolidator_id` legado (compat) mas UI passa a usar a nova tabela; backfill do legado.

**UI:**
- Em `ConsolidacaoDetail`/lista: multiselect de consolidadores (qualquer membro ativo), adicionar/remover/editar.
- Lista "Em Consolidação": mostrar avatares/iniciais e nomes dos consolidadores.
- Painel "Métricas por Consolidador": cards clicáveis com filtro mês/ano; clique abre lista das pessoas atribuídas.

## Lote 3 — Auditoria (logs + painel)

**Schema (migration):**
- `audit_logs(id, church_id, user_id, action, module, entity_type, entity_id, metadata jsonb, ip, user_agent, created_at)`.
- RLS: somente `pastor`/`secretario` da própria igreja podem ler; insert via SECURITY DEFINER `log_audit(...)`.
- Helper `src/lib/audit.ts` com `logAudit({ action, module, entity, metadata })` chamado nos pontos chave: visualização de ficha, edit/delete de membro, export PDF (extrato), troca de consolidador, remoção de visitante.

**UI:**
- Página `/auditoria` (guard pastor): tabela com filtros (usuário, módulo, ação, período, tipo), busca, paginação, exportação CSV.

## Lote 4 — Exclusão segura de pessoas (`safeDeleteMember`)

**Schema (migration) — RPC `safe_delete_member(p_member_id uuid)`:**
Em transação, na ordem:
1. `UPDATE profiles SET member_id = NULL WHERE member_id = p_member_id` (mantém usuário do app).
2. `UPDATE cells SET leader_id/supervisor_id/vice_leader_1_id/vice_leader_2_id = NULL` onde apontarem para o membro.
3. `DELETE FROM cell_members`, `cell_report_attendance`, `cell_visitors (invited_by → NULL)`.
4. `DELETE FROM consolidation_records WHERE member_id = ... OR consolidator_id = ...` (e nova `consolidation_assignees`).
5. `DELETE FROM discipleships` onde participar.
6. `UPDATE financial_transactions SET member_id = NULL` (preserva histórico).
7. `DELETE FROM ministry_volunteers / ministry_role_members / schedule_volunteers / event_registrations / course_students`.
8. `DELETE FROM members WHERE id = p_member_id`.
- Retorna `json` com vínculos removidos, para feedback.

**Frontend:**
- `src/lib/safeDeleteMember.ts` chamando o RPC; usado por `useMembers.deleteMember`, lista de visitantes, etc.
- Modal de confirmação listando vínculos detectados (preview via SELECT antes do delete).
- Toast amigável; logs no console com FK bloqueante caso falhe.

**RLS:** revisar políticas das tabelas tocadas para permitir delete a `user_is_church_admin`.

---

## Ordem proposta

1. Lote 1 (datas + remover campo Secretaria) — rápido, alto impacto.
2. Lote 4 (exclusão segura) — desbloqueia operação imediata.
3. Lote 2 (consolidadores múltiplos).
4. Lote 3 (auditoria completa).

Posso começar pelos **Lotes 1 + 4 juntos** (não conflitam) e depois seguir para 2 e 3. Confirmar para iniciar?
