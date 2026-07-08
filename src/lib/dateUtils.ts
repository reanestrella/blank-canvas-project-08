/**
 * Utilitários de data locais ao fuso do dispositivo.
 *
 * PROBLEMA QUE ESTES HELPERS RESOLVEM
 * -----------------------------------
 * `new Date().toISOString()` converte o instante para UTC antes de serializar.
 * No Brasil (UTC-3), a partir das 21h o UTC já está no dia seguinte:
 *
 *   // terça, 07/07/2026 21:30 BRT
 *   new Date().toISOString().split("T")[0]  // => "2026-07-08"  ❌ amanhã
 *
 * Por isso date pickers abriam pré-selecionados com a data errada à noite.
 *
 * QUANDO USAR
 * -----------
 * - `todayISO()`  → valor padrão de <Input type="date"> e campos YYYY-MM-DD.
 * - `today()`     → valor padrão de date pickers que recebem um objeto Date.
 *
 * QUANDO **NÃO** USAR
 * -------------------
 * Timestamps persistidos (`updated_at`, `completed_at`, …) devem continuar
 * usando `new Date().toISOString()` — o banco espera UTC.
 */

/** Formata um Date como YYYY-MM-DD usando os componentes LOCAIS (nunca UTC). */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Data de hoje como "YYYY-MM-DD" no fuso do dispositivo.
 * Seguro como valor padrão de campos de data em qualquer fuso horário.
 */
export function todayISO(): string {
  return toISODateString(new Date());
}

/**
 * Data de hoje como Date à meia-noite LOCAL.
 * Use em date pickers que trabalham com objetos Date.
 *
 * Atenção: não chame `.toISOString()` no retorno — isso reintroduz o bug de
 * fuso. Para obter a string, use `todayISO()` ou `toISODateString()`.
 */
export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
