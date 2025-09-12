import { useCallback, useRef } from 'react';

interface UseDebouncedSendOptions {
  delay: number;
}

export const useDebouncedSend = <T extends any[]>(
  callback: (...args: T) => void,
  options: UseDebouncedSendOptions = { delay: 300 }
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, options.delay);
    },
    [callback, options.delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const flush = useCallback(
    (...args: T) => {
      cancel();
      callback(...args);
    },
    [callback, cancel]
  );

  return {
    debouncedCallback,
    cancel,
    flush,
  };
};