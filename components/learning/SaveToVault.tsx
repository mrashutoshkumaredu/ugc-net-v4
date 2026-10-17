"use client";

import { useState } from 'react';
import { addToVault, createVaultFolder } from '@/lib/testApi';
import type { VaultFolder } from '@/lib/types';

// "Save to Vault" button with a small folder picker. The parent loads the
// folder list once and passes it in, so a long review page doesn't refetch.
export default function SaveToVault({
  questionId,
  folders,
  onFoldersChange,
  initiallySaved = false,
}: {
  questionId: number;
  folders: VaultFolder[];
  onFoldersChange: (folders: VaultFolder[]) => void;
  initiallySaved?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(initiallySaved);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (folderId: string) => {
    setBusy(true);
    setError('');
    try {
      await addToVault(folderId, questionId);
      setSaved(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const createAndSave = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    setError('');
    try {
      const folder = await createVaultFolder(newName);
      onFoldersChange([...folders, folder]);
      setNewName('');
      await save(folder.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the folder.');
      setBusy(false);
    }
  };

  const ownFolders = folders.filter((f) => f.kind === 'custom');

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${saved ? 'bg-indigo-50 text-indigo-800 border-indigo-300' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
      >
        {saved ? '📌 In your Vault' : '📌 Save to Vault'}
      </button>
      {open && (
        <div className="absolute z-30 mt-1 right-0 w-60 bg-white border border-slate-200 rounded-xl shadow-xl p-2 space-y-1">
          {ownFolders.length === 0 && <p className="text-[11px] text-slate-500 px-1 py-1">No folders yet. Create one below.</p>}
          {ownFolders.map((f) => (
            <button
              key={f.id}
              disabled={busy}
              onClick={() => save(f.id)}
              className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
            >
              {f.name}
            </button>
          ))}
          <div className="flex gap-1 pt-1 border-t border-slate-100">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createAndSave(); }}
              maxLength={60}
              placeholder="New folder name"
              aria-label="New folder name"
              className="flex-1 min-w-0 text-xs border border-slate-300 rounded-lg px-2 py-1"
            />
            <button disabled={busy || !newName.trim()} onClick={createAndSave} className="text-xs font-bold px-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">
              Add
            </button>
          </div>
          {error && <p className="text-[11px] text-rose-600 px-1">{error}</p>}
        </div>
      )}
    </div>
  );
}
