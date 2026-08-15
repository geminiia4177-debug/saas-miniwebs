"use client";

import React, { useState, useEffect } from "react";
import BookingModal from "../ui/BookingModal";
import OpenNowBadge from "../ui/OpenNowBadge";

export default function EsteticaTemplate(props: { negocio?: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, businessId, media = [] } = props;
  const layoutConfig = negocio?.layoutConfig || {};
  
  const accent = negocio?.accentColor || negocio?.primaryColor || "#C8956C"; // Terracota suave
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const galleryImages = media.filter((m: any) => m.type === "image");
  const serviciosConfig = layoutConfig.esteticaServices || layoutConfig.servicios || [
    { id: "1", nombre: "Ritual Anti-Age", descripcion: "Renovación celular profunda y mascarilla de oro", precio: "$15.000", duracion: 60, emoji: "✨" },
    { id: "2", nombre: "Masaje Relajante", descripcion: "Con aceites esenciales puros y piedras calientes", precio: "$12.000", duracion: 50, emoji: "🌿" },
    { id: "3", nombre: "Limpieza Facial Profunda", descripcion: "Extracción, peeling ultrasónico y alta frecuencia", precio: "$9.500", duracion: 45, emoji: "🫧" },
  ];
  
  const testimonios = layoutConfig.testimonios || [
    { nombre: "Laura V.", texto: "El mejor lugar de la ciudad. La atención es impecable y los resultados se notan desde la primera sesión.", servicio: "RITUAL ANTI-AGE" },
    { nombre: "Sofía M.", texto: "Un oasis de tranquilidad. Entrás estresada y salís renovada por completo.", servicio: "MASAJE RELAJANTE" },
    { nombre: "Camila R.", texto: "Excelentes profesionales y productos de primera línea. Mi piel nunca se vio tan luminosa.", servicio: "LIMPIEZA FACIAL" },
  ];

  const serviceNames = serviciosConfig.map((s: any) => s.nombre || s.name);

  // Fallbacks
  const heroImageUrl = negocio?.bannerUrl || layoutConfig.heroImageUrl || "";
  const aboutImage = layoutConfig.aboutImage || (galleryImages[0] ? galleryImages[0].url : "");
  const quoteImage = layoutConfig.quoteImage || (galleryImages[1] ? galleryImages[1].url : heroImageUrl);
  const nameLines = (negocio?.name ?? "Belle Studio").split(" ");
  const line1 = nameLines.slice(0, Math.ceil(nameLines.length / 2)).join(" ");
  const line2 = nameLines.slice(Math.ceil(nameLines.length / 2)).join(" ");

  const handleOpenBooking = (service?: string) => {
    setPreselectedService(service || "");
    setBookingOpen(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        
        :root {
          --borde: rgba(200, 149, 108, 0.15);
        }

        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-cormorant { font-family: 'Cormorant Garamond', serif; }
        .font-dm { font-family: 'DM Sans', sans-serif; }
        
        .grain-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        .divider-ornament {
          display: flex;
          align-items: center;
          text-align: center;
          color: var(--borde);
        }
        .divider-ornament::before, .divider-ornament::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--borde);
        }
        .divider-ornament::before { margin-right: .5em; }
        .divider-ornament::after { margin-left: .5em; }

        .parallax-bg {
          background-size: cover;
          background-position: center;
        }
        @supports (animation-timeline: scroll()) {
          .parallax-bg {
            animation: bg-parallax linear;
            animation-timeline: view();
            animation-range: entry 0% exit 100%;
          }
        }
        @keyframes bg-parallax {
          from { background-position: center 0%; }
          to { background-position: center 100%; }
        }

        .hero-pattern {
          background-image: radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.04;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @keyframes kenBurns {
          from { transform: scale(1.05); }
          to { transform: scale(1); }
        }
        .animate-ken-burns {
          animation: kenBurns 8s ease-out forwards;
        }

        .scroll-carousel {
          overflow-x: auto;
          scrollbar-width: none;
        }
        .scroll-carousel::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="min-h-screen bg-[#FAF7F4] text-[#1C1410] font-dm relative overflow-x-hidden selection:bg-[#C8956C] selection:text-white" style={{ "--accent": accent } as React.CSSProperties}>
        <div className="grain-overlay" />

        {/* ── NAV ── */}
        <nav className={`fixed top-0 inset-x-0 z-40 px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-300 ${isScrolled ? 'bg-[#FAF7F4]/90 backdrop-blur-md border-b border-[var(--borde)]' : 'bg-transparent'}`}>
          <span className={`font-playfair text-2xl italic tracking-wide ${isScrolled ? 'text-[#1C1410]' : 'text-white'}`}>
            {negocio?.name ?? "Belle Studio"}
          </span>

          <ul className={`hidden md:flex gap-10 list-none text-[13px] uppercase tracking-widest ${isScrolled ? 'text-[#8B7355]' : 'text-white/80'}`}>
            <li><a href="#servicios" className="hover:text-[var(--accent)] transition-colors">Servicios</a></li>
            <li><a href="#nosotras" className="hover:text-[var(--accent)] transition-colors">Nosotras</a></li>
            {galleryImages.length > 0 && <li><a href="#galeria" className="hover:text-[var(--accent)] transition-colors">Galería</a></li>}
            <li><a href="#contacto" className="hover:text-[var(--accent)] transition-colors">Contacto</a></li>
          </ul>

          <button 
            onClick={() => handleOpenBooking()}
            className={`text-[11px] font-medium tracking-[0.15em] uppercase px-6 py-2.5 transition-all duration-300 ${isScrolled ? 'border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white' : 'border border-white/50 text-white hover:bg-white hover:text-[#1C1410]'}`}
          >
            Reservar
          </button>
        </nav>

        {/* ── HERO ── */}
        <section className="relative min-h-[100svh] overflow-hidden flex items-end pb-16">
          <div className="absolute inset-0 z-0 bg-[#2D1B12] overflow-hidden">
            {heroImageUrl ? (
              <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover animate-ken-burns opacity-90" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#2D1B12] via-[#5C3526] to-[#8B4E3A]" />
            )}
            <div className="absolute inset-0 hero-pattern" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>

          <div className="relative z-10 px-8 md:px-16 w-full max-w-5xl">
            <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 mb-6">
              <span className="text-[10px] uppercase tracking-[0.25em] text-white">✦ Estética & Bienestar</span>
            </div>
            
            <h1 className="font-playfair leading-[1.1] tracking-tight mb-6 animate-slide-up text-[clamp(4rem,8vw,7rem)]">
              <span className="block text-white">{line1}</span>
              {line2 && <span className="block italic text-[var(--accent)]">{line2}</span>}
            </h1>
            
            <p className="font-dm font-light text-white/80 text-base md:text-lg max-w-md mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {negocio?.tagline || "Tu negocio premium en un solo lugar. Relájate y disfruta de la experiencia."}
            </p>

            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button 
                onClick={() => handleOpenBooking()}
                className="bg-[var(--accent)] text-[#1C1410] font-medium uppercase tracking-widest text-[11px] px-8 py-4 hover:brightness-110 transition-all"
              >
                Reservar turno
              </button>
              <a href="#servicios" className="text-white flex items-center gap-2 font-medium text-[13px] hover:text-[var(--accent)] transition-colors">
                Ver servicios <span className="text-lg">→</span>
              </a>
            </div>
          </div>

          <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2 text-white/40 hidden md:flex">
            <span className="text-[10px] uppercase tracking-widest rotate-90 origin-bottom translate-y-[-20px]">Deslizá</span>
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-white/50" />
          </div>
        </section>

        {/* ── NOSOTRAS (Intro) ── */}
        <section id="nosotras" className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh]">
          <div className="bg-[#1C1410] text-white px-12 py-16 md:py-24 flex flex-col justify-center">
            <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto">
              <p className="font-dm text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-6">✦ Nuestra historia</p>
              <h2 className="font-playfair text-3xl md:text-[42px] leading-tight mb-8">
                {layoutConfig.yeMXNInBusiness ? `Más de ${layoutConfig.yeMXNInBusiness} años cuidando tu bienestar` : 'Cuidando tu bienestar desde el primer día'}
              </h2>
              <p className="font-dm font-light text-white/70 text-[15px] leading-relaxed mb-10">
                {layoutConfig.aboutText || "Creemos que el verdadero lujo es el tiempo que te dedicas a ti misma. Hemos creado un espacio pensado para que te desconectes del mundo y te reconectes con tu esencia, con tratamientos personalizados y productos de la más alta calidad."}
              </p>
              {layoutConfig.founderName && (
                <div>
                  <p className="font-cormorant italic text-[22px]">{layoutConfig.founderName}</p>
                  <p className="font-dm text-[11px] uppercase tracking-widest text-white/40 mt-1">Fundadora</p>
                </div>
              )}
            </div>
          </div>
          {aboutImage && (
            <div className="h-[40vh] lg:h-auto">
              <img src={aboutImage} alt="Sobre nosotras" className="w-full h-full object-cover" />
            </div>
          )}
        </section>

        {/* ── SERVICIOS ── */}
        <section id="servicios" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-dm text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-4">Lo que hacemos</p>
            <h2 className="font-playfair text-4xl md:text-5xl text-[#1C1410]">Nuestros Rituales</h2>
            <div className="divider-ornament my-6 text-[var(--accent)] w-32 mx-auto">·</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviciosConfig.map((srv: any, i: number) => (
              <div key={i} className="group relative overflow-hidden bg-white border border-[var(--borde)] hover:shadow-2xl transition-all duration-500">
                <div className="h-48 relative overflow-hidden bg-gradient-to-br from-[#F0EBE6] to-[#FAF7F4] flex items-center justify-center">
                  {srv.imageUrl ? (
                    <>
                      <img src={srv.imageUrl} alt={srv.nombre || srv.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-[var(--accent)]/0 group-hover:bg-[var(--accent)]/20 transition-colors duration-500" />
                    </>
                  ) : (
                    <span className="text-6xl opacity-50 group-hover:scale-110 transition-transform duration-500">{srv.emoji || "✨"}</span>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="font-playfair text-xl font-semibold mb-2 text-[#1C1410]">{srv.nombre || srv.name}</h3>
                  <p className="font-dm text-[13px] text-[#8B7355] line-clamp-2 leading-relaxed mb-6 h-[40px]">{srv.descripcion}</p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-[var(--borde)]">
                    <div className="flex items-center gap-3">
                      <span className="font-dm text-[11px] text-[#8B7355]">⏱ {srv.duracion || 60} min</span>
                      <span className="font-cormorant text-[22px] font-semibold text-[var(--accent)]">{srv.precio || "Consultar"}</span>
                    </div>
                    <button 
                      onClick={() => handleOpenBooking(srv.nombre || srv.name)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-dm text-[11px] uppercase tracking-widest font-medium text-[var(--accent)] hover:text-[#1C1410]"
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PARALLAX QUOTE ── */}
        <section 
          className="parallax-bg relative min-h-[350px] flex items-center justify-center px-6 py-20"
          style={{ backgroundImage: `url(${quoteImage})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <p className="font-playfair italic text-3xl md:text-5xl leading-snug text-white mb-6">
              "{layoutConfig.quoteText || 'El lujo verdadero es el tiempo que te dedicas a vos misma.'}"
            </p>
            <p className="font-dm text-[11px] uppercase tracking-[0.2em] text-white/60">
              — {negocio?.name || "Belle Studio"}
            </p>
          </div>
        </section>

        {/* ── GALERÍA ── */}
        {galleryImages.length > 0 && (
          <section id="galeria" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="font-dm text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-4">El Espacio</p>
              <h2 className="font-playfair text-4xl text-[#1C1410]">Nuestra Casa</h2>
            </div>

            <div className="columns-2 md:columns-3 gap-3 space-y-3">
              {galleryImages.map((img: any, i: number) => (
                <div key={i} className="break-inside-avoid relative group cursor-pointer overflow-hidden" onClick={() => setLightboxImage(img.url)}>
                  <img src={img.url} alt={`Galería ${i}`} className="w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-dm text-xs tracking-widest uppercase">Ver</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── TESTIMONIOS ── */}
        {testimonios && testimonios.length > 0 && (
          <section className="py-24 bg-[#F0EBE6] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
              <h2 className="font-playfair text-3xl md:text-4xl text-[#1C1410]">La experiencia</h2>
            </div>
            
            <div className="flex gap-6 px-6 scroll-carousel snap-x snap-mandatory max-w-7xl mx-auto pb-8">
              {testimonios.map((t: any, i: number) => (
                <div key={i} className="min-w-[300px] md:min-w-[400px] bg-white border border-[var(--borde)] p-8 snap-center">
                  <div className="flex gap-1 text-[var(--accent)] mb-6 text-xl">★★★★★</div>
                  <p className="font-cormorant text-lg italic text-[#1C1410] leading-relaxed mb-8">"{t.texto}"</p>
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="w-10 h-10 bg-[var(--accent)] text-white flex items-center justify-center font-playfair italic text-lg rounded-full">
                      {t.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-dm text-[13px] font-semibold text-[#1C1410]">{t.nombre}</p>
                      <p className="font-dm text-[10px] uppercase tracking-wider text-[#8B7355] mt-1">{t.servicio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FOOTER / CONTACTO ── */}
        <footer id="contacto" className="bg-[#1C1410] text-white py-20 px-6 md:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
            <div>
              <span className="font-playfair text-3xl italic tracking-wide text-[var(--accent)] mb-6 block">
                {negocio?.name ?? "Belle Studio"}
              </span>
              <p className="font-dm font-light text-white/60 text-[14px] leading-relaxed max-w-xs">
                {negocio?.tagline || "Tu refugio de bienestar y belleza. Donde el tiempo se detiene para cuidarte."}
              </p>
              
              <div className="mt-8 flex gap-4">
                {layoutConfig.instagram && <a href={`https://instagram.com/${layoutConfig.instagram.replace('@','')}`} className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-colors rounded-full"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>}
                {negocio?.whatsapp && <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-colors rounded-full"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.88-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg></a>}
              </div>
            </div>
            
            <div>
              <p className="font-dm text-[11px] uppercase tracking-widest text-white/50 mb-6">Horarios</p>
              <div className="space-y-3 font-dm font-light text-[14px]">
                {layoutConfig.hours ? (
                  Object.entries(layoutConfig.hours).map(([day, data]: [string, any]) => (
                    <div key={day} className="flex justify-between border-b border-white/10 pb-2">
                      <span className="capitalize">{day}</span>
                      <span>{data.open ? `${data.from} - ${data.to}` : 'Cerrado'}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between border-b border-white/10 pb-2"><span>Lunes a Viernes</span><span>09:00 - 19:00</span></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><span>Sábados</span><span>10:00 - 14:00</span></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><span>Domingos</span><span>Cerrado</span></div>
                  </>
                )}
              </div>
              <div className="mt-6">
                 <OpenNowBadge hours={layoutConfig.hours} />
              </div>
            </div>

            <div>
              <p className="font-dm text-[11px] uppercase tracking-widest text-white/50 mb-6">Contacto</p>
              <div className="space-y-4 font-dm font-light text-[14px]">
                {negocio?.address && <p className="flex items-start gap-3"><span className="text-[var(--accent)]">📍</span> {negocio.address}</p>}
                {negocio?.phone && <p className="flex items-center gap-3"><span className="text-[var(--accent)]">📞</span> {negocio.phone}</p>}
                {negocio?.email && <p className="flex items-center gap-3"><span className="text-[var(--accent)]">✉️</span> {negocio.email}</p>}
              </div>
            </div>
          </div>
          
          {layoutConfig.mapUrl && (
            <div className="max-w-7xl mx-auto h-64 mb-16 border border-white/10 filter grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <iframe src={layoutConfig.mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
            </div>
          )}

          <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-dm text-[11px] text-white/40 uppercase tracking-widest text-center md:text-left">
              © {new Date().getFullYear()} {negocio?.name}. Todos los derechos reservados.
            </p>
            <p className="font-dm text-[11px] text-white/40 uppercase tracking-widest text-center md:text-right">
              Desarrollado con Antigravity
            </p>
          </div>
        </footer>

        {/* ── MOBILE FAB ── */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button 
            onClick={() => handleOpenBooking()}
            className="bg-[var(--accent)] text-[#1C1410] font-dm font-semibold uppercase tracking-widest text-[11px] px-8 py-3.5 rounded-full shadow-[0_8px_30px_rgba(200,149,108,0.4)] whitespace-nowrap"
          >
            Reservar turno
          </button>
        </div>

        {/* ── MODALS ── */}
        <BookingModal 
          isOpen={bookingOpen} 
          onClose={() => setBookingOpen(false)} 
          businessId={businessId || negocio?.id || "demo"} 
          services={serviceNames}
          theme="light"
          title="Reservá tu turno"
          preselectedService={preselectedService}
          primaryColor={accent}
          variant="estetica"
        />

        {lightboxImage && (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setLightboxImage(null)}>
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img src={lightboxImage} className="max-w-full max-h-[90vh] object-contain" alt="Vista ampliada" />
          </div>
        )}
      </div>
    </>
  );
}