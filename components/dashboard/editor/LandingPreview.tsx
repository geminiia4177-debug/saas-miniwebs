import React from "react";
import { Biz, Section, MediaItem } from "@/lib/constants";
import BarberiaTemplate from "@/components/landings/BarberiaTemplate";
import CanchaTemplate    from "@/components/landings/CanchaTemplate";
import MenuTemplate      from "@/components/landings/MenuTemplate";
import ClinicaTemplate   from "@/components/landings/ClinicaTemplate";
import EsteticaTemplate  from "@/components/landings/EsteticaTemplate";
import GimnasioTemplate  from "@/components/landings/GimnasioTemplate";
import TallerTemplate    from "@/components/landings/TallerTemplate";
import LavaderoTemplate  from "@/components/landings/LavaderoTemplate";
import GeneralTemplate   from "@/components/landings/GeneralTemplate";

import ModernTheme from "@/components/landings/themes/ModernTheme";
import DarkEleganceTheme from "@/components/landings/themes/DarkEleganceTheme";
import ListTheme from "@/components/landings/themes/ListTheme";
import EditModeWrapper from "@/components/landings/EditModeWrapper";

export const LandingPreview = ({
  biz, sections, media,
}: {
  biz: Biz;
  sections: Section[];
  media: MediaItem[];
}) => {
  const containerClass = "w-full rounded-2xl overflow-y-auto h-[700px] border border-white/10 shadow-2xl custom-scrollbar relative";
  const containerStyle = { transform: "translateZ(0)" }; // Crea un bloque contenedor para elements con position: fixed

  const themeVariant = biz.layoutConfig?.themeVariant || "classic";

  const renderContent = () => {
    if (themeVariant === "modern") return <ModernTheme negocio={biz as any} media={media} businessId={biz.id} sections={sections} />;
    if (themeVariant === "dark") return <DarkEleganceTheme negocio={biz as any} media={media} businessId={biz.id} sections={sections} />;
    if (themeVariant === "list") return <ListTheme negocio={biz as any} media={media} businessId={biz.id} sections={sections} />;

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
