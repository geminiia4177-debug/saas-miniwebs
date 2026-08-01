"use client";

import React, { useState } from "react";
import BookingForm from "@/app/[subdomain]/BookingForm";

const Ico = ({ n, s = 24, c = "currentColor", stroke = 2 }: any) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {n === "map-pin" && <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>}
      {n === "phone" && <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>}
      {n === "calendar" && <><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></>}
      {n === "star" && <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>}
      {n === "instagram" && <><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></>}
      {n === "facebook" && <><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></>}
      {n === "chevron-down" && <><polyline points="6 9 12 15 18 9"/></>}
      {n === "chevron-up" && <><polyline points="18 15 12 9 6 15"/></>}
      {n === "arrow-right" && <><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></>}
    </svg>
  );
};

export default function ListTheme(props: { negocio: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, media = [], businessId } = props;
  const config = negocio?.layoutConfig || {};
  const primary = negocio?.primaryColor || "#ec4899";
  const secondary = negocio?.secondaryColor || "#db2777";
  const fontFamily = negocio?.fontFamily || "sans";
  const bgType = negocio?.backgroundType || "color";
  const scaleHero = (config.fontSizeHero || 100) / 100;
  const scaleTitles = (config.fontSizeTitles || 100) / 100;
  const scaleBody = (config.fontSizeBody || 100) / 100;
  
  const getItems = () => {
    if (negocio.type === "barberia") return config.barberiaServices || [];
    if (negocio.type === "estetica") return config.esteticaServicios || [];
    if (negocio.type === "clinica") return config.clinicaEspecialidades || [];
    if (negocio.type === "taller") return config.tallerServices || [];
    if (negocio.type === "restaurante" || negocio.type === "menu") return config.menuCategorias?.flatMap((c: any) => c.items) || [];
    return config.items || [];
  };
  
  const items = getItems().filter((s:any) => s.active !== false);
  const gallery = media.filter((m: any) => m.type === "image") || [];
  
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const getBackground = () => {
    if (bgType === "image" && negocio.backgroundImageUrl) {
      return { backgroundImage: `url(${negocio.backgroundImageUrl})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" as const };
    }
    if (bgType === "gradient") {
      return { background: `linear-gradient(135deg, ${primary}10, ${secondary}30)` };
    }
    return { backgroundColor: "#f8fafc" };
  };

  return (
    <div className="min-h-screen text-slate-800 pb-20" style={{ fontFamily, ...getBackground() }}>
      
      {/* ─── CENTRADO TIPO LINKTREE ─── */}
      <div className="max-w-xl mx-auto px-4 pt-16 flex flex-col items-center">
        
        {/* LOGO O AVATAR */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-50"></div>
          {negocio.logoUrl ? (
            <img src={negocio.logoUrl} alt="Logo" className="relative z-10 w-28 h-28 rounded-full object-cover shadow-2xl border-4 border-white" />
          ) : (
            <div className="relative z-10 w-28 h-28 rounded-full bg-white shadow-2xl border-4 border-white flex items-center justify-center text-4xl font-black" style={{ color: primary }}>
              {negocio.name.charAt(0)}
            </div>
          )}
        </div>
        
        {/* INFO BÁSICA */}
        <h1 className="text-3xl font-extrabold text-center mb-2 tracking-tight text-slate-900 drop-shadow-sm" style={{ color: config.heroTitleColor || "" }}>
          <span style={{ fontSize: `${scaleHero}em` }}>{config.heroTitle || negocio.name}</span>
        </h1>
        <p className="text-center text-slate-600 font-medium max-w-sm mb-6 leading-relaxed">
          <span style={{ fontSize: `${scaleBody}em` }}>{config.heroText || negocio.description || "Tu mejor opción."}</span>
        </p>
        
        {/* REDES SOCIALES (ICONOS RAPIDOS) */}
        <div className="flex gap-4 mb-10">
          {negocio.instagram && (
            <a href={negocio.instagram} target="_blank" className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:-translate-y-1 transition-transform" style={{ color: primary }}>
              <Ico n="instagram" s={20} />
            </a>
          )}
          {negocio.whatsapp && (
            <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} target="_blank" className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:-translate-y-1 transition-transform" style={{ color: primary }}>
              <Ico n="phone" s={20} />
            </a>
          )}
          {negocio.facebook && (
            <a href={negocio.facebook} target="_blank" className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:-translate-y-1 transition-transform" style={{ color: primary }}>
              <Ico n="facebook" s={20} />
            </a>
          )}
        </div>
        
        {/* ─── SERVICIOS LISTA (ACCORDION) ─── */}
        {items.length > 0 && (
          <div className="w-full space-y-3 mb-10">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 text-center mb-4">
              <span style={{ fontSize: `${scaleTitles}em` }}>Servicios & Precios</span>
            </h2>
            
            {items.map((item: any, i: number) => {
              const isExpanded = expandedItem === i;
              return (
                <div key={i} className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-white/50">
                  <button 
                    onClick={() => setExpandedItem(isExpanded ? null : i)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primary}15`, color: primary }}>
                          <Ico n="star" s={20} />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-800"><span style={{ fontSize: `${scaleBody}em` }}>{item.name}</span></h3>
                        <p className="text-xs font-bold mt-1" style={{ color: primary }}>{item.price ? `$${item.price}` : "Consultar"}</p>
                      </div>
                    </div>
                    <div className="text-slate-400">
                      <Ico n={isExpanded ? "chevron-up" : "chevron-down"} s={20} />
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-white/50 text-sm text-slate-600">
                      <p className="mb-4"><span style={{ fontSize: `${scaleBody}em` }}>{item.description || "Sin descripción disponible."}</span></p>
                      <a href="#booking" className="inline-flex items-center justify-center w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-md" style={{ backgroundColor: primary }}>
                        Reservar esto
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── BOOKING ─── */}
        <div id="booking" className="w-full bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl p-6 md:p-8 border border-white/50 mb-10">
          <h2 className="text-2xl font-black text-center text-slate-900 mb-2">
            <span style={{ fontSize: `${scaleTitles}em` }}>Reservar Turno</span>
          </h2>
          <p className="text-center text-slate-500 text-sm mb-6"><span style={{ fontSize: `${scaleBody}em` }}>Completa el formulario para agendar.</span></p>
          <BookingForm 
            businessId={businessId || negocio.id} 
            services={items.map((s:any) => s.name)} 
            primaryColor={primary}
          />
        </div>

        {/* ─── GALERIA RAPIDA (MINI) ─── */}
        {gallery.length > 0 && (
          <div className="w-full mb-10">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 text-center mb-4">
              <span style={{ fontSize: `${scaleTitles}em` }}>Nuestros Trabajos</span>
            </h2>
            <div className="flex overflow-x-auto gap-3 pb-4 snap-x snap-mandatory custom-scrollbar">
              {gallery.map((img: any, i: number) => (
                <img key={i} src={img.url} alt="Gallery" className="w-48 h-48 object-cover rounded-2xl flex-shrink-0 snap-center shadow-sm" />
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} {negocio.name}.
        </p>
      </div>
      
    </div>
  );
}
