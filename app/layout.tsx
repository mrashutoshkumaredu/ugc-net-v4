import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavProgress from "@/components/NavProgress";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "UGC NET Paper 1 Portal",
  description:
    "National Eligibility Test practice platform — full-length previous year question papers and unit-wise practice for UGC NET Paper 1.",
  applicationName: "UGC NET Paper 1 Portal",
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
