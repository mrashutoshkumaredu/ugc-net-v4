import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public pages only. Personal pages (progress, vault, review and so on) are left out.
const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/practice", priority: 0.9 },
  { path: "/learn", priority: 0.8 },
  { path: "/course", priority: 0.8 },
  { path: "/notes", priority: 0.7 },
  { path: "/speed-math", priority: 0.6 },
  { path: "/trends", priority: 0.5 },
  { path: "/leaderboard", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: "weekly",
    priority,
  }));
}
