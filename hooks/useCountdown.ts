"use client";

import { useEffect, useRef, useState } from 'react';

/**
 * Counts down from `initialSeconds` to zero once `active` is true, calling
 * `onExpire` exactly once when it hits zero.
 */
export function useCountdown(initialSeconds: number, active: boolean, onExpire: () => void) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active]);

  return secondsRemaining;
}
