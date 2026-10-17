"use client";

import { useEffect, useRef, useState } from 'react';

/**
 * Counts down to a fixed end time (`endAtMs`, in this device's clock).
 * Remaining time is always end − now, so it stays correct when the tab is
 * in the background (browsers slow timers there) or the page is reloaded.
 * Calls `onExpire` once when it reaches zero.
 */
export function useCountdown(endAtMs: number | null, active: boolean, onExpire: () => void) {
  const compute = () => (endAtMs === null ? 0 : Math.max(0, Math.ceil((endAtMs - Date.now()) / 1000)));
  const [secondsRemaining, setSecondsRemaining] = useState(compute);
  const onExpireRef = useRef(onExpire);
  const firedRef = useRef(false);
  onExpireRef.current = onExpire;

  useEffect(() => {
    firedRef.current = false;
    setSecondsRemaining(compute());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endAtMs]);

  useEffect(() => {
    if (!active || endAtMs === null) return;
    const tick = () => {
      const left = compute();
      setSecondsRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, endAtMs]);

  return secondsRemaining;
}
