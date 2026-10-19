"use client";

import { useCallback, useEffect, useState } from 'react';
import { classesApi } from '@/lib/classesApi';

// Admin: approve or refuse teacher access requests.
export default function TeacherApprovals() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof classesApi.adminListTeachers>>>([]);
  const [err, setErr] = useState('');
  const load = useCallback(() => { classesApi.adminListTeachers().then(setRows).catch((e) => setErr(e.message)); }, []);
  useEffect(() => { load(); }, [load]);
  const set = (id: string, ok: boolean) => classesApi.adminSetTeacher(id, ok).then(load).catch((e) => setErr(e.message));

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold text-indigo-900">Teacher requests</h1>
        <p className="text-xs text-slate-500">Approved teachers can create classes and assign tasks on the Classes page.</p>
      </div>
      {err && <p className="text-sm text-rose-600">{err}</p>}
      {rows.length === 0 ? <p className="text-sm text-slate-500">No requests yet.</p> : (
        <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.user_id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <span>
                <strong>{r.name}</strong> <span className="text-slate-500">{r.email}</span>
                <span className={`ml-2 text-[11px] font-bold rounded-full px-2 py-0.5 ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : r.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{r.status}</span>
              </span>
              <span className="flex gap-2">
                {r.status !== 'approved' && <button onClick={() => set(r.user_id, true)} className="btn btn-primary btn-sm">Approve</button>}
                {r.status !== 'rejected' && <button onClick={() => set(r.user_id, false)} className="btn btn-secondary btn-sm">{r.status === 'approved' ? 'Remove access' : 'Refuse'}</button>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
