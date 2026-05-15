import { useEffect, useRef } from "react";

interface Options {
  ttlMs?: number;
  /** When false, no save and no restore. */
  enabled?: boolean;
}

/**
 * Persiste o estado aberto/fechado de um modal em sessionStorage com TTL.
 * Restaura ao montar (ou quando enabled passa a true) se ainda dentro do TTL.
 *
 * Uso típico (apenas para modal de criação):
 *   useOpenPersistence("transaction-new", open, setOpen, { enabled: !editing });
 */
export function useOpenPersistence(
  key: string,
  open: boolean,
  setOpen: (v: boolean) => void,
  { ttlMs = 120_000, enabled = true }: Options = {},
) {
  const storageKey = `__open_persist__:${key}`;
  const restoredRef = useRef(false);

  // Restore once
  useEffect(() => {
    if (!enabled || restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { ts: number; open: boolean };
      if (parsed.open && Date.now() - parsed.ts <= ttlMs) {
        setOpen(true);
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Save on change
  useEffect(() => {
    if (!enabled) return;
    try {
      if (open) {
        sessionStorage.setItem(storageKey, JSON.stringify({ ts: Date.now(), open: true }));
      } else if (restoredRef.current) {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      /* ignore */
    }
  }, [open, enabled, storageKey]);
}

export function clearOpenPersistence(key: string) {
  try {
    sessionStorage.removeItem(`__open_persist__:${key}`);
  } catch {
    /* ignore */
  }
}
