"use client";

// Password reset, in two steps (Supabase's standard recovery flow):
//  1. "request" — the student enters their email and gets a reset link.
//  2. "update"  — they arrive from that link; Supabase fires a
//     PASSWORD_RECOVERY event and this page shows the "new password" form.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { supabase } from '@/lib/supabase';
import { mapAuthError } from '@/lib/authErrors';

type Mode = 'request' | 'sent' | 'update' | 'done';

export default function ResetPasswordPage() {
  const [mode, setMode] = useState<Mode>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('update');
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMode('sent');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMode('done');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none mt-1';

  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-md mx-auto w-full p-6 flex flex-col justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {mode === 'request' && (
            <>
              <h2 className="text-xl font-bold text-indigo-900 mb-1">Forgot your password?</h2>
              <p className="text-xs text-slate-500 mb-5">Enter your account email and we&apos;ll send you a link to reset it.</p>
              <form onSubmit={handleRequest} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-600">
                  Email address
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="student@example.com" />
                </label>
                {error && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded">{error}</p>}
                <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                  {isLoading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}

          {mode === 'sent' && (
            <>
              <h2 className="text-xl font-bold text-indigo-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-slate-600">If an account exists for <strong>{email}</strong>, a reset link is on its way. Open it on this device.</p>
            </>
          )}

          {mode === 'update' && (
            <>
              <h2 className="text-xl font-bold text-indigo-900 mb-1">Set a new password</h2>
              <form onSubmit={handleUpdate} className="space-y-3 mt-4">
                <label className="block text-xs font-semibold text-slate-600">
                  New password
                  <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  Confirm new password
                  <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
                </label>
                {error && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded">{error}</p>}
                <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                  {isLoading ? 'Saving…' : 'Update password'}
                </button>
              </form>
            </>
          )}

          {mode === 'done' && (
            <>
              <h2 className="text-xl font-bold text-emerald-700 mb-2">Password updated</h2>
              <p className="text-sm text-slate-600 mb-4">You&apos;re logged in with your new password.</p>
              <Link href="/" className="btn btn-primary">Go to home</Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
