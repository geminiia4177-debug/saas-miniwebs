import React from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import PremiumLinks from "@/components/landings/PremiumLinks";

import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const biz = await prisma.business.findFirst({
    where: {
      OR: [
        { subdomain: resolvedParams.subdomain },
        { customDomain: resolvedParams.subdomain }
      ]
    },
  });

  if (!biz) return {};

  const config = biz.layoutConfig as any;
  const linksConfig = config?.biolinks;

  if (!linksConfig || !linksConfig.active) return {};

  const title = linksConfig.title || `${biz.name} | Enlaces`;
  const description = linksConfig.subtitle || `Enlaces oficiales de ${biz.name}`;
  const image = linksConfig.coverUrl || linksConfig.profileUrl || biz.logoUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: biz.customDomain ? `https://${biz.customDomain}/links` : `https://${resolvedParams.subdomain}.saas-miniwebs.vercel.app/links`,
      siteName: biz.name,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function BiolinksPage({ params }: { params: Promise<{ subdomain: string }> }) {
  const resolvedParams = await params;
  const headersList = await headers();
  const host = headersList.get("host") || "";
  let targetSubdomain = resolvedParams.subdomain;
  
  if (!host.includes("localhost") && !host.includes("saas-miniwebs.vercel.app")) {
    targetSubdomain = host; 
  }

  const bizData = await prisma.business.findFirst({
    where: {
      OR: [
        { subdomain: targetSubdomain },
        { customDomain: targetSubdomain }
      ]
    },
  });
  
  if (!bizData) return notFound();
  
  // Parse layoutConfig from JSON if needed (prisma returns it as JSON object or null)
  const biz: any = { ...bizData, layoutConfig: typeof bizData.layoutConfig === "string" ? (JSON as any).parse(bizData.layoutConfig) : bizData.layoutConfig };

  // If biolinks is not active, return 404 or redirect to main
  const config = biz.layoutConfig?.biolinks;
  if (!config || !config.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Página no disponible</h1>
          <p className="text-slate-400 mb-6">El enlace no existe o fue desactivado.</p>
          <Link href="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-colors">
            Ir a la página principal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-black">
      <PremiumLinks negocio={biz} />
    </div>
  );
}
