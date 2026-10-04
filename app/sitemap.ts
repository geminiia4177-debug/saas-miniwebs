import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getPublicUrl } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const businesses = await prisma.business.findMany({
    select: {
      subdomain: true,
      customDomain: true,
      updatedAt: true,
    },
  });

  return businesses.map((b: any) => ({
    url: getPublicUrl(b),
    lastModified: b.updatedAt,
  }));
}
