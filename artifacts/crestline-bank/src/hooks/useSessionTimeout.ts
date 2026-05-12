import { useEffect, useRef, useCallback, useState } from "react";

const TIMEOUT_MS = 15 * 60 * 1000;
const WARN_MS = 13 * 60 * 1000;

export function useSessionTimeout(onTimeout: () => void) {
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warnRef.current) clearTimeout(warnRef.current);
    setShowWarning(false);

    warnRef.current = setTimeout(() => {
      setShowWarning(true);
    }, WARN_MS);

    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, TIMEOUT_MS);
  }, [onTimeout]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warnRef.current) clearTimeout(warnRef.current);
    };
  }, [resetTimer]);

  const dismissWarning = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return { showWarning, dismissWarning };
}
