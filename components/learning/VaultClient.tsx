"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import PageShell from '@/components/PageShell';
import { cleanNewlines, normalizeUnit } from '@/lib/scoring';
import { getPaperDisplayName } from '@/lib/normalize';
import {
  createVaultFolder, deleteVaultFolder, listVaultFolders, listVaultItems, removeFromVault, renameVaultFolder,
} from '@/lib/testApi';
import type { VaultFolder } from '@/lib/types';

const MathText = dynamic(() => import('@/components/quiz/MathText'), { ssr: false });

type Item = Awaited<ReturnType<typeof listVaultItems>>[number];

const KIND_NOTE: Record<VaultFolder['kind'], string> = {
  wrong: 'Added automatically when you answer a question wrongly.',
  lucky: "Added automatically when you mark 'I'm guessing' and get it right.",
  custom: 'Your own folder.',
};

export default function VaultClient() {
  return (
    <PageShell title="Revision Vault" subtitle="Questions saved for revision. Retest yourself on any folder; questions you get wrong are added to 'Wrong answers' automatically." requireLogin>
      <VaultBody />
    </PageShell>
  );
}

function VaultBody() {
  const router = useRouter();
  const [folders, setFolders] = useState<VaultFolder[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadFolders = useCallback(async () => {
    try {
      const f = await listVaultFolders();
      setFolders(f);
      setActiveId((cur) => (cur && f.some((x) => x.id === cur) ? cur : f[0]?.id ?? null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your vault.');
    }
  }, []);

  useEffect(() => { loadFolders(); }, [loadFolders]);

  useEffect(() => {
    if (!activeId) { setItems(null); return; }
    setItems(null);
    listVaultItems(activeId).then(setItems).catch((e) => setError(e instanceof Error ? e.message : 'Could not load this folder.'));
  }, [activeId]);

  const active = folders?.find((f) => f.id === activeId) ?? null;

  const create = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    setError('');
    try {
      const f = await createVaultFolder(newName);
      setNewName('');
      await loadFolders();
      setActiveId(f.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the folder.');
    } finally {
      setBusy(false);
    }
  };

  const rename = async () => {
    if (!active || active.kind !== 'custom') return;
    const name = window.prompt('New folder name', active.name);
    if (!name || !name.trim() || name === active.name) return;
    try {
      await renameVaultFolder(active.id, name);
      await loadFolders();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not rename.');
    }
  };

  const remove = async () => {
    if (!active) return;
    if (!window.confirm(`Delete the folder "${active.name}" and its ${active.item_count ?? 0} saved question(s)? The questions stay on the site; only your saved list is removed.`)) return;
    try {
      await deleteVaultFolder(active.id);
      setActiveId(null);
      await loadFolders();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  const removeItem = async (questionId: number) => {
    if (!active) return;
    try {
      await removeFromVault(active.id, questionId);
      setItems((list) => list?.filter((i) => i.question_id !== questionId) ?? null);
      setFolders((fs) => fs?.map((f) => (f.id === active.id ? { ...f, item_count: Math.max(0, (f.item_count ?? 1) - 1) } : f)) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove.');
    }
  };

  const retest = () => {
    if (!active) return;
    const count = Math.min(active.item_count ?? 10, 50);
    router.push(`/quiz?mode=VAULT&folder=${active.id}&count=${count}`);
  };

  if (!folders) return error ? <p className="text-sm text-rose-600">{error}</p> : <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
      <aside className="bg-white border border-slate-200 rounded-2xl p-3 space-y-1 self-start">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 px-1 pb-1">Folders</h2>
        {folders.length === 0 && <p className="text-xs text-slate-500 px-1">No folders yet. Wrong answers appear here after your next test.</p>}
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveId(f.id)}
            aria-current={f.id === activeId ? 'true' : undefined}
            className={`w-full flex items-center justify-between text-left text-sm px-2.5 py-2 rounded-lg ${f.id === activeId ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
          >
            <span className="truncate">{f.kind === 'wrong' ? '❌ ' : f.kind === 'lucky' ? '🍀 ' : '📁 '}{f.name}</span>
            <span className={`text-[11px] ${f.id === activeId ? 'text-indigo-100' : 'text-slate-400'}`}>{f.item_count ?? 0}</span>
          </button>
        ))}
        <div className="flex gap-1 pt-2 border-t border-slate-100">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
            maxLength={60}
            placeholder="New folder"
            aria-label="New folder name"
            className="flex-1 min-w-0 text-xs border border-slate-300 rounded-lg px-2 py-1.5"
          />
          <button onClick={create} disabled={busy || !newName.trim()} className="btn btn-primary btn-sm">Add</button>
        </div>
      </aside>

      <section className="space-y-3 min-w-0">
        {error && <p className="text-sm text-rose-600 bg-rose-50 p-2.5 rounded-lg">{error}</p>}
        {!active ? (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">Choose or create a folder.</p>
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-indigo-950">{active.name}</h2>
                <p className="text-xs text-slate-500">{KIND_NOTE[active.kind]} {active.item_count ?? 0} question(s).</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={retest} disabled={!active.item_count} className="btn btn-primary btn-sm">
                  Retest this folder
                </button>
                {active.kind === 'custom' && (
                  <button onClick={rename} className="btn btn-secondary btn-sm">Rename</button>
                )}
                <button onClick={remove} className="btn btn-sm bg-white text-rose-700 border-rose-200 hover:bg-rose-50">Delete</button>
              </div>
            </div>

            {items === null && <p className="text-sm text-slate-500">Loading…</p>}
            {items && items.length === 0 && <p className="text-sm text-slate-500">This folder is empty.</p>}
            {items?.map((it) => (
              <article key={it.question_id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-400 mb-1">
                    {normalizeUnit(it.question?.unit)} · {it.question ? getPaperDisplayName(it.question.paper_id) : ''}
                    {it.question?.question_number ? `, Q${it.question.question_number}` : ''}
                  </p>
                  {it.question && <MathText html={cleanNewlines(it.question.question_text)} className="text-sm text-slate-800 line-clamp-3" />}
                </div>
                <button onClick={() => removeItem(it.question_id)} className="text-[11px] font-bold text-slate-400 hover:text-rose-600 self-start" aria-label="Remove from folder">
                  Remove
                </button>
              </article>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
