import type { MetadataRoute } from "next";

const BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private / non-indexable surfaces.
      disallow: ["/admin", "/api", "/dashboard", "/checkout", "/login", "/verification", "/saved-searches"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
