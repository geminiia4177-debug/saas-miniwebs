"use client";

import React, { useState, useEffect } from "react";
import { Playfair_Display, Cormorant_Garamond, DM_Sans } from "next/font/google";
import BookingModal from "../ui/BookingModal";
import OpenNowBadge from "../ui/OpenNowBadge";
import VideoSection from "../ui/VideoSection";
import { formatSocialUrl } from "@/components/landings/biolinks/utils";

const fontPlayfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "600", "700"],
  variable: "--font-spa-playfair",
  display: "swap",
});

const fontCormorant = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "600"],
  variable: "--font-spa-cormorant",
  display: "swap",
});

const fontDMSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-spa-dmsans",
  display: "swap",
});

// ─── SVG ICONS ───
function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// ─── STRICT TYPES ───
export interface SpaService {
  id?: string;
  nombre?: string;
  name?: string;
  descripcion?: string;
  precio?: string | number;
  duracion?: number | string;
  emoji?: string;
  imageUrl?: string;
}

export interface SpaTestimonio {
  nombre: string;
  texto: string;
  servicio?: string;
}

export default function EsteticaTemplate(props: { negocio?: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, businessId, media = [] } = props;
  const layoutConfig = negocio?.layoutConfig || {};
  
  const accent = negocio?.accentColor || negocio?.primaryColor || "#C8956C"; // Terracota cálido
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const galleryImages = media.filter((m: any) => m.type === "image");
  const serviciosConfig: SpaService[] = layoutConfig.esteticaServices || layoutConfig.servicios || [
    { id: "1", nombre: "Ritual Anti-Age Cellular", descripcion: "Renovación celular profunda, masaje miofascial y mascarilla de oro coloidal 24k.", precio: "$15.000", duracion: 60, emoji: "✨" },
    { id: "2", nombre: "Masaje Botánico Calmante", descripcion: "Inmersión olfativa con aceites esenciales puros de lavanda silvestre y piedras volcánicas.", precio: "$12.000", duracion: 50, emoji: "🌿" },
    { id: "3", nombre: "Limpieza Facial Détox", descripcion: "Extracción no invasiva, exfoliación con peeling ultrasónico e hidratación molecular intensa.", precio: "$9.500", duracion: 45, emoji: "🫧" },
  ];
  
  const testimonios: SpaTestimonio[] = layoutConfig.testimonios || [
    { nombre: "Laura Valenzuela", texto: "El mejor santuario de la ciudad. La atención es impecable y la sensación de serenidad se percibe desde el primer segundo.", servicio: "RITUAL ANTI-AGE" },
    { nombre: "Sofía Medina", texto: "Un oasis de calma y desconexión. Salí renovada por completo y con la piel increíblemente luminosa.", servicio: "MASAJE BOTÁNICO" },
    { nombre: "Camila Rossi", texto: "Profesionales de primer nivel y cosmética botánica pura. Una experiencia estética superior en todos los sentidos.", servicio: "FACIAL DÉTOX" },
  ];

  const serviceNames = serviciosConfig.map((s) => s.nombre || s.name || "Servicio");

  // Fallbacks
  const heroImageUrl = negocio?.bannerUrl || layoutConfig.heroImageUrl || "";
  const aboutImage = layoutConfig.aboutImage || (galleryImages[0] ? galleryImages[0].url : "");
  const quoteImage = layoutConfig.quoteImage || (galleryImages[1] ? galleryImages[1].url : heroImageUrl);
  const nameLines = (negocio?.name ?? "Atelier Botánico").split(" ");
  const line1 = nameLines.slice(0, Math.ceil(nameLines.length / 2)).join(" ");
  const line2 = nameLines.slice(Math.ceil(nameLines.length / 2)).join(" ");

  const handleOpenBooking = (service?: string) => {
    setPreselectedService(service || "");
    setBookingOpen(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div 
      className={`${fontPlayfair.variable} ${fontCormorant.variable} ${fontDMSans.variable} min-h-screen bg-[#FAF7F4] text-[#1C1410] font-['DM_Sans'] relative overflow-x-hidden selection:bg-[#C8956C] selection:text-white pb-28 md:pb-0`} 
      style={{ "--accent": accent, "--borde": "rgba(200, 149, 108, 0.15)" } as React.CSSProperties}
    >
      {/* ── SUBTLE FILM GRAIN ── */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── NAV ── */}
      <nav 
        aria-label="Navegación principal"
        className={`fixed top-0 inset-x-0 z-40 px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#FAF7F4]/90 backdrop-blur-xl border-b border-[var(--borde)] shadow-sm' 
            : 'bg-transparent'
        }`}
      >
        <span className={`font-['Playfair_Display'] text-2xl italic tracking-wide ${isScrolled ? 'text-[#1C1410]' : 'text-white'}`}>
          {negocio?.name ?? "Belle Studio"}
        </span>

        <ul className={`hidden md:flex gap-10 list-none text-[12px] uppercase tracking-[0.2em] font-medium ${isScrolled ? 'text-[#8B7355]' : 'text-white/80'}`}>
          <li>
            <button type="button" onClick={() => scrollToSection("servicios")} className="hover:text-[var(--accent)] transition-colors">
              Rituales
            </button>
          </li>
          <li>
            <button type="button" onClick={() => scrollToSection("nosotras")} className="hover:text-[var(--accent)] transition-colors">
              El Refugio
            </button>
          </li>
          {galleryImages.length > 0 && (
            <li>
              <button type="button" onClick={() => scrollToSection("galeria")} className="hover:text-[var(--accent)] transition-colors">
                Espacios
              </button>
            </li>
          )}
          <li>
            <button type="button" onClick={() => scrollToSection("contacto")} className="hover:text-[var(--accent)] transition-colors">
              Contacto
            </button>
          </li>
        </ul>

        <button 
          type="button"
          onClick={() => handleOpenBooking()}
          className={`text-[11px] font-medium tracking-[0.18em] uppercase px-6 py-2.5 rounded-full transition-all duration-300 ${
            isScrolled 
              ? 'border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white' 
              : 'border border-white/60 text-white hover:bg-white hover:text-[#1C1410]'
          }`}
        >
          Reservar Cita
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[100dvh] overflow-hidden flex items-end pb-20 px-6 md:px-16">
        <div className="absolute inset-0 z-0 bg-[#2D1B12] overflow-hidden">
          {heroImageUrl ? (
            <img 
              src={heroImageUrl} 
              alt="Atmósfera del spa" 
              className="w-full h-full object-cover opacity-90 scale-100 hover:scale-105 transition-transform duration-1000 ease-out" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#2D1B12] via-[#5C3526] to-[#8B4E3A]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-5xl">
          <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-6">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/95 font-medium">✦ Ritual de Belleza & Calma</span>
          </div>
          
          <h1 className="font-['Playfair_Display'] leading-[1.05] tracking-tight mb-6 text-[clamp(3.5rem,7vw,6.5rem)] text-white">
            <span className="block">{line1}</span>
            {line2 && <span className="block italic text-[var(--accent)]">{line2}</span>}
          </h1>
          
          <p className="font-['DM_Sans'] font-light text-white/80 text-base md:text-lg max-w-lg mb-10 leading-relaxed">
            {negocio?.tagline || "Un santuario pensado para desacelerar, reconectar y revitalizar cuerpo y alma a través de la cosmética botánica."}
          </p>

          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <button 
              type="button"
              onClick={() => handleOpenBooking()}
              className="bg-[var(--accent)] text-[#1C1410] font-semibold uppercase tracking-[0.16em] text-[11px] px-8 py-4 rounded-full hover:brightness-110 active:scale-95 transition-all shadow-[0_8px_30px_rgba(200,149,108,0.3)]"
            >
              Reservar Turno
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection("servicios")} 
              className="text-white flex items-center gap-2 font-medium text-[13px] hover:text-[var(--accent)] transition-colors"
            >
              Conocer Rituales <span className="text-base" aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 right-12 flex flex-col items-center gap-2 text-white/40 hidden md:flex pointer-events-none select-none">
          <span className="text-[9px] uppercase tracking-[0.25em] rotate-90 origin-bottom translate-y-[-16px]">Explorar</span>
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-white/40" />
        </div>
      </section>

      {/* ── NOSOTRAS ── */}
      <section id="nosotras" className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh] border-b border-[var(--borde)]">
        <div className="bg-[#1C1410] text-white px-8 md:px-16 py-20 flex flex-col justify-center">
          <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <p className="font-['DM_Sans'] text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-4">✦ Filosofía Atelier</p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl leading-snug mb-6 text-white">
              {layoutConfig.yearsInBusiness ? `Más de ${layoutConfig.yearsInBusiness} años perfeccionando el arte del cuidado personal` : 'El lujo del tiempo dedicado a uno mismo'}
            </h2>
            <p className="font-['DM_Sans'] font-light text-white/70 text-[15px] leading-relaxed mb-8">
              {layoutConfig.aboutText || "Entendemos la belleza como una consecuencia natural de la calma interior y el equilibrio. Cada uno de nuestros tratamientos fusiona técnicas milenarias con activos botánicos orgánicos de alta eficacia para ofrecerte una pausa transformadora."}
            </p>
            {layoutConfig.founderName && (
              <div className="pt-4 border-t border-white/10">
                <p className="font-['Cormorant_Garamond'] italic text-2xl text-[var(--accent)]">{layoutConfig.founderName}</p>
                <p className="font-['DM_Sans'] text-[10px] uppercase tracking-widest text-white/40 mt-0.5">Directora & Fundadora</p>
              </div>
            )}
          </div>
        </div>
        {aboutImage && (
          <div className="h-[40vh] lg:h-auto overflow-hidden">
            <img src={aboutImage} alt="Espacio y cabina del atelier" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}
      </section>

      {/* ── RITUALES Y SERVICIOS ── */}
      <section id="servicios" className="py-28 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-['DM_Sans'] text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-3">Carta de Tratamientos</p>
          <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl text-[#1C1410]">Nuestros Rituales</h2>
          <div className="w-24 h-px bg-[var(--accent)]/40 mx-auto mt-6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviciosConfig.map((srv, i) => (
            <div 
              key={srv.id || i} 
              className="group relative overflow-hidden bg-white border border-[var(--borde)] rounded-3xl hover:shadow-[0_20px_50px_rgba(28,20,16,0.08)] transition-all duration-500 flex flex-col"
            >
              <div className="h-52 relative overflow-hidden bg-gradient-to-br from-[#F0EBE6] to-[#FAF7F4] flex items-center justify-center">
                {srv.imageUrl ? (
                  <>
                    <img 
                      src={srv.imageUrl} 
                      alt={srv.nombre || srv.name || "Servicio"} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      loading="lazy" 
                    />
                    <div className="absolute inset-0 bg-[var(--accent)]/0 group-hover:bg-[var(--accent)]/15 transition-colors duration-500" />
                  </>
                ) : (
                  <span className="text-6xl opacity-40 group-hover:scale-110 transition-transform duration-500">
                    {srv.emoji || "✨"}
                  </span>
                )}
              </div>
              
              <div className="p-7 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-['Playfair_Display'] text-xl font-semibold mb-2.5 text-[#1C1410]">
                    {srv.nombre || srv.name}
                  </h3>
                  <p className="font-['DM_Sans'] text-[13px] text-[#8B7355] line-clamp-2 leading-relaxed mb-6">
                    {srv.descripcion}
                  </p>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-[var(--borde)] mt-auto">
                  <div className="flex items-center gap-3">
                    <span className="font-['DM_Sans'] text-[11px] text-[#8B7355] font-medium">⏱ {srv.duracion || 60} min</span>
                    <span className="font-['Cormorant_Garamond'] text-2xl font-bold text-[var(--accent)]">
                      {typeof srv.precio === "number" ? `$${srv.precio}` : (srv.precio || "Consultar")}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleOpenBooking(srv.nombre || srv.name)}
                    className="font-['DM_Sans'] text-[11px] uppercase tracking-widest font-semibold text-[var(--accent)] hover:text-[#1C1410] transition-colors py-1 px-2"
                  >
                    Reservar →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARALLAX QUOTE ── */}
      <section 
        className="relative min-h-[380px] flex items-center justify-center px-6 py-24 bg-cover bg-center"
        style={{ backgroundImage: `url(${quoteImage})` }}
      >
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px]" />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <p className="font-['Playfair_Display'] italic text-3xl md:text-5xl leading-snug text-white mb-6">
            "{layoutConfig.quoteText || 'El lujo verdadero es el tiempo consciente que te dedicas a vos misma.'}"
          </p>
          <p className="font-['DM_Sans'] text-[11px] uppercase tracking-[0.25em] text-white/60">
            — {negocio?.name || "Belle Studio"}
          </p>
        </div>
      </section>

      {/* ── GALERÍA ── */}
      {galleryImages.length > 0 && (
        <section id="galeria" className="py-28 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-['DM_Sans'] text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-3">La Casa</p>
            <h2 className="font-['Playfair_Display'] text-4xl text-[#1C1410]">Nuestros Espacios</h2>
            <div className="w-20 h-px bg-[var(--accent)]/40 mx-auto mt-6" />
          </div>

          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {galleryImages.map((img: any, i: number) => (
              <div 
                key={img.url || i} 
                className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-2xl border border-[var(--borde)]" 
                onClick={() => setLightboxImage(img.url)}
              >
                <img 
                  src={img.url} 
                  alt={`Espacio ${i + 1}`} 
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  loading="lazy" 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-['DM_Sans'] text-xs tracking-widest uppercase font-medium bg-black/40 backdrop-blur-sm px-3.5 py-1.5 rounded-full">
                    Ampliar
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── TESTIMONIOS ── */}
      {testimonios && testimonios.length > 0 && (
        <section className="py-24 bg-[#F0EBE6] border-y border-[var(--borde)]">
          <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
            <p className="font-['DM_Sans'] text-[10px] uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Comentarios</p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#1C1410]">La Experiencia de Quienes Nos Eligen</h2>
          </div>
          
          <div className="flex gap-6 px-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory max-w-7xl mx-auto pb-6">
            {testimonios.map((t, i) => (
              <div 
                key={i} 
                className="min-w-[300px] md:min-w-[380px] bg-white border border-[var(--borde)] rounded-3xl p-8 snap-center flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex gap-1 text-[var(--accent)] mb-5 text-sm" aria-label="5 de 5 estrellas">
                    ★★★★★
                  </div>
                  <p className="font-['Cormorant_Garamond'] text-lg italic text-[#1C1410] leading-relaxed mb-8">
                    "{t.texto}"
                  </p>
                </div>
                <div className="flex items-center gap-3.5 pt-4 border-t border-[var(--borde)]">
                  <div className="w-10 h-10 bg-[var(--accent)] text-white flex items-center justify-center font-['Playfair_Display'] italic text-base rounded-full shadow-sm">
                    {t.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="font-['DM_Sans'] text-[13px] font-semibold text-[#1C1410]">{t.nombre}</p>
                    {t.servicio && (
                      <p className="font-['DM_Sans'] text-[10px] uppercase tracking-wider text-[#8B7355]">{t.servicio}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── VIDEO SECTION ── */}
      <VideoSection
        videoUrl={layoutConfig.videoUrl || (props.sections?.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
        accentColor={accent}
        theme="light"
      />

      {/* ── FOOTER / CONTACTO ── */}
      <footer id="contacto" className="bg-[#1C1410] text-white pt-24 pb-28 md:pb-16 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
          <div>
            <span className="font-['Playfair_Display'] text-3xl italic tracking-wide text-[var(--accent)] mb-6 block">
              {negocio?.name ?? "Belle Studio"}
            </span>
            <p className="font-['DM_Sans'] font-light text-white/70 text-[14px] leading-relaxed max-w-xs mb-8">
              {negocio?.tagline || "Tu refugio de bienestar y belleza. Donde el tiempo se detiene para consentirte."}
            </p>
            
            <div className="flex gap-3">
              {layoutConfig.instagram && (
                <a 
                  href={formatSocialUrl("instagram", layoutConfig.instagram)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-[#1C1410] transition-all rounded-full"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
              )}
              {negocio?.whatsapp && (
                <a 
                  href={`https://wa.me/${negocio.whatsapp.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-[#25D366] hover:border-[#25D366] hover:text-white transition-all rounded-full"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon />
                </a>
              )}
            </div>
          </div>
          
          <div>
            <p className="font-['DM_Sans'] text-[11px] uppercase tracking-widest text-white/50 mb-6">Horarios de Atención</p>
            <div className="space-y-3 font-['DM_Sans'] font-light text-[14px] mb-6">
              {layoutConfig.hours ? (
                Object.entries(layoutConfig.hours).map(([day, data]: [string, any]) => {
                  if (!data?.open) return null;
                  return (
                    <div key={day} className="flex justify-between border-b border-white/10 pb-2">
                      <span className="capitalize text-white/80">{day}</span>
                      <span className="text-white font-medium">{data.from} - {data.to}</span>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span>Lunes a Viernes</span><span>09:00 - 19:00</span></div>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span>Sábados</span><span>10:00 - 14:00</span></div>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span>Domingos</span><span>Cerrado</span></div>
                </>
              )}
            </div>
            <div>
              <OpenNowBadge hours={layoutConfig.hours} />
            </div>
          </div>

          <div>
            <p className="font-['DM_Sans'] text-[11px] uppercase tracking-widest text-white/50 mb-6">Ubicación y Contacto</p>
            <div className="space-y-3.5 font-['DM_Sans'] font-light text-[14px]">
              {negocio?.address && <p className="flex items-start gap-2.5"><span className="text-[var(--accent)]">📍</span> {negocio.address}</p>}
              {negocio?.phone && <p className="flex items-center gap-2.5"><span className="text-[var(--accent)]">📞</span> {negocio.phone}</p>}
              {negocio?.email && <p className="flex items-center gap-2.5"><span className="text-[var(--accent)]">✉️</span> {negocio.email}</p>}
            </div>
          </div>
        </div>
        
        {layoutConfig.mapUrl && (
          <div className="max-w-7xl mx-auto h-56 mb-16 rounded-3xl overflow-hidden border border-white/10 filter grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <iframe 
              src={layoutConfig.mapUrl} 
              title="Ubicación del spa"
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="font-['DM_Sans'] text-[11px] text-white/50 uppercase tracking-widest">
            © {new Date().getFullYear()} {negocio?.name || "Belle Studio"}. Todos los derechos reservados.
          </p>
          <p className="font-['Cormorant_Garamond'] italic text-sm text-[var(--accent)]">
            Diseñado con calma y dedicación.
          </p>
        </div>
      </footer>

      {/* ── MOBILE STICKY FAB ── */}
      <div 
        className="md:hidden fixed inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button 
          type="button"
          onClick={() => handleOpenBooking()}
          className="pointer-events-auto bg-[var(--accent)] text-[#1C1410] font-['DM_Sans'] font-semibold uppercase tracking-[0.16em] text-[11px] px-8 py-3.5 rounded-full shadow-[0_8px_30px_rgba(200,149,108,0.4)] whitespace-nowrap active:scale-95 transition-transform"
        >
          Reservar Turno
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
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" 
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de imagen"
        >
          <button 
            type="button"
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors p-2"
            aria-label="Cerrar modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img src={lightboxImage} className="max-w-full max-h-[90vh] object-contain rounded-2xl" alt="Vista ampliada" />
        </div>
      )}
    </div>
  );
}