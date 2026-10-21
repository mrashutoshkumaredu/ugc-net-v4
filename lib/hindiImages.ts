"use client";

import { useEffect, useState } from 'react';

// Hindi versions stored as the original NTA picture of the question (for papers
// whose Hindi text has not been typed in). public/hindi/manifest.json maps a
// question id to its picture, plus the shared DI table / passage picture.
export type HindiImage = { q: string; ref?: string };
export type HindiImageMap = Record<string, HindiImage>;

let cache: Promise<HindiImageMap> | null = null;

export function loadHindiImages(): Promise<HindiImageMap> {
  if (!cache) {
    cache = fetch('/hindi/manifest.json')
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return cache;
}

export function useHindiImages(): HindiImageMap {
  const [map, setMap] = useState<HindiImageMap>({});
  useEffect(() => {
    let alive = true;
    loadHindiImages().then((m) => { if (alive) setMap(m); });
    return () => { alive = false; };
  }, []);
  return map;
}

// Papers whose Hindi exists only as the original NTA pictures (public/hindi/picture-papers.json).
// Add a paper id there when its Hindi pictures are added to manifest.json.
let picturePapers: Promise<string[]> | null = null;

export function usePicturePapers(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    if (!picturePapers) {
      picturePapers = fetch('/hindi/picture-papers.json')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);
    }
    picturePapers.then((list) => { if (alive) setIds(new Set(list)); });
    return () => { alive = false; };
  }, []);
  return ids;
}

export type HindiCoverage = 'FULL' | 'PARTIAL' | 'NONE';

// FULL: every question has Hindi (typed text or the NTA picture). PARTIAL: some do.
export function hindiCoverage(
  paper: { paper_id: string; question_count: number; hindi_text_count?: number },
  picturePaperIds: Set<string>,
): HindiCoverage {
  if (picturePaperIds.has(paper.paper_id)) return 'FULL';
  const n = paper.hindi_text_count ?? 0;
  if (n <= 0) return 'NONE';
  return n >= paper.question_count ? 'FULL' : 'PARTIAL';
}
