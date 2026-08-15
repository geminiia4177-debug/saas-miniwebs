"use client";

import React, { useState, useEffect } from "react";
import BookingForm from "@/app/[subdomain]/BookingForm";
import VideoSection from "@/components/ui/VideoSection";

// Helper icons
const Ico = ({ n, s = 24, c = "currentColor", stroke = 2 }: any) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {n === "map-pin" && <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>}
      {n === "phone" && <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>}
      {n === "calendar" && <><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></>}
      {n === "star" && <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>}
      {n === "instagram" && <><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></>}
      {n === "facebook" && <><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></>}
      {n === "menu" && <><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></>}
      {n === "x" && <><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></>}
      {n === "arrow-right" && <><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></>}
    </svg>
  );
};

export default function ModernTheme(props: { negocio: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, media = [], businessId, sections = [] } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const config = negocio?.layoutConfig || {};
  const primary = negocio?.primaryColor || "#3b82f6";
  const secondary = negocio?.secondaryColor || "#db2777";
  const accent = negocio?.accentColor || primary;
  const fontFamily = negocio?.fontFamily || "sans";
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
  
  const items = getItems();
  const gallery = media.filter((m: any) => m.type === "image") || [];

  const bgType = negocio?.backgroundType || "color";

  const getBackground = () => {
    if (bgType === "image" && negocio.backgroundImageUrl) {
      return { backgroundImage: `url(${negocio.backgroundImageUrl})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" as const };
    }
    if (bgType === "gradient") {
      return { background: `linear-gradient(135deg, ${primary}15, ${secondary}25)`, backgroundColor: "#f8fafc" };
    }
    return { backgroundColor: "#f8fafc" };
  };

  return (
    <div className="min-h-screen text-slate-900" style={{ fontFamily, ...getBackground(), ["--primary" as any]: primary, ["--accent" as any]: accent, ["--secondary" as any]: secondary }}>
      
      {/* ─── NAVBAR ─── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"}`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {negocio.logoUrl ? (
              <img src={negocio.logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                {negocio.name.charAt(0)}
              </div>
            )}
            <span className={`font-bold text-xl tracking-tight ${scrolled ? "text-slate-900" : "text-white drop-shadow-md"}`}>
              {negocio.name}
            </span>
          </div>
          
          <div className="hidden md:flex gap-6 items-center">
            {items.length > 0 && <a href="#servicios" className={`text-sm font-medium hover:opacity-70 transition-opacity ${scrolled ? "text-slate-600" : "text-white"}`}>Servicios</a>}
            {gallery.length > 0 && <a href="#galeria" className={`text-sm font-medium hover:opacity-70 transition-opacity ${scrolled ? "text-slate-600" : "text-white"}`}>Galería</a>}
            <a href="#booking" className="px-5 py-2.5 rounded-full text-white text-sm font-bold shadow-md hover:shadow-lg transition-all" style={{ backgroundColor: primary }}>
              Reservar ahora
            </a>
          </div>
          
          <button className={`md:hidden ${scrolled ? "text-slate-900" : "text-white"}`} onClick={() => setMenuOpen(!menuOpen)}>
            <Ico n={menuOpen ? "x" : "menu"} s={28} />
          </button>
        </div>
      </nav>

      {/* ─── MOBILE MENU ─── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden">
          {items.length > 0 && <a href="#servicios" onClick={() => setMenuOpen(false)} className="text-2xl font-semibold text-slate-800">Servicios</a>}
          {gallery.length > 0 && <a href="#galeria" onClick={() => setMenuOpen(false)} className="text-2xl font-semibold text-slate-800">Galería</a>}
          <a href="#booking" onClick={() => setMenuOpen(false)} className="px-8 py-4 rounded-full text-white text-lg font-bold shadow-lg" style={{ backgroundColor: primary }}>
            Reservar ahora
          </a>
        </div>
      )}

      {/* ─── HERO ─── */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden flex items-center justify-center text-center min-h-[80vh]">
        {negocio.bannerUrl ? (
          <div className="absolute inset-0 z-0">
            <img src={negocio.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(config.bannerOpacity ?? 60)/100})` }}></div>
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-black/5"></div>
        )}
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tight drop-shadow-lg" style={{ color: config.heroTitleColor || "#ffffff" }}>
            <span style={{ fontSize: `${scaleHero}em` }}>{config.heroTitle || negocio.name}</span>
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-10 font-medium max-w-2xl mx-auto drop-shadow-md">
            <span style={{ fontSize: `${scaleBody}em` }}>{config.heroText || "La mejor experiencia en un solo lugar."}</span>
          </p>
          <a href="#booking" className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-lg shadow-xl hover:-translate-y-1 transition-transform" style={{ backgroundColor: primary }}>
            Reservar Turno <Ico n="arrow-right" s={20} />
          </a>
        </div>
      </header>

      {/* ─── SERVICIOS / ITEMS ─── */}
      {items.length > 0 && (
        <section id="servicios" className="py-24 px-6 bg-transparent relative">
          <div className="max-w-6xl mx-auto text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              <span style={{ fontSize: `${scaleTitles}em` }}>Nuestros Servicios</span>
            </h2>
            <div className="w-20 h-1.5 mx-auto mt-6 rounded-full" style={{ backgroundColor: primary }}></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.filter((s:any) => s.active !== false).map((item: any, i: number) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm hover:shadow-xl transition-shadow border border-slate-100 flex flex-col group">
                <div className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: `${primary}15`, color: primary }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <Ico n="star" s={28} />
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3"><span style={{ fontSize: `${scaleBody}em` }}>{item.name}</span></h3>
                <p className="text-slate-500 text-sm mb-6 flex-1 leading-relaxed"><span style={{ fontSize: `${scaleBody}em` }}>{item.description}</span></p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <span className="font-extrabold text-lg text-slate-900">
                    {item.price ? `$${item.price}` : "Consultar"}
                  </span>
                  {item.duration && <span className="text-xs text-slate-400 font-medium">{item.duration} min</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── BOOKING ─── */}
      <section id="booking" className="py-24 px-6 relative border-y border-slate-200" style={{ backgroundColor: `${primary}10` }}>
        <div className="max-w-4xl mx-auto rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-100" style={{ backgroundColor: config.bookingBgColor || "#ffffff" }}>
          <div className="p-10 md:p-14 flex-1">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">
              <span style={{ fontSize: `${scaleTitles}em` }}>Reserva tu lugar</span>
            </h2>
            <p className="text-slate-500 mb-8"><span style={{ fontSize: `${scaleBody}em` }}>Elige tu servicio y agenda en segundos.</span></p>
          </div>
          
          <div className="rounded-3xl overflow-hidden text-slate-900 bg-transparent">
            <BookingForm 
              businessId={businessId || negocio.id} 
              services={items.map((s:any) => s.name)} 
              primaryColor={primary}
            />
          </div>
        </div>
      </section>

      {/* ─── VIDEO ─── */}
      <VideoSection
        videoUrl={config.videoUrl || (sections.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
        accentColor={primary}
        theme="light"
      />

      {/* ─── GALERIA ─── */}
      {gallery.length > 0 && (
        <section id="galeria" className="py-24 px-6 bg-black/5">
          <div className="max-w-6xl mx-auto text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              <span style={{ fontSize: `${scaleTitles}em` }}>Nuestra Galería</span>
            </h2>
            <div className="w-20 h-1.5 mx-auto mt-6 rounded-full" style={{ backgroundColor: primary }}></div>
          </div>
          
          <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
            {gallery.map((img: any, i: number) => (
              <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden group">
                <img src={img.url} alt={`Gallery ${i}`} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── FOOTER ─── */}
      <footer className="py-16 px-6 border-t border-slate-900" style={{ backgroundColor: config.footerBgColor || "#020617", color: config.footerTextColor || "#94a3b8" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div>
            <h4 className="text-xl font-bold mb-4 tracking-tight" style={{ color: config.footerTextColor || "#ffffff" }}>{negocio.name}</h4>
            <p className="text-sm mb-6">{negocio.description || "Tu mejor opción."}</p>
            <div className="flex gap-4">
              {negocio.instagram && <a href={negocio.instagram} target="_blank" className="hover:text-white transition-colors"><Ico n="instagram" /></a>}
              {negocio.facebook && <a href={negocio.facebook} target="_blank" className="hover:text-white transition-colors"><Ico n="facebook" /></a>}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-bold mb-4" style={{ color: config.footerTextColor || "#ffffff" }}>Contacto</h4>
            <ul className="space-y-4 text-sm">
              {negocio.whatsapp && (
                <li className="flex items-center gap-3">
                  <Ico n="phone" s={18} /> {negocio.whatsapp}
                </li>
              )}
              {negocio.address && (
                <li className="flex items-start gap-3">
                  <Ico n="map-pin" s={18} /> {negocio.address}
                </li>
              )}
            </ul>
          </div>
          
          <div>
            <p className="text-xs mt-12 md:mt-24 text-slate-600">
              © {new Date().getFullYear()} {negocio.name}. Creado con SaaS Miniwebs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
