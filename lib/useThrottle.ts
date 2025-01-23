import { useCallback, useRef } from "react";

export function useThrottle(fn: (...args: any[]) => any, delay: number) {
  const lastCall = useRef<number>(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      if (now - lastCall.current > delay) {
        lastCall.current = now;
        fn(...args);
      } else if (!timer.current) {
        timer.current = setTimeout(() => {
          lastCall.current = Date.now();
          fn(...args);
          timer.current = null;
        }, delay);
      }
    },
    [fn, delay]
  );
}
