"use client";

import React from "react";
import { Biz, Section, MediaItem, Ico } from "@/lib/constants";
import TemplateRenderer from "@/components/landings/templates/TemplateRenderer";
import EditModeWrapper from "@/components/landings/EditModeWrapper";
import { IframePreview } from "./IframePreview";

import BarberiaTemplate from "@/components/landings/BarberiaTemplate";
import CanchaTemplate from "@/components/landings/CanchaTemplate";
import MenuTemplate from "@/components/landings/MenuTemplate";
import ClinicaTemplate from "@/components/landings/ClinicaTemplate";
import EsteticaTemplate from "@/components/landings/EsteticaTemplate";
import GimnasioTemplate from "@/components/landings/GimnasioTemplate";
import TallerTemplate from "@/components/landings/TallerTemplate";
import LavaderoTemplate from "@/components/landings/LavaderoTemplate";
import GeneralTemplate from "@/components/landings/GeneralTemplate";

interface LandingPreviewProps {
  biz: Biz;
  sections: Section[];
  media: MediaItem[];
  previewDevice?: "desktop" | "mobile";
}

export const LandingPreview = ({
  biz,
  sections,
  media,
  previewDevice = "desktop",
}: LandingPreviewProps) => {
  const templateLevel = biz.layoutConfig?.templateLevel;
  const themeVariant = biz.layoutConfig?.themeVariant || "classic";

  const renderContent = () => {
    // Multi-level template or modern universal theme
    const isMultiLevel =
      !!templateLevel ||
      [
        "classic",
        "clean",
        "essential",
        "motion",
        "modern",
        "dynamic",
        "premium",
        "luxury",
        "editorial",
        "minimal_luxury",
        "dark",
        "list",
        "immersive",
        "flow",
        "particles",
        "organic",
        "immersive_dark",
      ].includes(themeVariant);

    if (isMultiLevel) {
      return (
        <TemplateRenderer
          negocio={biz}
          media={media}
          sections={sections}
          businessId={biz.id}
        />
      );
    }

    // Legacy niche specific fallbacks
    if (biz.type === "barberia") return <BarberiaTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />;
    if (biz.type === "taller") return <TallerTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />;
    if (biz.type === "lavadero") return <LavaderoTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />;
    if (biz.type === "cancha") return <CanchaTemplate negocio={biz as any} />;
    if (biz.type === "menu" || biz.type === "restaurante") return <MenuTemplate negocio={biz as any} />;
    if (biz.type === "estetica") return <EsteticaTemplate negocio={biz as any} />;
    if (biz.type === "clinica") return <ClinicaTemplate negocio={biz as any} />;
    if (biz.type === "gimnasio") return <GimnasioTemplate negocio={biz as any} />;

    return <GeneralTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />;
  };

  const currentUrl = biz.customDomain 
    ? `https://${biz.customDomain}` 
    : `https://${biz.subdomain || "demo"}.miniwebs.lat`;

  // ── MODO MÓVIL (Smartphone Mockup de Alta Precisión) ──
  if (previewDevice === "mobile") {
    return (
      <div className="w-full max-w-[390px] mx-auto flex flex-col items-center justify-center py-2 animate-fadeIn">
        <div className="relative w-[390px] h-[810px] max-h-[calc(100vh-140px)] bg-[#0a0f1c] rounded-[52px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.12)] border-[8px] border-[#1c2333] flex flex-col select-none">
          {/* Botones laterales físicos */}
          <div className="absolute -left-3 top-24 w-1.5 h-10 bg-[#283248] rounded-l-md pointer-events-none" />
          <div className="absolute -left-3 top-38 w-1.5 h-10 bg-[#283248] rounded-l-md pointer-events-none" />
          <div className="absolute -right-3 top-28 w-1.5 h-14 bg-[#283248] rounded-r-md pointer-events-none" />

          {/* Dynamic Island */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-3 pointer-events-none shadow-md">
            <div className="w-2 h-2 rounded-full bg-slate-900 border border-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#0d1424] border border-white/5" />
          </div>

          {/* Pantalla del teléfono con IframePreview */}
          <div className="relative w-full h-full rounded-[42px] overflow-hidden bg-black flex-1 shadow-inner">
            <IframePreview title="Vista Previa Móvil" className="w-full h-full">
              <div className="w-full min-h-screen bg-transparent select-text">
                {renderContent()}
                <EditModeWrapper />
              </div>
            </IframePreview>
          </div>

          {/* Home Indicator Bar */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full z-40 pointer-events-none" />
        </div>
      </div>
    );
  }

  // ── MODO ESCRITORIO (Browser Window Mockup) ──
  return (
    <div className="w-full max-w-[1240px] mx-auto flex flex-col h-[740px] max-h-[calc(100vh-140px)] bg-[#0e1422] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fadeIn">
      {/* Cabecera de navegador */}
      <div className="h-10 bg-[#0a0f1c] border-b border-white/5 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]/80" />
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]/80" />
          <div className="w-3 h-3 rounded-full bg-[#10b981]/80" />
        </div>

        {/* Falsa barra de URL segura */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-xs text-slate-400 font-mono max-w-sm w-full mx-4 justify-center">
          <Ico n="lock" s={11} c="text-emerald-400" />
          <span className="truncate">{currentUrl}</span>
        </div>

        <div className="w-12 text-right">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Escritorio</span>
        </div>
      </div>

      {/* Pantalla de escritorio con IframePreview */}
      <div className="relative w-full flex-1 overflow-hidden bg-black">
        <IframePreview title="Vista Previa Escritorio" className="w-full h-full">
          <div className="w-full min-h-screen bg-transparent select-text">
            {renderContent()}
            <EditModeWrapper />
          </div>
        </IframePreview>
      </div>
    </div>
  );
};
