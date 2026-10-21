import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { DISCLAIMER, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Disclaimer | ${SITE_NAME}`,
  description: `Independence notice for ${SITE_NAME}.`,
};

export default function DisclaimerPage() {
  return (
    <PageShell title="Disclaimer" subtitle="Please read this once. It applies to every page of the site.">
      <section className="max-w-3xl space-y-4 bg-white border border-slate-200 rounded-2xl p-5 text-sm leading-relaxed text-slate-700">
        <p role="note" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-900">{DISCLAIMER}</p>
        <p>
          The questions on this site are taken from previous year UGC NET Paper 1 question papers and their answer keys,
          for practice. Where NTA dropped a question from its answer key, we have added the correct answer and the question is
          marked like any other.
        </p>
        <p>
          Practice here does not replace the official publications. For the syllabus, notifications, exam dates and
          official answer keys, please use the official NTA and UGC websites.
        </p>
        <p>
          Found a wrong answer key or a typo? Use the Report flag on the question, or <Link href="/contact" className="font-bold text-indigo-700 hover:underline">contact us</Link>.
        </p>
      </section>
    </PageShell>
  );
}
