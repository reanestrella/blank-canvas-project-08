import { useEffect, useRef } from "react";

interface Options {
  ttlMs?: number;
  enabled?: boolean;
}

/**
 * Persiste valores de formulário em sessionStorage com TTL.
 * Restaura automaticamente ao montar se ainda dentro do TTL.
 * Útil para evitar perda ao trocar aba/app por curtos períodos.
 *
 * Uso:
 *   const [form, setForm] = useState(initial);
 *   useFormPersistence("transaction-modal", form, setForm, { enabled: open });
 *   // após submit/cancel: clearFormPersistence("transaction-modal")
 */
export function useFormPersistence<T>(
  key: string,
  values: T,
  setValues: (v: T) => void,
  { ttlMs = 120_000, enabled = true }: Options = {},
) {
  const storageKey = `__form_persist__:${key}`;
  const restoredRef = useRef(false);

  // Restore once on mount/enable
  useEffect(() => {
    if (!enabled || restoredRef.current) return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) {
        restoredRef.current = true;
        return;
      }
      const parsed = JSON.parse(raw) as { ts: number; data: T };
      if (Date.now() - parsed.ts <= ttlMs) {
        setValues(parsed.data);
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      /* ignore */
    }
    restoredRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Save on change (debounced)
  useEffect(() => {
    if (!enabled || !restoredRef.current) return;
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ ts: Date.now(), data: values }),
        );
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [values, enabled, storageKey]);
}

export function clearFormPersistence(key: string) {
  try {
    sessionStorage.removeItem(`__form_persist__:${key}`);
  } catch {
    /* ignore */
  }
}
