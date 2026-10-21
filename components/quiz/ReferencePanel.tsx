"use client";

import dynamic from 'next/dynamic';
import HindiImage from './HindiImage';
import Icon from '@/components/Icon';

// dompurify (used inside MathText) needs a real browser window, so this is
// loaded client-only — see the comment in MathText.tsx for why.
const MathText = dynamic(() => import('./MathText'), { ssr: false });

type Props = {
  layoutText: string;
  imageSrc?: string;
  textSize?: 'sm' | 'md' | 'lg';
  expanded?: boolean;
  onToggleExpand?: () => void;
  questionLabel?: string;
};

export default function ReferencePanel({ layoutText, imageSrc, textSize = 'md', expanded = false, onToggleExpand, questionLabel }: Props) {
  // Split view: a third-plus of the screen on phones, 45% on larger screens.
  // Expanded: fills the whole test area while the question is hidden.
  const size = expanded ? 'flex-1 h-full w-full' : 'h-2/5 md:h-full md:w-[45%] shrink-0';
  return (
    <div className={`flex flex-col ${size} bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden`}>
      <div className="bg-slate-50 p-2 sm:p-3 border-b border-slate-200 flex items-center justify-between gap-2">
        <span className="font-bold text-xs text-slate-600 uppercase tracking-wider">
          Reference Material{expanded && questionLabel ? <span className="ml-2 normal-case tracking-normal text-slate-500 font-semibold">{questionLabel}</span> : null}
        </span>
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-pressed={expanded}
            aria-label={expanded ? 'Back to the question' : 'Expand the reference material to full screen'}
            title={expanded ? 'Back to the question' : 'Expand the reference material'}
            className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-2 py-1 text-[11px] font-bold text-indigo-800 hover:bg-indigo-50"
          >
            <Icon name={expanded ? 'shrink' : 'expand'} className="w-3.5 h-3.5" />
            {expanded ? 'Back to question' : 'Expand'}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4 bg-white" data-text-size={textSize}>
        {imageSrc ? (
          // Original NTA picture of the Hindi table / passage.
          <HindiImage key={imageSrc} src={imageSrc} alt="संदर्भ सामग्री (हिंदी)" textSize={textSize} />
        ) : (
          <MathText html={layoutText} className="layout-text q-ref text-slate-800 leading-relaxed" />
        )}
      </div>
    </div>
  );
}
