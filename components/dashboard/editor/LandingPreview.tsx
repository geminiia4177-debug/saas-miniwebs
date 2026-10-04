"use client";

import React, { useState, useRef, useEffect } from "react";
import { Biz, Section, MediaItem, Ico } from "@/lib/constants";
import TemplateRenderer from "@/components/landings/templates/TemplateRenderer";
import EditModeWrapper from "@/components/landings/EditModeWrapper";
import { IframePreview } from "./IframePreview";
import { resolveTemplateKind } from "@/lib/templates/resolver";
import { getPublicUrl } from "@/lib/urls";

import BarberiaTemplate from "@/components/landings/BarberiaTemplate";
import CanchaTemplate from "@/components/landings/CanchaTemplate";
import MenuTemplate from "@/components/landings/MenuTemplate";
import ClinicaTemplate from "@/components/landings/ClinicaTemplate";
import EsteticaTemplate from "@/components/landings/EsteticaTemplate";
import GimnasioTemplate from "@/components/landings/GimnasioTemplate";
import TallerTemplate from "@/components/landings/TallerTemplate";
import LavaderoTemplate from "@/components/landings/LavaderoTemplate";
import GeneralTemplate from "@/components/landings/GeneralTemplate";
import TiendaTemplate from "@/components/landings/TiendaTemplate";

export interface LandingPreviewProps {
  biz: Biz;
  sections: Section[];
  media: MediaItem[];
  previewDevice?: "desktop" | "tablet" | "mobile";
  onSelectSection?: (sectionId: string) => void;
}

