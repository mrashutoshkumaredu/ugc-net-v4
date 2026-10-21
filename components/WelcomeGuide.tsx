'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  OPEN_GUIDE_EVENT, WELCOME_AUTO_PATHS, getGuideLang, hasSeenWelcome, markWelcomeSeen, setGuideLang, type GuideLang,
} from '@/lib/welcome';

type Section = { icon: string; name: string; text: string };
type Copy = { title: string; subtitle: string; sections: Section[]; tipsTitle: string; tips: string[]; findAgain: string; gotIt: string };

// Tab names are kept in English beside the Hindi word, because the tabs on the site are in English.
const COPY: Record<GuideLang, Copy> = {
  en: {
    title: 'Welcome to UGC NET Paper 1 Portal',
    subtitle: 'A 30-second guide to finding your way around.',
    sections: [
      { icon: '🏠', name: 'Today', text: 'Your starting point: resume a test, see what to revise and count down to your exam.' },
      { icon: '📝', name: 'Practice', text: 'Full previous year papers with a real 60-minute timer, unit-wise sets, daily practice and Speed Math.' },
      { icon: '📘', name: 'Learn', text: 'Maths course, revision notes and previous year question trends by unit.' },
      { icon: '📊', name: 'Progress', text: 'Your scores, weak areas, saved questions (Revision Vault) and the leaderboard.' },
      { icon: '👥', name: 'Class', text: 'Appears when a teacher adds you to a class, with tasks to attempt.' },
    ],
    tipsTitle: 'Good to know',
    tips: [
      'Log in or register to start a test and keep your scores.',
      'On a phone, use the tabs at the bottom. On a computer, use the bar at the top.',
      'Closed the page during a test? Open Today to resume. The timer keeps running, as in the real exam.',
      'Papers marked "English + हिंदी" can be switched to Hindi during the test.',
      'Spotted a wrong answer or a typo? Use the Report flag on that question.',
    ],
    findAgain: 'Find this again under “How to use this site” at the bottom of any page.',
    gotIt: 'Got it',
  },
  hi: {
    title: 'UGC NET पेपर 1 पोर्टल में आपका स्वागत है',
    subtitle: '30 सेकंड में जानें कि साइट पर कैसे आगे बढ़ें।',
    sections: [
      { icon: '🏠', name: 'आज (Today)', text: 'यहीं से शुरुआत करें: अधूरा टेस्ट दोबारा शुरू करें, आज क्या दोहराना है देखें और परीक्षा तक के दिन गिनें।' },
      { icon: '📝', name: 'प्रैक्टिस (Practice)', text: 'असली 60 मिनट के टाइमर के साथ पिछले वर्षों के पूरे पेपर, यूनिट-वार सेट, रोज़ का अभ्यास और स्पीड मैथ्स।' },
      { icon: '📘', name: 'सीखें (Learn)', text: 'गणित कोर्स, रिवीज़न नोट्स और यूनिट के अनुसार पिछले वर्षों के प्रश्नों के ट्रेंड।' },
      { icon: '📊', name: 'प्रगति (Progress)', text: 'आपके अंक, कमज़ोर विषय, सहेजे गए प्रश्न (रिवीज़न वॉल्ट) और लीडरबोर्ड।' },
      { icon: '👥', name: 'क्लास (Class)', text: 'यह तब दिखता है जब कोई शिक्षक आपको क्लास में जोड़ते हैं। इसमें हल करने के लिए टास्क होते हैं।' },
    ],
    tipsTitle: 'ध्यान रखें',
    tips: [
      'टेस्ट शुरू करने और अपने अंक सुरक्षित रखने के लिए लॉग इन या रजिस्टर करें।',
      'फ़ोन पर नीचे के टैब का उपयोग करें। कंप्यूटर पर ऊपर की पट्टी का उपयोग करें।',
      'टेस्ट के बीच में पेज बंद हो गया? "Today" खोलकर टेस्ट दोबारा शुरू करें। असली परीक्षा की तरह टाइमर चलता रहता है।',
      'जिन पेपरों पर "English + हिंदी" लिखा है, उन्हें टेस्ट के दौरान हिंदी में बदला जा सकता है।',
      'कोई गलत उत्तर या टाइपो दिखे? उस प्रश्न पर Report फ़्लैग का उपयोग करें।',
    ],
    findAgain: 'इसे दोबारा देखने के लिए किसी भी पेज के नीचे “How to use this site” पर क्लिक करें।',
    gotIt: 'ठीक है',
  },
};

// Shown once to first-time visitors, and again whenever "How to use this site" is clicked.
export default function WelcomeGuide() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<GuideLang>('en');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setLang(getGuideLang()); }, []);

  useEffect(() => {
    if (pathname && WELCOME_AUTO_PATHS.includes(pathname) && !hasSeenWelcome()) setOpen(true);
  }, [pathname]);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_GUIDE_EVENT, show);
    return () => window.removeEventListener(OPEN_GUIDE_EVENT, show);
  }, []);

  const close = useCallback(() => { markWelcomeSeen(); setOpen(false); }, []);
  const choose = (l: GuideLang) => { setLang(l); setGuideLang(l); };

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;
  const c = COPY[lang];
  const seg = (active: boolean) => `px-3 py-1 text-xs font-bold ${active ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-3 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div lang={lang} className="min-w-0">
            <h2 id="welcome-title" className="text-lg font-extrabold text-indigo-950">{c.title}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{c.subtitle}</p>
          </div>
          <div role="group" aria-label="Language / भाषा" className="flex shrink-0 overflow-hidden rounded-lg border border-slate-300">
            <button type="button" aria-pressed={lang === 'en'} onClick={() => choose('en')} className={seg(lang === 'en')}>English</button>
            <button type="button" aria-pressed={lang === 'hi'} onClick={() => choose('hi')} className={seg(lang === 'hi')}>हिन्दी</button>
          </div>
        </div>

        <div lang={lang}>
          <ul className="mt-4 space-y-2.5">
            {c.sections.map((s) => (
              <li key={s.icon} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                <span className="text-xl leading-none" aria-hidden>{s.icon}</span>
                <p className="text-xs leading-relaxed text-slate-600"><span className="font-bold text-slate-800">{s.name}.</span> {s.text}</p>
              </li>
            ))}
          </ul>

          <h3 className="mt-5 text-xs font-extrabold uppercase tracking-wide text-slate-500">{c.tipsTitle}</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-600">
            {c.tips.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p lang={lang} className="text-[11px] text-slate-400">{c.findAgain}</p>
          <button ref={closeRef} onClick={close} className="shrink-0 rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-800">{c.gotIt}</button>
        </div>
      </div>
    </div>
  );
}
