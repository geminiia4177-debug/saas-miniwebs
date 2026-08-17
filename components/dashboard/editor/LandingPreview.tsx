import React from "react";
import { Biz, Section, MediaItem } from "@/lib/constants";
import TemplateRenderer from "@/components/landings/templates/TemplateRenderer";
import EditModeWrapper from "@/components/landings/EditModeWrapper";

import BarberiaTemplate from "@/components/landings/BarberiaTemplate";
import CanchaTemplate from "@/components/landings/CanchaTemplate";
import MenuTemplate from "@/components/landings/MenuTemplate";
import ClinicaTemplate from "@/components/landings/ClinicaTemplate";
import EsteticaTemplate from "@/components/landings/EsteticaTemplate";
import GimnasioTemplate from "@/components/landings/GimnasioTemplate";
import TallerTemplate from "@/components/landings/TallerTemplate";
import LavaderoTemplate from "@/components/landings/LavaderoTemplate";
import GeneralTemplate from "@/components/landings/GeneralTemplate";

export const LandingPreview = ({
  biz,
  sections,
  media,
}: {
  biz: Biz;
  sections: Section[];
  media: MediaItem[];
}) => {
  const containerClass =
    "w-full rounded-2xl overflow-y-auto h-[700px] border border-white/10 shadow-2xl custom-scrollbar relative";
  const containerStyle = { transform: "translateZ(0)" }; // Creates stacking context for fixed elements

  const templateLevel = biz.layoutConfig?.templateLevel;
  const themeVariant = biz.layoutConfig?.themeVariant || "classic";

  const renderContent = () => {
    // If a multi-level template or modern universal theme is selected, use TemplateRenderer
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

  return (
    <div className={containerClass} style={containerStyle}>
      {renderContent()}
      <EditModeWrapper />
    </div>
  );
};