export const LandingPreview = ({
  biz,
  sections,
  media,
  previewDevice = "desktop",
  onSelectSection,
}: LandingPreviewProps) => {
  const templateKind = resolveTemplateKind(biz);
  const currentUrl = getPublicUrl(biz);

  const [zoomMode, setZoomMode] = useState<"fit" | "50" | "75" | "100">("fit");
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  // Escuchar mensajes de click-to-edit si se provee callback
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === "EDIT_SECTION" && onSelectSection) {
        onSelectSection(e.data.section);
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [onSelectSection]);

  // Escalado adaptable
  useEffect(() => {
    if (zoomMode === "50") {
      setScale(0.5);
      return;
    }
    if (zoomMode === "75") {
      setScale(0.75);
      return;
    }
    if (zoomMode === "100") {
      setScale(1);
      return;
    }

    const updateScale = () => {
      if (!previewRef.current) return;
      const width = previewRef.current.clientWidth;
      const targetWidth = previewDevice === "desktop" ? 1180 : previewDevice === "tablet" ? 820 : 375;
      if (width > 0 && width < targetWidth) {
        setScale(Math.max(0.35, Math.min(1, width / targetWidth)));
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    let ro: ResizeObserver | null = null;
    if (previewRef.current) {
      ro = new ResizeObserver(updateScale);
      ro.observe(previewRef.current);
    }
    return () => {
      window.removeEventListener("resize", updateScale);
      ro?.disconnect();
    };
  }, [previewDevice, zoomMode]);

  const renderContent = () => {
    switch (templateKind) {
      case "tienda":
        return <TiendaTemplate negocio={biz as any} businessId={biz.id} isPreview={true} />;
      case "multilevel":
        return (
          <TemplateRenderer
            negocio={biz}
            media={media}
            sections={sections}
            businessId={biz.id}
            isPreview={true}
          />
        );
      case "barberia":
        return <BarberiaTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />;
      case "taller":
        return <TallerTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />;
      case "lavadero":
        return <LavaderoTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />;
      case "cancha":
        return <CanchaTemplate negocio={biz as any} />;
      case "menu":
        return <MenuTemplate negocio={biz as any} />;
      case "estetica":
        return <EsteticaTemplate negocio={biz as any} />;
      case "clinica":
        return <ClinicaTemplate negocio={biz as any} />;
      case "gimnasio":
        return <GimnasioTemplate negocio={biz as any} />;
      case "general":
      default:
        return <GeneralTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />;
    }
  };

  // Zoom control bar component
  const ZoomBar = () => (
    <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-lg border border-border-subtle">
      {(["fit", "50", "75", "100"] as const).map((z) => (
        <button
          key={z}
          type="button"
          onClick={() => setZoomMode(z)}
          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
            zoomMode === z
              ? "bg-surface-3 text-fg shadow-sm border border-border-default"
              : "text-fg-subtle hover:text-fg"
          }`}
        >
          {z === "fit" ? "Ajustar" : `${z}%`}
        </button>
      ))}
    </div>
  );

  // ── MODO MÓVIL (Marco sobrio 1px, 44px radio, sin botones falsos) ──
  if (previewDevice === "mobile") {
    return (
      <div className="w-full flex flex-col items-center justify-center p-2 sm:p-4 animate-fadeIn">
        <div className="mb-3 flex items-center justify-between w-full max-w-[390px] px-2">
          <span className="text-[11px] text-fg-subtle font-medium">Móvil (375px)</span>
          <ZoomBar />
        </div>

        <div className="relative w-[375px] h-[780px] max-h-[calc(100vh-150px)] bg-surface-1 rounded-[44px] p-2.5 shadow-2xl border border-white/10 flex flex-col select-none">
          {/* Dynamic Island / notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-40 flex items-center justify-center pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-surface-3 border border-white/10" />
          </div>

          <div className="relative w-full h-full rounded-[36px] overflow-hidden bg-black flex-1 shadow-inner">
            <IframePreview title="Vista Previa Móvil" className="w-full h-full">
              <div className="w-full min-h-screen bg-transparent select-text">
                {renderContent()}
                <EditModeWrapper />
              </div>
            </IframePreview>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full pointer-events-none" />
        </div>
      </div>
    );
  }

  // ── MODO TABLET (820px) ──
  if (previewDevice === "tablet") {
    return (
      <div className="w-full flex flex-col items-center justify-center p-2 sm:p-4 animate-fadeIn" ref={previewRef}>
        <div className="mb-3 flex items-center justify-between w-full max-w-[840px] px-2">
          <span className="text-[11px] text-fg-subtle font-medium">Tablet (820px)</span>
          <ZoomBar />
        </div>

        <div className="relative w-[820px] max-w-full h-[760px] max-h-[calc(100vh-150px)] bg-surface-1 rounded-[32px] p-3 shadow-2xl border border-white/10 flex flex-col select-none">
          {/* Front camera indicator */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-black border border-white/10 z-40" />

          <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-black flex-1 shadow-inner">
            <IframePreview title="Vista Previa Tablet" className="w-full h-full">
              <div className="w-full min-h-screen bg-transparent select-text">
                {renderContent()}
                <EditModeWrapper />
              </div>
            </IframePreview>
          </div>
        </div>
      </div>
    );
  }

  // ── MODO ESCRITORIO (Browser Window) ──
  return (
    <div
      ref={previewRef}
      className="w-full max-w-[1240px] mx-auto flex flex-col h-[740px] max-h-[calc(100vh-140px)] bg-[#0e1422] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fadeIn"
    >
      {/* Browser header */}
      <div className="h-10 bg-surface-1 border-b border-border-default flex items-center justify-between px-4 flex-shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]/80" />
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]/80" />
          <div className="w-3 h-3 rounded-full bg-[#10b981]/80" />
        </div>

        <div className="flex items-center gap-2 bg-surface-2 border border-border-subtle px-3 py-1 rounded-lg text-xs text-fg-muted font-mono max-w-sm w-full mx-4 justify-center">
          <Ico n="lock" s={11} c="text-success" />
          <span className="truncate">{currentUrl}</span>
        </div>

        <div className="flex items-center gap-2">
          <ZoomBar />
        </div>
      </div>

      {/* Screen container */}
      <div className="relative w-full flex-1 overflow-hidden bg-black">
        <div
          className="h-full origin-top transition-transform duration-150"
          style={{
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            width: scale !== 1 ? `${100 / scale}%` : "100%",
            height: scale !== 1 ? `${100 / scale}%` : "100%",
          }}
        >
          <IframePreview title="Vista Previa Escritorio" className="w-full h-full">
            <div className="w-full min-h-screen bg-transparent select-text">
              {renderContent()}
              <EditModeWrapper />
            </div>
          </IframePreview>
        </div>
      </div>
    </div>
  );
};
