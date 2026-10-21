import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/urls";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const businesses = await prisma.business.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIAL", "DEMO"] },
      publishedConfig: { not: Prisma.AnyNull },
    },
    select: {
      subdomain: true,
      customDomain: true,
      updatedAt: true,
    },
  });

  const entries: MetadataRoute.Sitemap = [];

  businesses.forEach((b: any) => {
    const baseUrl = getPublicUrl(b);
    entries.push({
      url: baseUrl,
      lastModified: b.updatedAt,
    });
    entries.push({
      url: `${baseUrl}/links`,
      lastModified: b.updatedAt,
    });
  });

  return entries;
}
