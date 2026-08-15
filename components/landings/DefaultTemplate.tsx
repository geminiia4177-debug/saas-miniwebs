"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import BookingForm from "@/app/[subdomain]/BookingForm";
import { ChevronDown, MapPin, MessageCircle } from "lucide-react";
import { extractYouTubeId } from "@/components/ui/VideoSection";

export default function DefaultTemplate({ negocio, media, sections }: { negocio: any; media: any[]; sections: any[] }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const galleryImages = media.filter((m: any) => m.type === "image");
  const visibleSections = sections.filter((s: any) => s.visible);

  const fonts: Record<string, string> = {
    sans: "system-ui, sans-serif",
    serif: "Georgia, serif",
    mono: "monospace",
  };

  const currentFont = fonts[negocio.fontFamily || "sans"];
  const primary = negocio.accentColor || negocio.primaryColor || "#4f46e5";
  const secondary = negocio.secondaryColor || "#a855f7";
  const accent = negocio.accentColor || primary;
  const heroImage = negocio.bannerUrl || (galleryImages.length > 0 ? galleryImages[0].url : null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState("");

  return (
    <div style={{ backgroundColor: "var(--biz-bg)", minHeight: "100vh" }} className="scroll-smooth">
      {/* ── BARRA DE NAVEGACIÓN SUPERIOR ── */}
      <nav 
        className={`px-6 py-4 fixed top-0 w-full z-50 transition-all duration-300 flex justify-between items-center ${
          scrolled ? "backdrop-blur-md shadow-sm border-b" : "bg-transparent text-white"
        }`}
        style={scrolled ? { backgroundColor: "var(--biz-surface)", borderColor: "var(--biz-border)", color: "var(--biz-text)" } : (!heroImage ? { backgroundColor: primary } : {})}
      >
        <div className="flex items-center gap-3">
          {negocio.logoUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm relative">
              <Image src={negocio.logoUrl} alt="Logo" fill className="object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center font-bold text-white shadow-sm" style={scrolled ? { backgroundColor: primary } : {}}>
              {negocio.name?.charAt(0) || "B"}
            </div>
          )}
          <span className={`font-bold text-lg ${scrolled ? "text-slate-800" : "text-white"}`}>{negocio.name}</span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#services" className="hover:opacity-70 transition-opacity">Servicios</a>
          <a href="#gallery" className="hover:opacity-70 transition-opacity">Galería</a>
          <a href="#contact" className="hover:opacity-70 transition-opacity">Contacto</a>
          <a href="#booking" className="px-4 py-2 rounded-full font-bold text-white transition-colors" style={{ backgroundColor: primary }}>
            Reservar →
          </a>
        </div>

        {/* Mobile Nav Toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="space-y-1.5">
            <div className={`w-6 h-0.5 transition-all ${scrolled ? "bg-slate-800" : "bg-white"} ${menuOpen ? "rotate-45 translate-y-2" : ""}`}></div>
            <div className={`w-6 h-0.5 transition-all ${scrolled ? "bg-slate-800" : "bg-white"} ${menuOpen ? "opacity-0" : ""}`}></div>
            <div className={`w-6 h-0.5 transition-all ${scrolled ? "bg-slate-800" : "bg-white"} ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}></div>
          </div>
        </button>
      </nav>

      {/* Drawer Móvil */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 pt-24 px-6 flex flex-col gap-6 text-lg font-medium md:hidden" style={{ backgroundColor: "var(--biz-surface)", color: "var(--biz-text)" }}>
          <a href="#services" onClick={() => setMenuOpen(false)}>Servicios</a>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>Galería</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contacto</a>
          <a href="#booking" onClick={() => setMenuOpen(false)} className="px-6 py-3 rounded-full text-center text-white mt-4" style={{ backgroundColor: primary }}>
            Reservar Turno
          </a>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-sm border-t flex gap-3 z-50 md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.05)]" style={{ backgroundColor: "var(--biz-surface)", borderColor: "var(--biz-border)" }}>
        {negocio.whatsapp && (
          <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center p-3 rounded-xl bg-green-500 text-white shrink-0">
            <MessageCircle className="w-6 h-6" />
          </a>
        )}
        <a href="#booking" className="flex-1 flex items-center justify-center py-3 rounded-xl font-bold text-white text-sm uppercase tracking-wide shadow-colored" style={{ backgroundColor: primary }}>
          Reservar turno
        </a>
      </div>

      {/* ── CONSTRUCTOR DINÁMICO DE SECCIONES ── */}
      <main className="pb-24 md:pb-0">
        {visibleSections.map((section: any) => {
          
          if (section.id === "hero") return (
            <section key="hero" className="relative min-h-[90vh] flex flex-col justify-center px-6 py-24 text-center overflow-hidden" 
                     style={{ background: heroImage ? `linear-gradient(to bottom, ${primary}80, ${primary}cc), url(${heroImage}) center/cover no-repeat` : `linear-gradient(135deg, ${primary}20 0%, ${secondary}15 50%, #f8faff 100%)` }}>
              <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
                
                <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-8 shadow-sm'>
                  <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse'/>
                  <span className='text-xs font-semibold text-emerald-700 tracking-wide uppercase'>Reservas abiertas</span>
                </div>

                <h1 className={`text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight ${heroImage ? "text-white" : "text-slate-900"}`}>
                  {section.config?.title || "Bienvenido"}
                </h1>
                
                <p className={`text-lg md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed ${heroImage ? "text-white/90" : "text-slate-600"}`}>
                  {section.config?.subtitle || "Descubre nuestros servicios premium y agenda online al instante."}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
                  <a href="#booking" className="w-full sm:w-auto px-8 py-4 rounded-full text-white text-lg font-bold shadow-colored hover:scale-105 transition-transform" 
                     style={{ background: heroImage ? `linear-gradient(135deg, ${primary}, ${secondary})` : `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                    {section.config?.ctaText || "Reservar Turno"}
                  </a>
                  {section.config?.ctaSecondary && (
                    <a href="#services" className={`w-full sm:w-auto px-8 py-4 rounded-full text-lg font-bold border-2 hover:bg-white/10 transition-colors ${heroImage ? "text-white border-white/30" : ""}`} 
                       style={!heroImage ? { color: primary, borderColor: primary } : {}}>
                      {section.config.ctaSecondary}
                    </a>
                  )}
                </div>

                <div className='absolute -bottom-24 left-1/2 -translate-x-1/2 animate-bounce hidden md:block'>
                  <ChevronDown className={`w-8 h-8 ${heroImage ? "text-white/50" : "text-slate-400"}`} />
                </div>
              </div>
            </section>
          );

          if (section.id === "gallery" && galleryImages.length > 0) return (
            <section key="gallery" id="gallery" className="px-6 py-24 max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-black mb-4 tracking-tight" style={{ color: "var(--biz-text)" }}>Nuestra Galería</h2>
                <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: primary }}></div>
              </div>
              <div className={section.config?.masonry ? "columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4" : `grid gap-4 ${section.config?.columns === 2 ? "grid-cols-2" : section.config?.columns === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3"}`}>
                {galleryImages.map((img: any, i: number) => (
                  <div key={img.id} className={`group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${section.config?.masonry ? "break-inside-avoid" : "aspect-square"}`} style={{ animation: `fadeInUp 0.5s ease forwards`, animationDelay: `${i * 60}ms` }}>
                    <Image src={img.url} alt={img.name || `Foto ${i}`} width={600} height={600} className={`w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ${!section.config?.masonry && "h-full"}`} loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                  </div>
                ))}
              </div>
            </section>
          );

          if (section.id === "services" && section.config?.items?.length > 0) return (
            <section key="services" id="services" className="px-6 py-24 relative" style={{ backgroundColor: "var(--biz-surface)" }}>
              <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-black mb-4 tracking-tight" style={{ color: "var(--biz-text)" }}>Nuestros Servicios</h2>
                  <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: primary }}></div>
                </div>
                
                <div className={`grid gap-6 ${section.config.items.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' : section.config.items.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
                  {section.config.items.map((item: any, i: number) => (
                    <div key={i} className="group relative rounded-3xl p-8 text-center shadow-sm border hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden flex flex-col" style={{ backgroundColor: "var(--biz-bg)", borderColor: "var(--biz-border)" }}>
                      {item.featured && (
                        <div className='absolute top-0 inset-x-0 h-1.5' style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}></div>
                      )}
                      {item.featured && (
                         <span className='absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white tracking-widest uppercase shadow-sm' style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}>
                           Destacado
                         </span>
                      )}
                      
                      <div className={`text-4xl mb-6 mx-auto w-16 h-16 flex items-center justify-center rounded-2xl ${item.featured ? "mt-6" : ""}`} style={{ backgroundColor: "var(--biz-surface)" }}>
                        {item.emoji || "✨"}
                      </div>
                      
                      <h3 className="font-bold text-xl mb-2" style={{ color: "var(--biz-text)" }}>{item.name}</h3>
                      
                      {item.description && (
                        <p className='text-sm max-h-0 md:max-h-0 overflow-hidden md:group-hover:max-h-32 transition-all duration-500 mb-0 md:group-hover:mb-4' style={{ color: "var(--biz-text-sec)" }}>
                          {item.description}
                        </p>
                      )}
                      <p className='text-sm block md:hidden mb-4' style={{ color: "var(--biz-text-sec)" }}>{item.description}</p>
                      
                      <div className="mt-auto pt-4 border-t" style={{ borderColor: "var(--biz-border)" }}>
                        <div className="flex justify-between items-center">
                          <div className="text-left">
                            <p className="text-2xl font-black mb-0.5" style={{ color: primary }}>
                              {!item.price || item.price == 0 ? 'Consultar' : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(item.price))}
                            </p>
                            <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--biz-text-sec)" }}>{item.duration} min</p>
                          </div>
                          <button onClick={() => { setPreselectedService(item.name); document.getElementById('booking')?.scrollIntoView({behavior:'smooth'}); }} className="px-4 py-2 rounded-full text-white text-sm font-bold shadow-sm hover:scale-105 transition-transform" style={{ backgroundColor: primary }}>
                            Reservar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );

          if (section.id === "booking") {
            const servicesSection = visibleSections.find((s: any) => s.id === "services");
            const availableServices = servicesSection?.config?.items?.map((item: any) => item.name) || ["Servicio General"];

            return (
              <section key="booking" id="booking" className="px-6 py-24 max-w-3xl mx-auto text-center">
                <div className="mb-12">
                  <h2 className="text-4xl font-black mb-4 tracking-tight" style={{ color: "var(--biz-text)" }}>{section.config?.title || "Reservá tu turno"}</h2>
                  <p className="text-lg" style={{ color: "var(--biz-text-sec)" }}>{section.config?.subtitle || "Completá tus datos y asegurá tu lugar en segundos."}</p>
                </div>
                <div className="rounded-[2rem] shadow-xl border p-2 sm:p-4" style={{ backgroundColor: "var(--biz-surface)", borderColor: "var(--biz-border)" }}>
                  <BookingForm 
                    businessId={negocio.id} 
                    primaryColor={primary} 
                    secondaryColor={secondary} 
                    services={availableServices} 
                    preselectedService={preselectedService}
                    variant="general"
                  />
                </div>
              </section>
            );
          }

          if (section.id === "video") {
            const currentVideoUrl = section.config?.youtubeUrl || negocio?.layoutConfig?.videoUrl;
            if (currentVideoUrl) {
              const videoId = extractYouTubeId(currentVideoUrl);
              if (videoId) {
                return (
                  <section key="video" className="px-6 py-24 max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                      <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Conocenos</h2>
                      <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: primary }}></div>
                    </div>
                    <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-200">
                      <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0`} className="w-full h-full border-none" allowFullScreen loading="lazy" />
                    </div>
                  </section>
                );
              }
            }
          }

          if (section.id === "reviews" && section.config?.items?.length > 0) return (
            <section key="reviews" className="px-6 py-24 bg-white">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Lo que dicen nuestros clientes</h2>
                  <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: primary }}></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {section.config.items.map((review: any, i: number) => (
                    <div key={i} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm relative">
                      <div className="text-yellow-400 text-2xl mb-4">{"★".repeat(review.rating || 5)}</div>
                      <p className="text-slate-600 mb-6 italic">"{review.text}"</p>
                      <p className="font-bold text-slate-900">{review.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );

          if (section.id === "faq" && section.config?.items?.length > 0) return (
            <section key="faq" className="px-6 py-24 bg-slate-50">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Preguntas Frecuentes</h2>
                  <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: primary }}></div>
                </div>
                <div className="space-y-4">
                  {section.config.items.map((faq: any, i: number) => (
                    <details key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 group cursor-pointer">
                      <summary className="font-bold text-lg text-slate-800 outline-none list-none flex justify-between items-center">
                        {faq.question}
                        <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <p className="text-slate-600 mt-4 leading-relaxed">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          );

          return null;
        })}
      </main>

      {/* ── WAVE DIVIDER ── */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60" className="w-full h-auto text-slate-900" style={{ marginBottom: "-1px", fill: primary }}>
        <path d="M0,32L48,37.3C96,43,192,53,288,53.3C384,53,480,43,576,37.3C672,32,768,32,864,37.3C960,43,1056,53,1152,53.3C1248,53,1344,43,1392,37.3L1440,32L1440,60L0,60Z"></path>
      </svg>

      {/* ── FOOTER DE TRES COLUMNAS ── */}
      <footer id="contact" className="px-6 pt-16 pb-32 md:pb-16 text-white" style={{ backgroundColor: primary }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Info */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              {negocio.logoUrl ? (
                <Image src={negocio.logoUrl} width={40} height={40} className="rounded-full bg-white/10" alt="Logo" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
                  {negocio.name?.charAt(0) || "B"}
                </div>
              )}
              <span className="font-bold text-2xl tracking-tight">{negocio.name}</span>
            </div>
            <p className="text-white/70 mb-8 leading-relaxed">
              {negocio.description || "Brindando el mejor servicio con atención personalizada. Te esperamos para vivir una experiencia única."}
            </p>
            <div className="flex gap-4">
              {negocio.whatsapp && (
                <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
              {negocio.instagram && (
                <a href={`https://instagram.com/${negocio.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {negocio.facebook && (
                <a href={`https://facebook.com/${negocio.facebook.replace('@','')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Horarios (simulados si no hay en la DB) */}
          <div>
            <h3 className="font-bold text-xl mb-6 tracking-tight">Horarios</h3>
            <ul className="space-y-3 text-white/80">
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span>Lunes a Viernes</span>
                <span className="font-medium text-white">09:00 - 20:00</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span>Sábados</span>
                <span className="font-medium text-white">09:00 - 15:00</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2 text-white/50">
                <span>Domingos</span>
                <span>Cerrado</span>
              </li>
            </ul>
          </div>

          {/* Ubicación */}
          <div>
            <h3 className="font-bold text-xl mb-6 tracking-tight">Ubicación</h3>
            <div className="flex items-start gap-3 mb-6 text-white/80">
              <MapPin className="w-5 h-5 shrink-0 mt-1" />
              <p>{negocio.address || "Ubicación del negocio"}</p>
            </div>
            {(negocio.address || negocio.layoutConfig?.mapUrl) && (
              <div className="w-full h-32 rounded-xl overflow-hidden bg-white/10 relative">
                <iframe 
                  src={negocio.layoutConfig?.mapUrl || `https://maps.google.com/maps?q=${encodeURIComponent(negocio.address)}&output=embed`} 
                  className="absolute inset-0 w-full h-full border-none opacity-80 mix-blend-luminosity hover:opacity-100 transition-opacity" 
                  loading="lazy"
                />
              </div>
            )}
          </div>

        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 text-center text-white/50 text-sm">
          &copy; {new Date().getFullYear()} {negocio.name}. Creado con SaaS Miniwebs.
        </div>
      </footer>
    </div>
  );
}
