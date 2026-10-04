"use client";

import React from "react";
import dynamic from "next/dynamic";
import { normalizeBusinessData, BusinessDataContract } from "@/lib/templates/contract";
import { MediaItem, Section } from "@/lib/types";

// Dynamic imports for optimal code splitting across template levels
const ClassicTemplate = dynamic(() => import("./ClassicTemplate"), {
  loading: () => <div className="min-h-screen bg-zinc-900 animate-pulse" />,
});
const MotionTemplate = dynamic(() => import("./MotionTemplate"), {
  loading: () => <div className="min-h-screen bg-[#090d16] animate-pulse" />,
});
const PremiumTemplate = dynamic(() => import("./PremiumTemplate"), {
  loading: () => <div className="min-h-screen bg-[#0a0a0d] animate-pulse" />,
});
const ImmersiveTemplate = dynamic(() => import("./ImmersiveTemplate"), {
  loading: () => <div className="min-h-screen bg-[#05070e] animate-pulse" />,
});
const BentoTemplate = dynamic(() => import("./BentoTemplate"), {
  loading: () => <div className="min-h-screen bg-[#07090e] animate-pulse" />,
});
const AppNativeTemplate = dynamic(() => import("./AppNativeTemplate"), {
  loading: () => <div className="min-h-screen bg-[#07090e] animate-pulse" />,
});
const LookbookTemplate = dynamic(() => import("./LookbookTemplate"), {
  loading: () => <div className="min-h-screen bg-[#06080d] animate-pulse" />,
});

interface TemplateRendererProps {
  negocio: any;
  media?: MediaItem[];
  sections?: Section[];
  businessId?: string;
  bookingElement?: React.ReactNode;
  isPreview?: boolean;
}

/**
 * MINIWEBS UNIVERSAL TEMPLATE RENDERER
 * 
 * Takes raw business data, media, and sections, transforms them into the
 * unified BusinessDataContract, and renders the corresponding template level.
 */
export default function TemplateRenderer({
  negocio,
  media = [],
  sections = [],
  businessId,
  bookingElement,
  isPreview = false,
}: TemplateRendererProps) {
  if (!negocio) return null;

  // Normalize data contract (D09: no fake mock data on public landings)
  const data: BusinessDataContract = normalizeBusinessData(
    { ...negocio, id: businessId || negocio.id },
    media,
    sections,
    { isPublic: !isPreview }
  );

  const level = data.design.templateLevel;

  switch (level) {
    case "classic":
      return <ClassicTemplate data={data} bookingElement={bookingElement} />;
    case "motion":
      return <MotionTemplate data={data} bookingElement={bookingElement} />;
    case "premium":
      return <PremiumTemplate data={data} bookingElement={bookingElement} />;
    case "immersive":
      return <ImmersiveTemplate data={data} bookingElement={bookingElement} />;
    case "bento":
      return <BentoTemplate data={data} bookingElement={bookingElement} />;
    case "app_native":
      return <AppNativeTemplate data={data} bookingElement={bookingElement} />;
    case "lookbook":
      return <LookbookTemplate data={data} bookingElement={bookingElement} />;
    default:
      return <ClassicTemplate data={data} bookingElement={bookingElement} />;
  }
}
