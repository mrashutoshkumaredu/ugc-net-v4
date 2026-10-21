import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import ContactForm from "@/components/contact/ContactForm";
import { CONTACT_EMAIL, MAINTAINER, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact | ${SITE_NAME}`,
  description: `Report a problem, ask a question or send feedback about ${SITE_NAME}.`,
};

export default function ContactPage() {
  return (
    <PageShell title="Contact" subtitle="Having trouble with the site, or want to suggest something? Write to us and we will reply by email.">
      <div className="grid gap-5 md:grid-cols-5">
        <aside className="md:col-span-2 space-y-4">
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-extrabold text-indigo-950">Maintained by</h2>
            <p className="mt-2 text-sm font-semibold text-slate-800">{MAINTAINER.name}</p>
            <p className="text-xs text-slate-600">{MAINTAINER.department}</p>
            <p className="text-xs text-slate-600">{MAINTAINER.institution}</p>
          </section>
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-extrabold text-indigo-950">Email</h2>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-2 block break-all text-sm font-bold text-indigo-700 hover:underline">{CONTACT_EMAIL}</a>
            <p className="mt-1 text-xs text-slate-500">Prefer email? Write directly, or use the form.</p>
          </section>
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-extrabold text-indigo-950">Before you write</h2>
            <ul className="mt-2 list-disc pl-4 space-y-1 text-xs text-slate-600">
              <li>For a wrong answer key or a typo in one question, use the <span className="font-semibold">Report</span> flag shown on that question. It sends the exact question to us.</li>
              <li>For login or test problems, mention your device, browser and the page you were on.</li>
            </ul>
          </section>
        </aside>
        <div className="md:col-span-3">
          <ContactForm />
        </div>
      </div>
    </PageShell>
  );
}
