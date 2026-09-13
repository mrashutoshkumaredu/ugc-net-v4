"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthModal({
  initialMode,
  onClose,
  onSuccess,
}: {
  initialMode: 'LOGIN' | 'REGISTER';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { signUp, signIn } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(initialMode === 'REGISTER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (isSignUpMode && !fullName) {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    setError('');
    setInfo('');
    try {
      if (isSignUpMode) {
        const { loggedIn } = await signUp(email, password, fullName);
        if (loggedIn) {
          onSuccess();
        } else {
          setInfo('Registration successful! Check your email to confirm your account, then log in.');
        }
      } else {
        await signIn(email, password);
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative border border-slate-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold">✕</button>
        <h3 className="text-lg sm:text-xl font-bold text-indigo-900 mb-1">
          {isSignUpMode ? 'Student Registration' : 'Student Login Required'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">Please log in or create an account to start your timed test.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUpMode && (
            <div>
              <label className="text-xs font-semibold text-slate-600">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ananya Sharma"
                className="w-full p-2.5 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none mt-1"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-600">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full p-2.5 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none mt-1"
            />
          </div>

          {info && <p className="text-xs text-emerald-700 font-medium bg-emerald-50 p-2 rounded">{info}</p>}
          {error && <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition text-xs sm:text-sm disabled:opacity-50"
          >
            {isLoading ? 'Processing…' : isSignUpMode ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          <span>{isSignUpMode ? 'Already have an account?' : "Don't have an account?"}</span>
          <button
            type="button"
            onClick={() => { setIsSignUpMode(!isSignUpMode); setError(''); setInfo(''); }}
            className="text-indigo-600 font-bold underline ml-1"
          >
            {isSignUpMode ? 'Login' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
