"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ReportIssueType } from '@/lib/types';

const ISSUE_TYPES: ReportIssueType[] = [
  'Wrong Answer Key',
  'Typo / Formatting Error',
  'Incomplete Question Text',
  'Other',
];

export default function ReportModal({ questionId, onClose }: { questionId: number; onClose: () => void }) {
  const { user } = useAuth();
  const [issueType, setIssueType] = useState<ReportIssueType>('Wrong Answer Key');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const { error } = await supabase.from('report_issues').insert({
      question_id: questionId,
      user_id: user?.id || null,
      user_email: user?.email || null,
      issue_type: issueType,
      comment: comment || null,
    });
    setSubmitting(false);
    if (error) {
      setError(user ? error.message : 'Please log in to report an issue.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative border border-slate-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold">✕</button>
        <h3 className="text-lg font-bold text-rose-900 mb-1 flex items-center gap-2">🚩 Report Question Discrepancy</h3>
        <p className="text-xs text-slate-500 mb-4">Spotted a typo or wrong answer key? Let us know and we&apos;ll fix it.</p>

        {submitted ? (
          <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">Thank you! Your feedback has been submitted for review.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Issue Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as ReportIssueType)}
                className="w-full p-2.5 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none mt-1 bg-slate-50"
              >
                {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Additional Details (Optional)</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Briefly explain what seems incorrect..."
                className="w-full p-2.5 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none mt-1"
              />
            </div>
            {error && <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition text-xs sm:text-sm shadow-md disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Feedback'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
