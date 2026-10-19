"use client";

import { useState } from 'react';

type TextSize = 'sm' | 'md' | 'lg';

// Scale for the A- / A / A+ buttons, and how wide the picture may get inside its panel.
const SCALE: Record<TextSize, number> = { sm: 0.8, md: 1, lg: 1.3 };
const MAX_WIDTH: Record<TextSize, string> = { sm: '80%', md: '100%', lg: 'none' };

// Original NTA picture of a Hindi question, table or passage.
// - Keyed by src by the caller, so moving to the next question never keeps showing the old picture.
// - Shows "Loading…" until the picture has arrived.
// - Size follows the text-size buttons, including wide pictures (passages) that fill the panel.
export default function HindiImage({ src, alt, textSize }: { src: string; alt: string; textSize: TextSize }) {
  const [natural, setNatural] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <p className="text-sm text-rose-600">हिंदी चित्र लोड नहीं हो सका। कृपया English में देखें। (Could not load the Hindi picture.)</p>;
  }

  return (
    <div className="overflow-x-auto">
      {natural === null && <p className="text-xs text-slate-400 py-6">लोड हो रहा है… (Loading…)</p>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={(e) => setNatural(e.currentTarget.naturalWidth)}
        onError={() => setFailed(true)}
        className={`bg-white rounded h-auto ${natural === null ? 'invisible absolute' : 'block'}`}
        style={natural ? { width: Math.round(natural * SCALE[textSize]), maxWidth: MAX_WIDTH[textSize] } : undefined}
      />
    </div>
  );
}

// Fetch the given pictures in the background so the next questions appear at once.
export function preloadImages(srcs: string[]) {
  for (const src of srcs) {
    const img = new Image();
    img.src = src;
  }
}
