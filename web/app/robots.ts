import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /plan renders from query strings; every combination is the same page
        // with different numbers, so let crawlers have the page and not the
        // permutations.
        disallow: ["/api/", "/plan?"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
