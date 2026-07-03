import type { MetadataRoute } from "next";

function getSiteUrl() {
    const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    if (!raw) return "http://localhost:3000";
    if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");
    return `https://${raw.replace(/\/$/, "")}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = getSiteUrl();

    return [
        {
            url: `${baseUrl}/`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${baseUrl}/privacy-policy`,
            lastModified: new Date("2026-07-03"),
            changeFrequency: "yearly",
            priority: 0.5,
        },
    ];
}
