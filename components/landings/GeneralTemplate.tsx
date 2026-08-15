"use client";

import React, { useState, useEffect } from "react";
import BookingModal from "../ui/BookingModal";
import OpenNowBadge from "../ui/OpenNowBadge";
import SectionHeader from "../ui/SectionHeader";
import StatsRow from "../ui/StatsRow";
import VideoSection from "../ui/VideoSection";

export default function GeneralTemplate(props: { negocio?: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, businessId, media = [] } = props;
  const layoutConfig = negocio?.layoutConfig || {};
  
  const accent = negocio?.accentColor || negocio?.primaryColor || "#3B82F6"; // Azul moderno
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState("");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const galleryImages = media.filter((m: any) => m.type === "image");
  
  // Demo Data Fallbacks for Generic Template
  const servicios = layoutConfig.services || layoutConfig.barberiaServices || [
    { id: "1", name: "Consultoría Estratégica", desc: "Análisis profundo y plan de acción a medida para alcanzar tus objetivos.", price: "Desde $15.000", duration: "60" },
    { id: "2", name: "Servicio Premium", desc: "Atención exclusiva y personalizada con seguimiento continuo.", price: "$35.000", duration: "120" },
    { id: "3", name: "Soporte Técnico", desc: "Resolución de problemas y mantenimiento preventivo.", price: "$20.000", duration: "45" },
    { id: "4", name: "Implementación", desc: "Puesta en marcha y capacitación para tu equipo.", price: "$50.000", duration: "180" },
  ];

  const testimonios = layoutConfig.testimonios || [
    { texto: "Excelente servicio, la atención superó mis expectativas. Muy recomendables.", autor: "María García", rol: "Cliente Verificado" },
    { texto: "Profesionalismo y rapidez. Resolvieron mi problema en tiempo récord.", autor: "Juan Pérez", rol: "CEO, TechSolutions" },
    { texto: "Gran calidad humana y técnica. Sin dudas volvería a contratarlos.", autor: "Lucía Fernández", rol: "Cliente Verificado" }
  ];

  const stats = layoutConfig.stats || {
    clientes: "+10k", años: "5", valoracion: "4.9/5"
  };

  const serviceNames = servicios.map((s: any) => s.name || s.nombre);
  const heroImageUrl = negocio?.bannerUrl || layoutConfig.heroImage || (galleryImages[0] ? galleryImages[0].url : "");

  const handleOpenBooking = (service?: string) => {
    setPreselectedService(service || "");
    setBookingOpen(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        
        :root {
          --radius: 1rem;
          --accent-glow: color-mix(in srgb, var(--accent) 25%, transparent);
        }

        .font-outfit { font-family: 'Outfit', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        
        /* Modern Mesh Gradient Background */
        .mesh-bg {
          background-color: #FFFFFF;
          background-image: 
            radial-gradient(at 40% 20%, color-mix(in srgb, var(--accent) 15%, transparent) 0px, transparent 50%),
            radial-gradient(at 80% 0%, color-mix(in srgb, var(--accent) 10%, transparent) 0px, transparent 50%),
            radial-gradient(at 0% 50%, color-mix(in srgb, var(--accent) 5%, transparent) 0px, transparent 50%);
        }

        .glass-nav {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -15px var(--accent-glow);
          border-color: color-mix(in srgb, var(--accent) 30%, transparent);
        }

        .btn-primary {
          background-color: var(--accent);
          color: #ffffff;
          transition: all 0.3s ease;
          box-shadow: 0 4px 14px 0 var(--accent-glow);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px 0 var(--accent-glow);
          filter: brightness(1.1);
        }
      `}</style>

      <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-inter relative selection:bg-[var(--accent)] selection:text-white" style={{ "--accent": accent } as React.CSSProperties}>
        
        {/* ── NAV ── */}
        <nav className={`fixed top-0 inset-x-0 z-40 px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-300 ${isScrolled ? 'glass-nav py-3' : 'bg-transparent py-5'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-outfit font-bold text-xl">
              {(negocio?.name || "N")[0]}
            </div>
            <span className="font-outfit text-xl font-bold tracking-tight">
              {negocio?.name ?? "Tu Negocio"}
            </span>
          </div>

          <ul className="hidden md:flex gap-8 list-none text-[14px] font-medium text-[#4B5563]">
            <li><a href="#servicios" className="hover:text-[var(--accent)] transition-colors">Servicios</a></li>
            {galleryImages.length > 0 && <li><a href="#galeria" className="hover:text-[var(--accent)] transition-colors">Galería</a></li>}
            <li><a href="#nosotros" className="hover:text-[var(--accent)] transition-colors">Nosotros</a></li>
            <li><a href="#contacto" className="hover:text-[var(--accent)] transition-colors">Contacto</a></li>
          </ul>

          <button 
            onClick={() => handleOpenBooking()}
            className="btn-primary text-[14px] font-semibold px-5 py-2.5 rounded-full"
          >
            Agendar Ahora
          </button>
        </nav>

        {/* ── HERO ── */}
        <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 md:px-12 mesh-bg overflow-hidden border-b border-gray-100">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-[12px] font-semibold text-[#4B5563] mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
              Disponible para nuevos clientes
            </div>
            
            <h1 className="font-outfit text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-[#111827]">
              {negocio?.layoutConfig?.heroTitle || "Llevamos tu experiencia al siguiente nivel"}
            </h1>
            
            <p className="font-inter text-lg md:text-xl text-[#4B5563] max-w-2xl mx-auto mb-10 leading-relaxed">
              {negocio?.tagline || "Brindamos soluciones integrales y servicios de alta calidad diseñados específicamente para satisfacer tus necesidades."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => handleOpenBooking()}
                className="btn-primary w-full sm:w-auto text-[16px] font-semibold px-8 py-4 rounded-full"
              >
                Comenzar ahora
              </button>
              <a href="#servicios" className="w-full sm:w-auto text-[16px] font-semibold px-8 py-4 rounded-full bg-white border border-gray-200 text-[#374151] hover:bg-gray-50 transition-colors shadow-sm">
                Ver servicios
              </a>
            </div>
          </div>
        </header>

        {/* ── STATS ── */}
        <section className="bg-white py-12 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6">
             <StatsRow 
               stats={[
                 { value: stats.clientes, label: "Clientes Felices" },
                 { value: stats.años, label: "Años de Experiencia" },
                 { value: stats.valoracion, label: "Calificación Promedio" }
               ]}
             />
          </div>
        </section>

        {/* ── SERVICIOS ── */}
        <section id="servicios" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <SectionHeader 
            title="Nuestros Servicios"
            overline="Soluciones diseñadas para ti"
            description="Explora nuestra oferta de servicios pensados para brindarte los mejores resultados con atención personalizada."
            align="center"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-16">
            {servicios.map((srv: any, idx: number) => (
              <div 
                key={idx} 
                onClick={() => handleOpenBooking(srv.name || srv.nombre)}
                className="card-hover bg-white p-8 rounded-[1.5rem] border border-gray-100 shadow-sm cursor-pointer group flex flex-col h-full relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--accent)]/5 to-transparent rounded-bl-full -z-0"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] mb-4">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  {srv.price && (
                    <span className="font-outfit font-bold text-lg text-[#111827] bg-gray-50 px-3 py-1 rounded-full border border-gray-100">{srv.price}</span>
                  )}
                </div>
                
                <h3 className="font-outfit text-2xl font-bold text-[#111827] mb-3 group-hover:text-[var(--accent)] transition-colors relative z-10">{srv.name || srv.nombre}</h3>
                <p className="font-inter text-[#4B5563] text-sm leading-relaxed mb-6 flex-1 relative z-10">{srv.desc || srv.descripcion}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 relative z-10">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{srv.duration ? `${srv.duration} min` : 'Reserva Online'}</span>
                  <span className="text-[var(--accent)] font-semibold text-sm group-hover:translate-x-1 transition-transform">Agendar →</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ABOUT / TESTIMONIALS (Nosotros) ── */}
        <section id="nosotros" className="py-24 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="relative">
              {heroImageUrl ? (
                <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl relative">
                  <img src={heroImageUrl} alt="Nosotros" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--accent)] text-white rounded-full flex items-center justify-center font-bold text-xl">✓</div>
                      <div>
                        <p className="font-outfit font-bold text-[#111827]">Calidad Garantizada</p>
                        <p className="text-sm text-[#4B5563]">Compromiso con la excelencia</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] rounded-[2rem] bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                  <span className="text-gray-400 font-inter font-medium">Imagen Destacada</span>
                </div>
              )}
              {/* Decoration */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[var(--accent)]/10 rounded-full blur-2xl -z-10"></div>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-[var(--accent)] mb-3">Lo que dicen de nosotros</p>
              <h2 className="font-outfit text-4xl md:text-5xl font-extrabold text-[#111827] mb-8 leading-tight">La satisfacción de nuestros clientes es prioridad</h2>
              
              <div className="space-y-6">
                {testimonios.map((test: any, i: number) => (
                  <div key={i} className="p-6 bg-[#F9FAFB] rounded-2xl border border-gray-100">
                    <div className="flex gap-1 text-[#FBBF24] mb-3">
                      {[...Array(5)].map((_,j) => <span key={j}>★</span>)}
                    </div>
                    <p className="text-[#374151] italic mb-4">"{test.texto}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 font-bold">{test.autor[0]}</div>
                      <div>
                        <p className="font-bold text-sm text-[#111827]">{test.autor}</p>
                        <p className="text-xs text-[#6B7280]">{test.rol}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── VIDEO ── */}
        <VideoSection
          videoUrl={layoutConfig.videoUrl || (props.sections?.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
          accentColor={accent}
          theme="light"
        />

        {/* ── GALERÍA ── */}
        {galleryImages.length > 0 && (
          <section id="galeria" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
            <SectionHeader 
              title="Galería"
              overline="Un vistazo a lo que hacemos"
              align="center"
            />
            <div className="columns-2 md:columns-3 gap-4 mt-12 space-y-4">
              {galleryImages.slice(0, 6).map((img: any, i: number) => (
                <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative">
                  <img src={img.url} alt={`Galería ${i}`} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FOOTER / CONTACTO ── */}
        <footer id="contacto" className="bg-[#111827] text-white pt-20 pb-10 px-6 md:px-12 rounded-t-[3rem] mt-12 relative overflow-hidden">
          {/* Subtle glow in footer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent)]/10 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 relative z-10 mb-16">
            
            {/* Branding & Social */}
            <div className="lg:col-span-4">
              <h3 className="font-outfit text-3xl font-extrabold mb-4">{negocio?.name || "Tu Negocio"}</h3>
              <p className="text-gray-400 font-inter text-sm mb-8 leading-relaxed max-w-sm">
                Hacemos las cosas simples, rápidas y con la mejor calidad. Contactanos para saber más sobre cómo podemos ayudarte.
              </p>
              <div className="flex gap-4">
                {negocio?.instagram && (
                  <a href={`https://instagram.com/${negocio.instagram.replace('@','')}`} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-all text-gray-400">
                    IG
                  </a>
                )}
                {negocio?.whatsapp && (
                  <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-all text-gray-400">
                    WA
                  </a>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="lg:col-span-4">
              <h4 className="font-outfit font-bold text-lg mb-6">Información de Contacto</h4>
              <ul className="space-y-4 font-inter text-sm text-gray-400">
                {negocio?.phone && (
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent)]">📞</span> {negocio.phone}
                  </li>
                )}
                {negocio?.email && (
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent)]">✉️</span> {negocio.email}
                  </li>
                )}
                {negocio?.address && (
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--accent)]">📍</span> {negocio.address}
                  </li>
                )}
              </ul>
            </div>

            {/* Hours / Map */}
            <div className="lg:col-span-4">
              <h4 className="font-outfit font-bold text-lg mb-6">Horarios</h4>
              <div className="text-sm text-gray-400 space-y-2 mb-6">
                 {layoutConfig.hours ? (
                  Object.entries(layoutConfig.hours).map(([day, data]: [string, any]) => (
                    <div key={day} className="flex justify-between border-b border-white/5 pb-2">
                      <span className="capitalize">{day}</span>
                      <span>{data.open ? `${data.from} - ${data.to}` : 'Cerrado'}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between border-b border-white/5 pb-2"><span>Lunes a Viernes</span><span className="text-white font-medium">09:00 - 18:00</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-2"><span>Sábados</span><span className="text-white font-medium">10:00 - 14:00</span></div>
                  </>
                )}
              </div>
              <OpenNowBadge hours={layoutConfig.hours} />
            </div>

          </div>

          {layoutConfig.mapUrl && (
            <div className="max-w-7xl mx-auto h-48 rounded-2xl overflow-hidden mb-12 relative z-10 border border-white/10 opacity-80 hover:opacity-100 transition-opacity">
              <iframe src={layoutConfig.mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
            </div>
          )}

          <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10 text-xs text-gray-500 font-inter">
            <p>© {new Date().getFullYear()} {negocio?.name || "Tu Negocio"}. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos</a>
            </div>
          </div>
        </footer>

        {/* ── MOBILE FAB ── */}
        <div className="md:hidden fixed bottom-6 inset-x-6 z-40">
          <button 
            onClick={() => handleOpenBooking()}
            className="btn-primary w-full font-inter font-bold text-[15px] py-4 rounded-2xl shadow-2xl shadow-[var(--accent-glow)] flex items-center justify-center gap-2"
          >
            Agendar Ahora
          </button>
        </div>

        {/* ── MODALS ── */}
        <BookingModal 
          isOpen={bookingOpen} 
          onClose={() => setBookingOpen(false)} 
          businessId={businessId || negocio?.id || "demo"} 
          services={serviceNames}
          theme="light"
          title="Agenda tu cita"
          preselectedService={preselectedService}
          variant="general"
          primaryColor={accent}
        />

      </div>
    </>
  );
}