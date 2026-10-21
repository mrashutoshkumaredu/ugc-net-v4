import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { MAINTAINER, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `About | ${SITE_NAME}`,
  description: `Who maintains ${SITE_NAME} and what it offers.`,
};

export default function AboutPage() {
  return (
    <PageShell title="About" subtitle={`What ${SITE_NAME} is, and who looks after it.`}>
      <div className="max-w-3xl space-y-4">
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-extrabold text-indigo-950">The site</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{SITE_DESCRIPTION}</p>
        </section>
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-extrabold text-indigo-950">Maintained by</h2>
          <p className="mt-2 text-sm font-semibold text-slate-800">{MAINTAINER.name}</p>
          <p className="text-xs text-slate-600">{MAINTAINER.department}</p>
          <p className="text-xs text-slate-600">{MAINTAINER.institution}</p>
        </section>
        <p className="text-xs text-slate-500">
          Found a problem or have a suggestion? <Link href="/contact" className="font-bold text-indigo-700 hover:underline">Contact us</Link>.
          Read the <Link href="/disclaimer" className="font-bold text-indigo-700 hover:underline">disclaimer</Link>.
        </p>
      </div>
    </PageShell>
  );
}
