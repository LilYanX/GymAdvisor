import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/cgu", "/rgpd"],
        disallow: ["/app/", "/sportifs/", "/editeur/", "/bibliotheque/", "/paiements/", "/profil/", "/auth/"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
