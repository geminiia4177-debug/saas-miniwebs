"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import {
  Phone,
  MapPin,
  Star,
  ChevronDown,
  X,
  Menu,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import BookingForm from "@/app/[subdomain]/BookingForm";
import VideoSection from "@/components/ui/VideoSection";
import { formatSocialUrl } from "@/components/landings/biolinks/utils";

const instrument = Instrument_Serif({ weight: "400", subsets: ["latin"], display: "swap" });
const inter = Inter({ subsets: ["latin"], display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], display: "swap" });

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

export default function ModernTheme(props: {
  negocio: any;
  media?: any[];
  businessId?: string;
  sections?: any[];
}) {
  const { negocio, media = [], businessId, sections = [] } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const config = negocio?.layoutConfig || {};
  const primary = negocio?.primaryColor || "#0A0A0A";
  const accent = negocio?.accentColor || "#3B82F6";
  const bgType = negocio?.backgroundType || "color";

  const items = useMemo(() => {
    if (!negocio) return [];
    let list: any[] = [];
    if (negocio.type === "barberia") list = config.barberiaServices || [];
    else if (negocio.type === "estetica") list = config.esteticaServicios || [];
    else if (negocio.type === "clinica") list = config.clinicaEspecialidades || [];
    else if (negocio.type === "taller") list = config.tallerServices || [];
    else if (negocio.type === "restaurante" || negocio.type === "menu") {
      list = config.menuCategorias?.flatMap((c: any) => c.items || []) || [];
    } else {
      list = config.items || [];
    }
    return list.filter((s: any) => s && s.active !== false);
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
        background: `linear-gradient(135deg, rgba(59,130,246,0.06), rgba(15,23,42,0.03)), #FCFCF9`,
      };
    }
    return { backgroundColor: "#FCFCF9" };
  };

  const businessName = negocio?.name || "Modern Studio";
  const initialLetter = businessName.trim().charAt(0) || "M";

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div
      className={`${inter.className} min-h-screen text-[#0A0A0A] relative overflow-x-hidden selection:bg-[#0A0A0A] selection:text-[#FFFFFF]`}
      style={{
        ...getBackgroundStyle(),
        paddingBottom: "max(3rem, calc(2rem + env(safe-area-inset-bottom)))",
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

      {/* ─── FLOATING PILL NAVBAR (Desktop & Mobile) ─── */}
      <div
        className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 transition-all duration-300"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <nav
          className={`max-w-5xl mx-auto rounded-full px-5 py-2.5 flex justify-between items-center transition-all duration-300 border ${
            scrolled
              ? "bg-[#FFFFFF]/90 backdrop-blur-2xl border-black/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
              : "bg-[#FFFFFF]/80 backdrop-blur-xl border-black/[0.05] shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
          }`}
        >
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => scrollTo("hero")}>
            {negocio?.logoUrl ? (
              <img
                src={negocio.logoUrl}
                alt={businessName}
                className="w-8 h-8 rounded-full object-cover border border-black/10 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {initialLetter}
              </div>
            )}
            <span className="font-semibold text-sm tracking-tight text-[#0A0A0A] truncate">
              {businessName}
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-7 items-center text-xs font-medium text-[#555]">
            {items.length > 0 && (
              <button
                onClick={() => scrollTo("servicios")}
                className="hover:text-[#0A0A0A] transition-colors"
              >
                Servicios
              </button>
            )}
            {gallery.length > 0 && (
              <button
                onClick={() => scrollTo("galeria")}
                className="hover:text-[#0A0A0A] transition-colors"
              >
                Galería
              </button>
            )}
            <button
              onClick={() => scrollTo("booking")}
              className="px-5 py-2 rounded-full bg-[#0A0A0A] text-white text-xs font-semibold hover:bg-black transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              Reservar Cita
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-[#0A0A0A] p-1.5 rounded-full hover:bg-black/5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* ─── MOBILE SHEET MENU ─── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-[#FCFCF9]/98 backdrop-blur-2xl flex flex-col items-center justify-center gap-6 md:hidden px-6 text-center animate-fade-in">
          {items.length > 0 && (
            <button
              onClick={() => scrollTo("servicios")}
              className={`${instrument.className} text-3xl text-[#0A0A0A] hover:opacity-70 transition-opacity`}
            >
              Servicios
            </button>
          )}
          {gallery.length > 0 && (
            <button
              onClick={() => scrollTo("galeria")}
              className={`${instrument.className} text-3xl text-[#0A0A0A] hover:opacity-70 transition-opacity`}
            >
              Galería
            </button>
          )}
          <button
            onClick={() => scrollTo("contacto")}
            className={`${instrument.className} text-3xl text-[#0A0A0A] hover:opacity-70 transition-opacity`}
          >
            Contacto
          </button>
          <button
            onClick={() => scrollTo("booking")}
            className="px-8 py-3.5 rounded-full bg-[#0A0A0A] text-white text-xs font-bold uppercase tracking-widest mt-4 shadow-xl"
          >
            Reservar Ahora
          </button>
        </div>
      )}

      {/* ─── HERO EDITORIAL ─── */}
      <header
        id="hero"
        className="relative pt-36 pb-20 md:pt-44 md:pb-28 px-6 flex flex-col items-center justify-center text-center max-w-5xl mx-auto"
      >
        {/* Availability Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] text-[11px] font-medium text-[#444] shadow-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Agenda abierta para esta semana</span>
        </div>

        {/* Hero Title */}
        <h1
          className={`${instrument.className} text-5xl sm:text-7xl md:text-8xl text-[#0A0A0A] tracking-[-0.02em] leading-[0.98] mb-6 drop-shadow-sm max-w-4xl`}
        >
          {config.heroTitle || businessName}
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-[#555] mb-10 font-normal max-w-xl mx-auto leading-relaxed">
          {config.heroText || "Diseño limpio, atención precisa y una experiencia digital sin fricción."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3.5 items-center">
          <button
            onClick={() => scrollTo("booking")}
            className="px-8 py-3.5 rounded-full bg-[#0A0A0A] text-white text-xs font-semibold uppercase tracking-wider shadow-lg hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2.5"
          >
            <span>Reservar Turno</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {items.length > 0 && (
            <button
              onClick={() => scrollTo("servicios")}
              className="px-7 py-3.5 rounded-full bg-white border border-black/[0.08] text-[#0A0A0A] text-xs font-semibold uppercase tracking-wider hover:bg-[#F5F5F0] transition-colors"
            >
              Ver Servicios
            </button>
          )}
        </div>
      </header>

      {/* ─── SERVICIOS (Quiet Luxury Grid) ─── */}
      {items.length > 0 && (
        <section id="servicios" className="py-20 sm:py-28 px-6 max-w-6xl mx-auto scroll-mt-20">
          <div className="text-center mb-16">
            <span className={`${jetbrains.className} text-xs font-semibold tracking-[0.25em] uppercase text-[#777] block mb-2`}>
              CATÁLOGO DE EXPERIENCIAS
            </span>
            <h2 className={`${instrument.className} text-4xl sm:text-5xl text-[#0A0A0A]`}>
              Nuestros Servicios
            </h2>
            <div className="w-12 h-0.5 bg-[#0A0A0A] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white rounded-[24px] p-7 border border-black/[0.08] shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:border-black/20 transition-all flex flex-col group"
              >
                <div className="w-full h-44 rounded-xl mb-6 overflow-hidden bg-[#F5F5F0] border border-black/[0.05] relative">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#777]">
                      <Sparkles className="w-6 h-6 mb-1 opacity-60" />
                      <span className={`${jetbrains.className} text-[9px] uppercase tracking-widest`}>
                        SERVICE
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-[#0A0A0A] mb-2">
                  {item.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#666] leading-relaxed mb-6 flex-1">
                  {item.description || "Servicio profesional diseñado para garantizar máxima satisfacción."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-black/[0.06] mt-auto">
                  <span className={`${jetbrains.className} text-lg font-bold text-[#0A0A0A]`}>
                    {item.price ? `$${item.price}` : "A consultar"}
                  </span>
                  {item.duration && (
                    <div className="flex items-center gap-1.5 text-xs text-[#777]">
                      <Clock className="w-3.5 h-3.5 text-black/40" />
                      <span>{item.duration} min</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── BOOKING SECTION (Clean 2-Column Split) ─── */}
      <section
        id="booking"
        className="py-20 sm:py-28 px-6 bg-[#F5F5F0]/60 border-y border-black/[0.06] scroll-mt-20"
      >
        <div className="max-w-5xl mx-auto rounded-[32px] overflow-hidden bg-white border border-black/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.06)] grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Benefits & Trust */}
          <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-black/[0.06]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCFCF9] border border-black/[0.08] text-[10px] uppercase font-bold tracking-widest text-[#0A0A0A] mb-4">
                <Calendar className="w-3 h-3" />
                <span>Turnos 24/7</span>
              </div>
              <h2 className={`${instrument.className} text-3xl sm:text-4xl text-[#0A0A0A] mb-3`}>
                Reserva en Línea
              </h2>
              <p className="text-xs sm:text-sm text-[#666] leading-relaxed mb-8">
                Elige tu servicio favorito, selecciona la fecha que mejor te acomode y recibe confirmación al instante.
              </p>

              <div className="space-y-4 text-xs sm:text-sm text-[#444]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Sin esperas telefónicas ni demoras</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Notificaciones y recordatorios automáticos</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Cancelación y reprogramación simple</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-black/[0.06] text-xs text-[#777]">
              ¿Tienes alguna duda previa? Contáctanos de forma directa.
            </div>
          </div>

          {/* Right Column: Interactive Booking Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 bg-[#FCFCF9]">
            <BookingForm
              businessId={businessId || negocio?.id}
              services={items.map((s) => s.name)}
              primaryColor="#0A0A0A"
              secondaryColor="#3B82F6"
              theme="light"
            />
          </div>
        </div>
      </section>

      {/* ─── VIDEO ─── */}
      {config.videoUrl && (
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <VideoSection
            videoUrl={config.videoUrl || (sections.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
            accentColor="#0A0A0A"
            theme="light"
            className="rounded-3xl overflow-hidden border border-black/[0.08] shadow-md"
          />
        </section>
      )}

      {/* ─── GALERÍA ─── */}
      {gallery.length > 0 && (
        <section id="galeria" className="py-20 sm:py-28 px-6 max-w-6xl mx-auto scroll-mt-20">
          <div className="text-center mb-16">
            <span className={`${jetbrains.className} text-xs font-semibold tracking-[0.25em] uppercase text-[#777] block mb-2`}>
              MOMENTOS & RESULTADOS
            </span>
            <h2 className={`${instrument.className} text-4xl sm:text-5xl text-[#0A0A0A]`}>
              Nuestra Galería
            </h2>
            <div className="w-12 h-0.5 bg-[#0A0A0A] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {gallery.map((img: any, i: number) => (
              <div
                key={img.id || i}
                className={`rounded-2xl overflow-hidden border border-black/[0.08] shadow-sm bg-white group ${
                  i === 0 ? "col-span-2 md:col-span-2 aspect-[16/10]" : "aspect-square"
                }`}
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

      {/* ─── FOOTER ─── */}
      <footer id="contacto" className="py-16 px-6 border-t border-black/[0.08] bg-white text-[#555]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h4 className="text-base font-bold text-[#0A0A0A] mb-3 tracking-tight">
              {businessName}
            </h4>
            <p className="text-xs leading-relaxed text-[#777] max-w-xs mb-5">
              {negocio?.description || "Atención profesional y una experiencia digital moderna."}
            </p>
            <div className="flex gap-3">
              {negocio?.instagram && (
                <a
                  href={formatSocialUrl("instagram", negocio.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all shadow-sm"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {negocio?.facebook && (
                <a
                  href={formatSocialUrl("facebook", negocio.facebook)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all shadow-sm"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className={`${jetbrains.className} text-xs font-semibold uppercase tracking-wider text-[#0A0A0A] mb-4`}>
              Contacto
            </h4>
            <ul className="space-y-3 text-xs text-[#555]">
              {negocio?.whatsapp && (
                <li>
                  <a
                    href={formatSocialUrl("whatsapp", negocio.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:text-[#0A0A0A] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-black/60" />
                    <span>{negocio.whatsapp}</span>
                  </a>
                </li>
              )}
              {negocio?.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-black/60 mt-0.5 flex-shrink-0" />
                  <span>{negocio.address}</span>
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-col md:items-end justify-between">
            <span className={`${instrument.className} text-2xl text-[#0A0A0A]`}>
              Quiet Luxury
            </span>
            <p className="text-[11px] text-[#888] mt-4">
              © {new Date().getFullYear()} {businessName}. Creado con MiniWebs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
