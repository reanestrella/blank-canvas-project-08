import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

interface Options {
  ttlMs?: number;
  enabled?: boolean;
}

/**
 * Persistência de formulários react-hook-form em sessionStorage.
 * Restaura uma única vez quando o modal abre (enabled=true) e dentro do TTL.
 * Salva alterações com debounce. Limpe via clearRhfFormPersistence ao submit/cancel.
 */
export function useRhfFormPersistence<T extends Record<string, any>>(
  key: string,
  form: UseFormReturn<T>,
  { ttlMs = 120_000, enabled = true }: Options = {},
) {
  const storageKey = `__form_persist__:${key}`;
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      restoredRef.current = false;
      return;
    }
    if (restoredRef.current) return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; data: T };
        if (Date.now() - parsed.ts <= ttlMs) {
          form.reset(parsed.data as any);
        } else {
          sessionStorage.removeItem(storageKey);
        }
      }
    } catch {
      /* ignore */
    }
    restoredRef.current = true;
  }, [enabled, storageKey, ttlMs, form]);

  useEffect(() => {
    if (!enabled) return;
    const sub = form.watch((values) => {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ ts: Date.now(), data: values }),
        );
      } catch {
        /* ignore */
      }
    });
    return () => sub.unsubscribe();
  }, [enabled, storageKey, form]);
}

export function clearRhfFormPersistence(key: string) {
  try {
    sessionStorage.removeItem(`__form_persist__:${key}`);
  } catch {
    /* ignore */
  }
}
