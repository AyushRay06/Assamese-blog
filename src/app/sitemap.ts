import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { PostStatus } from "@prisma/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let postEntries: MetadataRoute.Sitemap = [];
  if (process.env.DATABASE_URL) {
    try {
      const posts = await prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
        },
        orderBy: {
          publishedAt: "desc",
        },
      });

      postEntries = posts.map((post) => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    } catch (err) {
      console.warn("sitemap: unable to query posts database:", err);
    }
  }

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...postEntries,
  ];
}
