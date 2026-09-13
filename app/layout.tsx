import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UGC NET Paper 1 Portal",
  description:
    "National Eligibility Test practice platform — full-length previous year question papers and unit-wise practice for UGC NET Paper 1.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-100 font-sans text-slate-800">
        {children}
      </body>
    </html>
  );
}
