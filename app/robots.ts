import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search engines may read the public pages. Personal and admin pages stay out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/classes",
        "/performance",
        "/progress",
        "/quiz",
        "/reset-password",
        "/review/",
        "/vault",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
