"use client";

import { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import renderMathInElement from 'katex/contrib/auto-render';

// Question/option/layout text can contain raw HTML (tables, formatting) and
// LaTeX delimiters. Sanitize before injecting, then run KaTeX's auto-render
// over the rendered node. Content comes from the questions table (admin
// authored) but we sanitize anyway rather than trusting it blindly.
//
// This component is loaded client-only (see its `next/dynamic(..., { ssr:
// false })` wrapper in QuestionPanel/ReferencePanel): the plain `dompurify`
// package needs a real `window`, and the jsdom-backed `isomorphic-dompurify`
// alternative breaks Next's server bundler (jsdom tries to read a stylesheet
// asset from a path webpack doesn't preserve). Skipping SSR for this piece
// means the sanitized HTML only ever gets injected client-side, never
// server-rendered unsanitized.
export default function MathText({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    renderMathInElement(ref.current, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
  });

  const clean = DOMPurify.sanitize(html);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
