"use client";

import React, { useState, useEffect } from "react";
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
      {n === "menu" && <><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></>}
      {n === "x" && <><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></>}
      {n === "chevron-down" && <><polyline points="6 9 12 15 18 9"/></>}
    </svg>
  );
};

export default function DarkEleganceTheme(props: { negocio: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, media = [], businessId } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const config = negocio?.layoutConfig || {};
  const primary = negocio?.primaryColor || "#d4af37"; // default gold
  const fontFamily = negocio?.fontFamily || "sans";
  
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed]" style={{ fontFamily }}>
      
      {/* ─── NAVBAR ─── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${scrolled ? "bg-black/90 backdrop-blur-md py-4 border-white/10" : "bg-transparent py-6 border-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {negocio.logoUrl ? (
              <img src={negocio.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover" style={{ border: `1px solid ${primary}50` }} />
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-2xl" style={{ backgroundColor: `${primary}20`, color: primary, border: `1px solid ${primary}50` }}>
                {negocio.name.charAt(0)}
              </div>
            )}
            <span className="font-extrabold text-2xl tracking-widest uppercase" style={{ letterSpacing: "0.2em" }}>
              {negocio.name}
            </span>
          </div>
          
          <div className="hidden md:flex gap-8 items-center">
            {items.length > 0 && <a href="#servicios" className="text-sm font-semibold tracking-widest uppercase hover:text-white transition-colors" style={{ color: `${primary}90` }}>Servicios</a>}
            {gallery.length > 0 && <a href="#galeria" className="text-sm font-semibold tracking-widest uppercase hover:text-white transition-colors" style={{ color: `${primary}90` }}>Galería</a>}
            <a href="#booking" className="px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-black" style={{ border: `1px solid ${primary}`, color: primary }}>
              Reservar
            </a>
          </div>
          
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <Ico n={menuOpen ? "x" : "menu"} s={28} />
          </button>
        </div>
      </nav>

      {/* ─── MOBILE MENU ─── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-10 md:hidden border-b border-white/10">
          {items.length > 0 && <a href="#servicios" onClick={() => setMenuOpen(false)} className="text-2xl font-light tracking-widest uppercase text-white">Servicios</a>}
          {gallery.length > 0 && <a href="#galeria" onClick={() => setMenuOpen(false)} className="text-2xl font-light tracking-widest uppercase text-white">Galería</a>}
          <a href="#booking" onClick={() => setMenuOpen(false)} className="px-10 py-4 text-sm font-bold uppercase tracking-widest mt-8" style={{ backgroundColor: primary, color: "#000" }}>
            Reservar ahora
          </a>
        </div>
      )}

      {/* ─── HERO ─── */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex items-center justify-center text-center min-h-screen">
        {negocio.bannerUrl ? (
          <div className="absolute inset-0 z-0">
            <img src={negocio.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,1) 100%)" }}></div>
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at center, ${primary} 0%, transparent 70%)` }}></div>
          </div>
        )}
        
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-[1px] h-20 mb-8" style={{ backgroundColor: primary }}></div>
          <h1 className="text-5xl md:text-8xl font-light text-white mb-6 tracking-tight uppercase" style={{ color: config.heroTitleColor || "#fff" }}>
            {config.heroTitle || negocio.name}
          </h1>
          <p className="text-lg md:text-xl text-[#a1a1aa] mb-12 font-light max-w-2xl mx-auto tracking-wide">
            {config.heroText || "Elegancia y perfección en cada detalle."}
          </p>
          <a href="#booking" className="flex items-center gap-4 px-10 py-4 text-sm font-bold tracking-widest uppercase transition-all duration-300 hover:scale-105" style={{ backgroundColor: primary, color: "#000" }}>
            Hacer reserva
          </a>
          
          <a href="#servicios" className="absolute bottom-10 animate-bounce text-white/50 hover:text-white transition-colors">
            <Ico n="chevron-down" s={32} />
          </a>
        </div>
      </header>

      {/* ─── SERVICIOS / ITEMS ─── */}
      {items.length > 0 && (
        <section id="servicios" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-24 flex flex-col items-center">
            <span className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: primary }}>Experiencia</span>
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-widest uppercase">Nuestros Servicios</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.filter((s:any) => s.active !== false).map((item: any, i: number) => (
              <div key={i} className="group relative p-8 flex flex-col overflow-hidden bg-[#111] hover:bg-[#151515] transition-colors border border-white/5">
                <div className="absolute top-0 left-0 w-full h-1 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" style={{ backgroundColor: primary }}></div>
                
                <div className="mb-8 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 filter grayscale group-hover:grayscale-0" />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: primary }}>
                      <Ico n="star" s={32} />
                    </div>
                  )}
                </div>
                
                <h3 className="text-2xl font-light text-white mb-4 tracking-wide">{item.name}</h3>
                <p className="text-[#888] text-sm mb-8 flex-1 leading-relaxed font-light">{item.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/10">
                  <span className="font-medium text-xl" style={{ color: primary }}>
                    {item.price ? `$${item.price}` : "Consultar"}
                  </span>
                  {item.duration && <span className="text-xs tracking-widest uppercase text-[#666]">{item.duration} min</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── BOOKING ─── */}
      <section id="booking" className="py-32 px-6 bg-black relative border-y border-white/5">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${primary} 0, ${primary} 1px, transparent 0, transparent 50%)`, backgroundSize: "30px 30px" }}></div>
        <div className="relative z-10 max-w-4xl mx-auto bg-[#0a0a0a] p-10 md:p-16 border border-white/10 shadow-2xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light mb-4 tracking-widest uppercase text-white">Reserva tu lugar</h2>
            <div className="w-12 h-[1px] mx-auto mt-6" style={{ backgroundColor: primary }}></div>
          </div>
          
          <div className="bg-[#111] p-4 border border-white/5">
            <BookingForm 
              businessId={businessId || negocio.id} 
              services={items.map((s:any) => s.name)} 
              primaryColor={primary}
            />
          </div>
        </div>
      </section>

      {/* ─── GALERIA ─── */}
      {gallery.length > 0 && (
        <section id="galeria" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-24 flex flex-col items-center">
            <span className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: primary }}>Portafolio</span>
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-widest uppercase">Nuestra Galería</h2>
          </div>
          
          <div className="columns-1 sm:columns-2 md:columns-3 gap-1 space-y-1">
            {gallery.map((img: any, i: number) => (
              <div key={i} className="break-inside-avoid relative group overflow-hidden bg-[#111]">
                <img src={img.url} alt={`Gallery ${i}`} className="w-full h-auto object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 filter grayscale group-hover:grayscale-0" />
                <div className="absolute inset-0 border border-white/0 group-hover:border-white/20 transition-colors z-10 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#050505] text-[#888] pt-24 pb-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          
          <div className="flex flex-col items-start">
            <h4 className="text-white text-2xl font-light tracking-widest uppercase mb-6">{negocio.name}</h4>
            <p className="text-sm mb-8 font-light leading-relaxed max-w-sm">{negocio.description || "Tu mejor opción."}</p>
            <div className="flex gap-6">
              {negocio.instagram && <a href={negocio.instagram} target="_blank" className="hover:text-white transition-colors"><Ico n="instagram" /></a>}
              {negocio.facebook && <a href={negocio.facebook} target="_blank" className="hover:text-white transition-colors"><Ico n="facebook" /></a>}
            </div>
          </div>
          
          <div>
            <h4 className="text-white text-sm font-bold tracking-widest uppercase mb-8" style={{ color: primary }}>Contacto</h4>
            <ul className="space-y-6 text-sm font-light">
              {negocio.whatsapp && (
                <li className="flex items-center gap-4">
                  <Ico n="phone" s={18} c={primary} /> <span>{negocio.whatsapp}</span>
                </li>
              )}
              {negocio.address && (
                <li className="flex items-start gap-4">
                  <Ico n="map-pin" s={18} c={primary} /> <span className="max-w-xs">{negocio.address}</span>
                </li>
              )}
            </ul>
          </div>
          
          <div className="flex items-end justify-end">
            <p className="text-xs font-light tracking-wider text-[#444] uppercase">
              © {new Date().getFullYear()} {negocio.name}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
