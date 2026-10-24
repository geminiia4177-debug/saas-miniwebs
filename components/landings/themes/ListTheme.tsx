"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import { 
  Phone, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Star, 
  MapPin, 
  CheckCircle2,
  Calendar
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
import BookingForm from "@/app/[subdomain]/BookingForm";
import VideoSection from "@/components/ui/VideoSection";
import { formatSocialUrl } from "@/components/landings/biolinks/utils";

const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"], display: "swap" });
const inter = Inter({ subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap" });

interface ServiceItem {
  id?: string;
  name: string;
  price?: string | number;
  duration?: number;
  description?: string;
  imageUrl?: string;
  active?: boolean;
}

export default function ListTheme(props: {
  negocio: any;
  media?: any[];
  businessId?: string;
  sections?: any[];
}) {
  const { negocio, media = [], businessId, sections = [] } = props;
  const config = negocio?.layoutConfig || {};
  const primary = negocio?.primaryColor || "#0A0A0A";
  const secondary = negocio?.secondaryColor || "#6B6B6B";
  const accent = negocio?.accentColor || primary;
  const bgType = negocio?.backgroundType || "color";

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll for sticky mini-header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 180);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const items: ServiceItem[] = useMemo(() => {
    if (!negocio) return [];
    let rawList: any[] = [];
    if (negocio.type === "barberia") rawList = config.barberiaServices || [];
    else if (negocio.type === "estetica") rawList = config.esteticaServicios || [];
    else if (negocio.type === "clinica") rawList = config.clinicaEspecialidades || [];
    else if (negocio.type === "taller") rawList = config.tallerServices || [];
    else if (negocio.type === "restaurante" || negocio.type === "menu") {
      rawList = config.menuCategorias?.flatMap((c: any) => c.items || []) || [];
    } else {
      rawList = config.items || [];
    }
    return rawList.filter((s: any) => s && s.active !== false);
  }, [negocio, config]);

  const gallery = useMemo(() => {
    return media.filter((m: any) => m && m.type === "image") || [];
  }, [media]);

  const getBackgroundStyle = () => {
    if (bgType === "image" && negocio?.backgroundImageUrl) {
      return {
        backgroundImage: `url(${negocio.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    if (bgType === "gradient") {
      return {
        background: `linear-gradient(135deg, ${primary}12, ${secondary}18), #FDFCF8`,
      };
    }
    return { backgroundColor: "#FDFCF8" };
  };

  const businessName = negocio?.name || "Boutique & Estudio";
  const initialLetter = businessName.trim().charAt(0) || "B";

  const scrollToBooking = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`${inter.className} min-h-screen text-[#0A0A0A] relative overflow-x-hidden selection:bg-[#0A0A0A] selection:text-[#FDFCF8]`}
      style={{
        ...getBackgroundStyle(),
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(5rem, calc(4rem + env(safe-area-inset-bottom)))",
      }}
    >
      {/* ─── Micro Noise Texture Overlay ─── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* ─── Sticky Mini-Header (Scroll > 180px) ─── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b border-[#E8E6E1] bg-[#FDFCF8]/90 backdrop-blur-xl ${
          scrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {negocio?.logoUrl ? (
              <img
                src={negocio.logoUrl}
                alt={businessName}
                className="w-8 h-8 rounded-full object-cover border border-[#E8E6E1]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center text-xs font-bold">
                {initialLetter}
              </div>
            )}
            <span className="font-semibold text-sm truncate text-[#0A0A0A]">
              {businessName}
            </span>
          </div>

          <button
            onClick={scrollToBooking}
            className="px-4 py-1.5 rounded-full bg-[#0A0A0A] text-white text-xs font-semibold hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center gap-1.5"
          >
            <span>Reservar</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* ─── Main Content Container (Quiet Luxury Centered Column) ─── */}
      <main className="max-w-xl mx-auto px-4 pt-10 sm:pt-16 flex flex-col items-center relative z-10">
        
        {/* Avatar / Logo */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-[#E8E6E1] to-transparent opacity-60 blur-sm group-hover:opacity-100 transition-opacity" />
          {negocio?.logoUrl ? (
            <img
              src={negocio.logoUrl}
              alt={businessName}
              className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-[0_12px_32px_rgba(10,10,10,0.08)] border-4 border-[#FFFFFF] ring-1 ring-[#E8E6E1]"
            />
          ) : (
            <div
              className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FFFFFF] shadow-[0_12px_32px_rgba(10,10,10,0.08)] border-4 border-[#FFFFFF] ring-1 ring-[#E8E6E1] flex items-center justify-center text-3xl font-bold"
              style={{ color: primary }}
            >
              {initialLetter}
            </div>
          )}
        </div>

        {/* Business Title & Verified Indicator */}
        <div className="text-center mb-3">
          <h1
            className={`${instrumentSerif.className} text-4xl sm:text-5xl text-[#0A0A0A] tracking-[-0.02em] leading-[1.05] drop-shadow-sm`}
          >
            {config.heroTitle || businessName}
          </h1>
        </div>

        {/* Description / Bio */}
        <p className="text-center text-[#6B6B6B] text-sm sm:text-base font-normal max-w-sm mb-6 leading-relaxed">
          {config.heroText || negocio?.description || "Atención exclusiva, curada y personalizada."}
        </p>

        {/* Address & Verified Info Snippet */}
        {negocio?.address && (
          <div className="flex items-center gap-1.5 text-xs text-[#8A8880] mb-6 tracking-wide">
            <MapPin className="w-3.5 h-3.5 text-[#0A0A0A]" />
            <span>{negocio.address}</span>
          </div>
        )}

        {/* ─── Social Links (Minimalist Hairline Circles) ─── */}
        <div className="flex items-center gap-3.5 mb-10">
          {negocio?.instagram && (
            <a
              href={formatSocialUrl("instagram", negocio.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-11 h-11 rounded-full bg-[#FFFFFF] border border-[#E8E6E1] shadow-[0_4px_16px_rgba(10,10,10,0.04)] flex items-center justify-center text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white hover:-translate-y-0.5 transition-all"
            >
              <InstagramIcon className="w-4 h-4" />
            </a>
          )}
          {negocio?.whatsapp && (
            <a
              href={formatSocialUrl("whatsapp", negocio.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-11 h-11 rounded-full bg-[#FFFFFF] border border-[#E8E6E1] shadow-[0_4px_16px_rgba(10,10,10,0.04)] flex items-center justify-center text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white hover:-translate-y-0.5 transition-all"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          {negocio?.facebook && (
            <a
              href={formatSocialUrl("facebook", negocio.facebook)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-11 h-11 rounded-full bg-[#FFFFFF] border border-[#E8E6E1] shadow-[0_4px_16px_rgba(10,10,10,0.04)] flex items-center justify-center text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white hover:-translate-y-0.5 transition-all"
            >
              <FacebookIcon className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* ─── Services Accordion List ─── */}
        {items.length > 0 && (
          <section className="w-full mb-12" aria-labelledby="services-heading">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2
                id="services-heading"
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A8880]"
              >
                Servicios & Experiencias
              </h2>
              <span className={`${jetbrainsMono.className} text-[11px] text-[#8A8880]`}>
                {items.length} {items.length === 1 ? "opción" : "opciones"}
              </span>
            </div>

            <div className="w-full space-y-2.5">
              {items.map((item, idx) => {
                const itemId = item.id || `srv-${idx}`;
                const isExpanded = expandedId === itemId;

                return (
                  <div
                    key={itemId}
                    className="bg-[#FFFFFF] rounded-2xl border border-[#E8E6E1] shadow-[0_2px_12px_rgba(10,10,10,0.03)] hover:shadow-[0_8px_24px_rgba(10,10,10,0.06)] hover:border-[#D4D2CD] transition-all overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : itemId)}
                      aria-expanded={isExpanded}
                      aria-controls={`content-${itemId}`}
                      id={`heading-${itemId}`}
                      className="w-full p-4 flex items-center justify-between text-left gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-[#E8E6E1] flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#F6F5F0] text-[#0A0A0A]"
                          >
                            <Star className="w-4 h-4 opacity-70" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-[#0A0A0A] truncate">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`${jetbrainsMono.className} text-xs font-semibold text-[#0A0A0A]`}
                            >
                              {item.price ? `$${item.price}` : "A consultar"}
                            </span>
                            {item.duration && (
                              <span className="text-[11px] text-[#8A8880] tracking-tight">
                                • {item.duration} min
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-[#F6F5F0] flex items-center justify-center text-[#0A0A0A] flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Accordion Drawer */}
                    {isExpanded && (
                      <div
                        id={`content-${itemId}`}
                        role="region"
                        aria-labelledby={`heading-${itemId}`}
                        className="px-4 pb-4 pt-2 border-t border-[#F0EEEA] bg-[#FCFBF8] text-sm text-[#6B6B6B]"
                      >
                        <p className="mb-4 leading-relaxed text-xs sm:text-sm">
                          {item.description || "Atención personalizada y profesional cuidando cada detalle."}
                        </p>
                        <button
                          onClick={scrollToBooking}
                          className="w-full py-2.5 rounded-xl bg-[#0A0A0A] text-white font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-black transition-transform active:scale-[0.99] shadow-sm"
                        >
                          <span>Reservar este turno</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Gallery Carousel / Grid ─── */}
        {gallery.length > 0 && (
          <section className="w-full mb-12" aria-labelledby="gallery-heading">
            <h2
              id="gallery-heading"
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A8880] text-center mb-4"
            >
              Galería & Trabajos
            </h2>
            <div className="flex overflow-x-auto gap-3 pb-3 snap-x snap-mandatory scrollbar-none px-1">
              {gallery.map((img: any, i: number) => (
                <div
                  key={img.id || i}
                  className="w-40 sm:w-48 aspect-square rounded-2xl overflow-hidden border border-[#E8E6E1] flex-shrink-0 snap-center shadow-sm group"
                >
                  <img
                    src={img.url}
                    alt={`Galería ${businessName} ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Video Section ─── */}
        {config.videoUrl && (
          <section className="w-full mb-12">
            <VideoSection
              videoUrl={config.videoUrl || (sections.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
              accentColor={primary}
              theme="light"
              className="p-0 rounded-2xl overflow-hidden border border-[#E8E6E1] shadow-sm"
            />
          </section>
        )}

        {/* ─── Booking Card (Editorial Quiet Luxury) ─── */}
        <section
          id="booking"
          className="w-full rounded-[2rem] bg-[#FFFFFF] border border-[#E8E6E1] shadow-[0_16px_48px_rgba(10,10,10,0.05)] p-6 sm:p-8 mb-12 scroll-mt-20"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6F5F0] text-[10px] uppercase font-bold tracking-widest text-[#0A0A0A] mb-2">
              <Calendar className="w-3 h-3 text-[#0A0A0A]" />
              <span>Agenda Online</span>
            </div>
            <h2 className={`${instrumentSerif.className} text-3xl sm:text-4xl text-[#0A0A0A]`}>
              Reservá tu Lugar
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1">
              Elegí día y horario disponible. Confirmación instantánea.
            </p>
          </div>

          <BookingForm
            businessId={businessId || negocio?.id}
            services={items.map((s) => s.name)}
            primaryColor="#0A0A0A"
            secondaryColor="#6B6B6B"
            theme="light"
          />

          <div className="mt-6 pt-4 border-t border-[#F0EEEA] flex items-center justify-center gap-6 text-[11px] text-[#8A8880]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sin cargos de gestión</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cancelación flexible</span>
            </div>
          </div>
        </section>

        {/* ─── Minimalist Footer ─── */}
        <footer className="w-full text-center py-6 border-t border-[#E8E6E1]/60 text-xs text-[#8A8880]">
          <p>© {new Date().getFullYear()} {businessName}. Todos los derechos reservados.</p>
          <p className="text-[10px] mt-1 text-[#A8A6A0]">Creado con MiniWebs</p>
        </footer>
      </main>
    </div>
  );
}
