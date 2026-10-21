// The live address of the site, used for the sitemap, robots.txt and link previews.
export const SITE_URL = "https://ugcnetpaper1.vercel.app";

export const SITE_NAME = "UGC NET Paper 1 Portal";

export const SITE_DESCRIPTION =
  "National Eligibility Test practice platform — full-length previous year question papers and unit-wise practice for UGC NET Paper 1.";

// Who maintains the site. Shown on the About and Contact pages.
export const MAINTAINER = {
  name: "Ashutosh Kumar",
  department: "Department of Society-Technology Interface",
  institution: "Central University of Rajasthan",
};

// Public contact address. Change it here and the footer and Contact page both update.
// Set NEXT_PUBLIC_CONTACT_EMAIL in Vercel to override without editing code.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "lousingdost@gmail.com";

// Independence notice, shown on the Disclaimer page, which the footer links to on every page except the test screen (/quiz).
export const DISCLAIMER =
  "Independent site. Not affiliated with UGC, NTA or the Government of India. No official logos or emblems used.";
