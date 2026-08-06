import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const businesses = await prisma.business.findMany({
    select: {
      subdomain: true,
      updatedAt: true,
    },
  });

  return businesses.map((b: any) => ({
    url: `https://${b.subdomain}.saas-miniwebs.com`,
    lastModified: b.updatedAt,
  }));
}
