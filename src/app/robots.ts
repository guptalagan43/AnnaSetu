import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/public-impact"],
      disallow: [
        "/donor/",
        "/shelter/",
        "/driver/",
        "/admin/",
        "/api/",
        "/dev/",
      ],
    },
    sitemap: "https://annasetu.in/sitemap.xml",
  };
}
