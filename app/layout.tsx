import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavProgress from "@/components/NavProgress";
import BottomNav from "@/components/BottomNav";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Link previews on WhatsApp, Telegram, Facebook and X. The picture comes from app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
  // Proves to Google Search Console that this site is ours. Public by design.
  verification: { google: "gJyLNfy3JhNd0G3fQf3D3IzaoXEKcfc3NATIpqwlAts" },
  appleWebApp: { capable: true, title: "NET Paper 1", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#312e81",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-100 font-sans text-slate-800">
        <NavProgress />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
