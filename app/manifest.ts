import type { MetadataRoute } from 'next';

// Lets students add the site to their phone's home screen, where it opens
// like an app (its own icon, no browser bar). Tests still need internet.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UGC NET Paper 1 Portal',
    short_name: 'NET Paper 1',
    description: 'Previous year papers, unit-wise practice, daily revision and progress tracking for UGC NET Paper 1.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f1f5f9',
    theme_color: '#084a5a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
