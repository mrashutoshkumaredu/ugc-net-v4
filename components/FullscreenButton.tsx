"use client";

import { useEffect, useState } from 'react';

// Full-screen on/off for the whole site. Hidden where the browser has no
// full-screen support (for example iPhone Safari).
export default function FullscreenButton() {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    setSupported(Boolean(document.fullscreenEnabled));
    const sync = () => setOn(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  if (!supported) return null;
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };
  return (
    <button
      onClick={toggle}
      title={on ? 'Exit full screen' : 'Full screen'}
      aria-label={on ? 'Exit full screen' : 'Full screen'}
      className="btn btn-light btn-sm shrink-0"
    >
      {on ? '⤓ Exit full screen' : '⤢ Full screen'}
    </button>
  );
}
