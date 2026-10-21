'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sendContactMessage } from '@/lib/contactApi';
import { CONTACT_EMAIL } from '@/lib/site';

export const CONTACT_TOPICS = ['Problem with a test', 'Login or account', 'Wrong question or answer', 'Suggestion', 'Other'] as const;

export default function ContactForm() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<string>(CONTACT_TOPICS[0]);
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot: real people leave this empty
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[${topic}] UGC NET Paper 1 Portal`)}&body=${encodeURIComponent(message)}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (website) { setSent(true); return; } // a bot filled the hidden field; pretend success
    setSending(true);
    try {
      await sendContactMessage({ name, email: email || user?.email || '', topic, message });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white border border-emerald-200 rounded-2xl p-6 text-center" role="status">
        <p className="text-sm font-bold text-emerald-800">Thank you, your message has been sent.</p>
        <p className="mt-1 text-xs text-slate-600">We will reply to the email address you gave.</p>
      </div>
    );
  }

  const input = 'w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500';
  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-slate-600">Your name
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoComplete="name" className={`${input} mt-1`} />
        </label>
        <label className="block text-xs font-semibold text-slate-600">Your email
          <input type="email" value={email || user?.email || ''} onChange={(e) => setEmail(e.target.value)} required maxLength={200} autoComplete="email" className={`${input} mt-1`} />
        </label>
      </div>
      <label className="block text-xs font-semibold text-slate-600">Topic
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className={`${input} mt-1`}>
          {CONTACT_TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className="block text-xs font-semibold text-slate-600">Message
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} maxLength={3000} rows={6}
          placeholder="Tell us what happened. Include the paper, question number or page if it helps." className={`${input} mt-1`} />
        <span className="block mt-1 text-right text-[11px] text-slate-400">{message.length}/3000</span>
      </label>
      {/* Honeypot, hidden from people and screen readers */}
      <div className="hidden" aria-hidden>
        <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
      </div>
      {error && <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg" role="alert">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={sending} className="px-5 py-2.5 bg-indigo-700 text-white text-sm font-bold rounded-lg hover:bg-indigo-800 disabled:opacity-50">
          {sending ? 'Sending…' : 'Send message'}
        </button>
        <a href={mailtoHref} className="text-xs font-bold text-slate-600 hover:underline">or open in your email app</a>
      </div>
    </form>
  );
}
