"use client";

import dynamic from 'next/dynamic';
import HindiImage from './HindiImage';

// dompurify (used inside MathText) needs a real browser window, so this is
// loaded client-only — see the comment in MathText.tsx for why.
const MathText = dynamic(() => import('./MathText'), { ssr: false });

export default function ReferencePanel({ layoutText, imageSrc, textSize = 'md' }: { layoutText: string; imageSrc?: string; textSize?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex flex-col h-1/3 md:h-full md:w-[45%] bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden shrink-0">
      <div className="bg-slate-50 p-2 sm:p-3 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider">
        Reference Material
      </div>
      <div className="flex-1 overflow-auto p-4 bg-white" data-text-size={textSize}>
        {imageSrc ? (
          // Original NTA picture of the Hindi table / passage.
          <HindiImage key={imageSrc} src={imageSrc} alt="संदर्भ सामग्री (हिंदी)" textSize={textSize} />
        ) : (
          <MathText html={layoutText} className="layout-text q-ref text-slate-800 leading-relaxed overflow-x-auto" />
        )}
      </div>
    </div>
  );
}
