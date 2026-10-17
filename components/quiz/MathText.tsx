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
      ignoredClasses: ['literal-dollar'],
      throwOnError: false,
    });
    // A literal dollar amount is stored as \$ so KaTeX won't pair two of them
    // into a formula ("$75 million … $200 million"). KaTeX skips them correctly
    // but leaves the backslash on screen. Show each one as a plain $ inside its
    // own <span class="literal-dollar">, which KaTeX ignores, so a second run of
    // this effect can never pair them up either.
    const root = ref.current;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const targets: Text[] = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeValue?.includes('\\$') && !node.parentElement?.closest('.katex')) targets.push(node as Text);
    }
    for (const node of targets) {
      const frag = document.createDocumentFragment();
      node.nodeValue!.split('\\$').forEach((piece, i) => {
        if (i > 0) {
          const span = document.createElement('span');
          span.className = 'literal-dollar';
          span.textContent = '$';
          frag.appendChild(span);
        }
        if (piece) frag.appendChild(document.createTextNode(piece));
      });
      node.replaceWith(frag);
    }
    // Re-run only when the underlying HTML actually changes. Without this
    // dependency array, React reruns this effect after every re-render of
    // the parent (e.g. the quiz page's per-second countdown timer), which
    // repeatedly tears down and reprocesses the DOM KaTeX just rendered —
    // visible as a flicker on any text that gets auto-render-matched.
  }, [html]);

  const clean = DOMPurify.sanitize(html);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
