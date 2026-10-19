"use client";

import { useEffect, useState } from 'react';
import { classesApi } from '@/lib/classesApi';

// Show the Class hub only to teachers and to students who are in a class (or have an invite).
// Checked once per page load and shared by every component that asks.
let cached: { uid: string; show: boolean; pending: number } | null = null;
let inflight: Promise<{ show: boolean; pending: number }> | null = null;

export function useClassHub(uid: string | undefined) {
  const [state, setState] = useState<{ show: boolean; pending: number }>({ show: false, pending: 0 });
  useEffect(() => {
    if (!uid) { setState({ show: false, pending: 0 }); return; }
    if (cached?.uid === uid) { setState(cached); return; }
    inflight = inflight || Promise.all([classesApi.role(), classesApi.mine(), classesApi.myInvites()])
      .then(([role, mine, inv]) => {
        const pending = mine.tasks.filter((t) => !t.result).length;
        return { show: role.teacher_status === 'approved' || mine.classes.length > 0 || inv.length > 0, pending };
      })
      .catch(() => ({ show: false, pending: 0 }));
    let alive = true;
    inflight.then((r) => { cached = { uid, ...r }; inflight = null; if (alive) setState(r); });
    return () => { alive = false; };
  }, [uid]);
  return state;
}
