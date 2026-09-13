"use client";

import { useEffect, useState } from 'react';

/**
 * Tracks per-question time spent. `activeKey` switches the timer to a new
 * bucket (e.g. question index) without losing previously accumulated time.
 */
export function useStopwatch(activeKey: number, active: boolean) {
  const [timeSpent, setTimeSpent] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setTimeSpent((prev) => ({ ...prev, [activeKey]: (prev[activeKey] || 0) + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeKey, active]);

  return timeSpent;
}
