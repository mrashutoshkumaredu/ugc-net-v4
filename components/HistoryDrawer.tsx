"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { TestSubmission } from '@/lib/types';
import { formatTestLabel } from '@/lib/testTitle';

export default function HistoryDrawer({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('test_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) setError(error.message);
      else setSubmissions(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl relative max-h-[80vh] flex flex-col border border-slate-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold">✕</button>
        <h3 className="text-lg sm:text-xl font-bold text-indigo-900 mb-1">Your Test History</h3>
        <p className="text-xs text-slate-500 mb-4">A complete record of your past tests and unit scores.</p>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {!user && <p className="text-sm text-slate-500">Please log in to view your test history.</p>}
          {user && loading && <p className="text-sm text-slate-500">Loading…</p>}
          {user && !loading && error && <p className="text-sm text-rose-600">Couldn&apos;t load history: {error}</p>}
          {user && !loading && !error && submissions.length === 0 && (
            <p className="text-sm text-slate-500">No test attempts recorded yet.</p>
          )}
          {user && !loading && !error && submissions.map((item) => (
            <div key={item.id} className="p-4 border rounded-xl bg-slate-50">
              <div className="flex justify-between items-center gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">{formatTestLabel(item.test_mode)}</span>
                  <p className="text-xs text-slate-500 mt-1">{new Date(item.submitted_at).toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base sm:text-lg font-bold text-slate-800">
                    {item.correct_answers * 2}/{item.total_questions * 2} Marks
                  </span>
                  <span className="text-xs font-semibold block text-emerald-600">{item.score_percentage}% · {item.correct_answers}/{item.total_questions} correct</span>
                </div>
              </div>
              <div className="mt-2">
                <Link href={`/review/${item.id}`} onClick={onClose} className="text-[11px] font-bold text-indigo-700 hover:underline">
                  Deep Review →
                </Link>
              </div>
              {item.unit_breakdown && Object.keys(item.unit_breakdown).length > 1 && (
                <details className="mt-2">
                  <summary className="text-[11px] font-semibold text-indigo-700 cursor-pointer">Unit-wise score</summary>
                  <ul className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(item.unit_breakdown).map(([unit, u]) => (
                      <li key={unit} className="flex justify-between text-[11px] text-slate-600">
                        <span className="truncate pr-2">{unit}</span>
                        <span className="font-bold text-slate-800">{u.correct}/{u.total}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
