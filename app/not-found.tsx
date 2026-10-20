import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata = { title: "Page not found · UGC NET Paper 1 Portal" };

// Shown for any address that does not exist, with the normal header and a way back.
export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader />
      <main className="w-full max-w-xl mx-auto p-6 sm:p-10 flex-1 flex flex-col items-center justify-center text-center gap-4">
        <p className="text-6xl font-black text-indigo-900">404</p>
        <h1 className="text-xl font-bold text-slate-800">This page could not be found</h1>
        <p className="text-sm text-slate-600">
          The link may be old or mistyped. You can go back to today&apos;s plan or start practising.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <Link href="/" className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
            Go to Today
          </Link>
          <Link href="/practice" className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-slate-900">
            Practice
          </Link>
        </div>
      </main>
    </div>
  );
}
