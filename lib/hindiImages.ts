"use client";

import { useEffect, useState } from 'react';

// Hindi versions stored as the original NTA picture of the question (for papers
// whose Hindi text has not been typed in). public/hindi/manifest.json maps a
// question id to its picture, plus the shared DI table / passage picture.
export type HindiImage = { q: string; ref?: string; note?: string };
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
