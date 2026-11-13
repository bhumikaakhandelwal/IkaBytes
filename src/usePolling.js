import { useEffect, useRef } from 'react';

/**
 * Calls `fn` every `ms` milliseconds while the browser tab is visible,
 * and immediately when the user comes back to the tab.
 * Keeps dashboards in sync with MongoDB without a page reload.
 */
export function usePolling(fn, ms = 10000, enabled = true) {
  const saved = useRef(fn);
  saved.current = fn;

  useEffect(() => {
    if (!enabled) return undefined;
    const tick = () => {
      if (document.visibilityState === 'visible') saved.current();
    };
    const id = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [ms, enabled]);
}

export default usePolling;
