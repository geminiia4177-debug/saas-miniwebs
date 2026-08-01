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

export const LandingPreview = ({
  biz, sections, media,
}: {
  biz: Biz;
  sections: Section[];
  media: MediaItem[];
}) => {
  const containerClass = "w-full rounded-2xl overflow-y-auto h-[700px] border border-white/10 shadow-2xl custom-scrollbar relative";
  const containerStyle = { transform: "translateZ(0)" }; // Crea un bloque contenedor para elements con position: fixed

  if (biz.type === "barberia") {
    return (
      <div className={containerClass} style={containerStyle}>
        <BarberiaTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />
      </div>
    );
  }
  if (biz.type === "taller") {
    return (
      <div className={containerClass} style={containerStyle}>
        <TallerTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />
      </div>
    );
  }
  if (biz.type === "lavadero") {
    return (
      <div className={containerClass} style={containerStyle}>
        <LavaderoTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />
      </div>
    );
  }
  if (biz.type === "cancha") {
    return (
      <div className={containerClass} style={containerStyle}>
        <CanchaTemplate negocio={biz as any} />
      </div>
    );
  }
  if (biz.type === "menu" || biz.type === "restaurante") {
    return (
      <div className={containerClass} style={containerStyle}>
        <MenuTemplate negocio={biz as any} />
      </div>
    );
  }
  if (biz.type === "estetica") {
    return (
      <div className={containerClass} style={containerStyle}>
        <EsteticaTemplate negocio={biz as any} />
      </div>
    );
  }
  if (biz.type === "clinica") {
    return (
      <div className={containerClass} style={containerStyle}>
        <ClinicaTemplate negocio={biz as any} />
      </div>
    );
  }
  if (biz.type === "gimnasio") {
    return (
      <div className={containerClass} style={containerStyle}>
        <GimnasioTemplate negocio={biz as any} />
      </div>
    );
  }

  // Fallback a GeneralTemplate si no coincide ninguno
  return (
    <div className={containerClass} style={containerStyle}>
      <GeneralTemplate negocio={biz as any} media={media} businessId={biz.id} sections={sections} />
    </div>
  );
};
