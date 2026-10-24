"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import {
  Phone,
  MapPin,
  Star,
  ChevronDown,
  X,
  Menu,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import BookingForm from "@/app/[subdomain]/BookingForm";
import VideoSection from "@/components/ui/VideoSection";
import { formatSocialUrl } from "@/components/landings/biolinks/utils";

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});
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

export default function DarkEleganceTheme(props: {
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
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  const config = negocio?.layoutConfig || {};
  const primary = negocio?.accentColor || negocio?.primaryColor || "#C9A86A"; // Champagne Gold
  const secondary = negocio?.secondaryColor || "#9A9A9A";
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
        background: `radial-gradient(circle at 50% 0%, rgba(201,168,106,0.06) 0%, #080808 60%)`,
      };
    }
    return { backgroundColor: "#080808" };
  };

  const businessName = negocio?.name || "Noir Atelier";
  const initialLetter = businessName.trim().charAt(0) || "N";

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div
      className={`${inter.className} min-h-screen text-[#F5F5F0] relative overflow-x-hidden selection:bg-[#C9A86A] selection:text-[#080808]`}
      style={{
        ...getBackgroundStyle(),
        paddingBottom: "max(3rem, calc(2rem + env(safe-area-inset-bottom)))",
      }}
    >
      {/* ─── Micro Noise Texture Overlay ─── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* ─── NAVBAR ─── */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${
          scrolled
            ? "bg-[#080808]/85 backdrop-blur-2xl py-3.5 border-white/[0.08] shadow-2xl"
            : "bg-transparent py-5 border-transparent"
        }`}
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => scrollTo("hero")}>
            {negocio?.logoUrl ? (
              <img
                src={negocio.logoUrl}
                alt={businessName}
                className="w-10 h-10 rounded-full object-cover border border-[#C9A86A]/40 shadow-md"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg font-bold border border-[#C9A86A]/40 bg-[#141414] text-[#C9A86A]">
                {initialLetter}
              </div>
            )}
            <span
              className={`${cormorant.className} text-xl sm:text-2xl tracking-[0.2em] uppercase font-light text-[#F5F5F0] truncate`}
            >
              {businessName}
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-8 items-center text-xs tracking-[0.25em] uppercase font-medium">
            {items.length > 0 && (
              <button
                onClick={() => scrollTo("servicios")}
                className="text-[#9A9A9A] hover:text-[#C9A86A] transition-colors"
              >
                Servicios
              </button>
            )}
            {gallery.length > 0 && (
              <button
                onClick={() => scrollTo("galeria")}
                className="text-[#9A9A9A] hover:text-[#C9A86A] transition-colors"
              >
                Galería
              </button>
            )}
            <button
              onClick={() => scrollTo("booking")}
              className="px-6 py-2.5 rounded-full border border-[#C9A86A] text-[#C9A86A] hover:bg-[#C9A86A] hover:text-[#080808] transition-all duration-300 font-semibold"
            >
              Reservar
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white p-2 rounded-lg border border-white/10 bg-white/5"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {menuOpen ? <X className="w-6 h-6 text-[#C9A86A]" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>
      </nav>

      {/* ─── MOBILE MENU ─── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-[#080808]/98 backdrop-blur-3xl flex flex-col items-center justify-center gap-8 md:hidden px-6 text-center animate-fade-in">
          {items.length > 0 && (
            <button
              onClick={() => scrollTo("servicios")}
              className={`${cormorant.className} text-3xl font-light tracking-[0.2em] uppercase text-[#F5F5F0] hover:text-[#C9A86A] transition-colors`}
            >
              Servicios
            </button>
          )}
          {gallery.length > 0 && (
            <button
              onClick={() => scrollTo("galeria")}
              className={`${cormorant.className} text-3xl font-light tracking-[0.2em] uppercase text-[#F5F5F0] hover:text-[#C9A86A] transition-colors`}
            >
              Galería
            </button>
          )}
          <button
            onClick={() => scrollTo("contacto")}
            className={`${cormorant.className} text-3xl font-light tracking-[0.2em] uppercase text-[#F5F5F0] hover:text-[#C9A86A] transition-colors`}
          >
            Contacto
          </button>
          <button
            onClick={() => scrollTo("booking")}
            className="px-10 py-3.5 rounded-full bg-[#C9A86A] text-[#080808] text-xs font-bold tracking-[0.25em] uppercase shadow-lg shadow-[#C9A86A]/20 mt-4"
          >
            Reservar Ahora
          </button>
        </div>
      )}

      {/* ─── HERO ─── */}
      <header
        id="hero"
        className="relative pt-36 pb-20 md:pt-48 md:pb-32 px-6 flex items-center justify-center text-center min-h-[92svh] overflow-hidden"
      >
        {negocio?.bannerUrl ? (
          <div className="absolute inset-0 z-0">
            <img
              src={negocio.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover filter brightness-50 contrast-110"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(8,8,8,0.3) 0%, rgba(8,8,8,0.7) 60%, #080808 100%)",
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 30%, rgba(201,168,106,0.15) 0%, transparent 70%)`,
              }}
            />
          </div>
        )}

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Vertical signature gold bar */}
          <div className="w-[1px] h-16 sm:h-20 mb-6 bg-gradient-to-b from-transparent via-[#C9A86A] to-[#C9A86A]" />

          <span
            className={`${jetbrains.className} text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#C9A86A] mb-4 font-semibold`}
          >
            {negocio?.tagline || "EXCLUSIVIDAD & MAESTRÍA"}
          </span>

          <h1
            className={`${cormorant.className} text-5xl sm:text-7xl md:text-8xl font-light text-[#F5F5F0] mb-6 tracking-tight uppercase leading-[0.95] drop-shadow-lg`}
          >
            {config.heroTitle || businessName}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#9A9A9A] mb-10 font-light max-w-xl mx-auto tracking-wide leading-relaxed px-4">
            {config.heroText || "Atención de alta gama donde la precisión se encuentra con la distinción."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={() => scrollTo("booking")}
              className="px-9 py-3.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:scale-105 shadow-xl bg-[#C9A86A] text-[#080808] hover:bg-[#D9BE84]"
            >
              Hacer Reserva
            </button>
            {items.length > 0 && (
              <button
                onClick={() => scrollTo("servicios")}
                className="px-8 py-3.5 rounded-full text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 border border-white/20 text-[#F5F5F0] hover:border-white/50"
              >
                Ver Servicios
              </button>
            )}
          </div>

          <button
            onClick={() => scrollTo("servicios")}
            className="mt-14 text-white/40 hover:text-[#C9A86A] transition-colors flex flex-col items-center gap-1.5"
            aria-label="Ver servicios"
          >
            <span className={`${jetbrains.className} text-[9px] uppercase tracking-widest`}>Descubrir</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </button>
        </div>
      </header>

      {/* ─── SERVICIOS / ITEMS ─── */}
      {items.length > 0 && (
        <section id="servicios" className="py-24 sm:py-32 px-6 max-w-7xl mx-auto scroll-mt-20">
          <div className="text-center mb-16 sm:mb-20 flex flex-col items-center">
            <span
              className={`${jetbrains.className} text-xs font-semibold tracking-[0.3em] uppercase mb-3 text-[#C9A86A]`}
            >
              PROPUESTA EXCLUSIVA
            </span>
            <h2
              className={`${cormorant.className} text-4xl sm:text-5xl font-light text-white tracking-[0.1em] uppercase`}
            >
              Nuestros Servicios
            </h2>
            <div className="w-12 h-0.5 bg-[#C9A86A]/60 mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {items.map((item, i) => (
              <div
                key={item.id || i}
                className="group relative p-7 sm:p-8 flex flex-col rounded-2xl overflow-hidden bg-[#141414]/70 backdrop-blur-xl border border-white/[0.07] hover:border-[#C9A86A]/40 transition-all duration-500 shadow-xl hover:-translate-y-1"
              >
                {/* Accent top line on hover */}
                <div className="absolute top-0 left-0 w-full h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 bg-[#C9A86A]" />

                <div className="mb-6 overflow-hidden rounded-xl h-48 bg-[#0D0D0D] border border-white/5">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 filter grayscale-[0.3] group-hover:grayscale-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-40 group-hover:opacity-100 text-[#C9A86A] transition-opacity">
                      <Sparkles className="w-8 h-8 mb-2" />
                      <span className={`${jetbrains.className} text-[9px] uppercase tracking-widest`}>
                        EXCLUSIVE
                      </span>
                    </div>
                  )}
                </div>

                <h3
                  className={`${cormorant.className} text-2xl font-normal text-[#F5F5F0] mb-3 tracking-wide`}
                >
                  {item.name}
                </h3>
                <p className="text-[#9A9A9A] text-sm mb-6 flex-1 leading-relaxed font-light">
                  {item.description || "Atención personalizada cuidando la máxima calidad en cada etapa."}
                </p>

                <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/[0.08]">
                  <span className={`${jetbrains.className} font-medium text-xl text-[#C9A86A]`}>
                    {item.price ? `$${item.price}` : "A consultar"}
                  </span>
                  {item.duration && (
                    <div className="flex items-center gap-1.5 text-xs text-[#7A7A7A] uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-[#C9A86A]" />
                      <span>{item.duration} min</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── BOOKING ─── */}
      <section
        id="booking"
        className="py-24 sm:py-32 px-6 relative border-y border-white/[0.06] bg-[#0A0A0A]/60 scroll-mt-20"
      >
        <div className="relative z-10 max-w-4xl mx-auto p-8 sm:p-14 border border-white/[0.08] shadow-[0_32px_64px_rgba(0,0,0,0.8)] rounded-3xl bg-[#121212]/90 backdrop-blur-2xl">
          <div className="text-center mb-10">
            <span
              className={`${jetbrains.className} text-xs font-semibold tracking-[0.3em] uppercase mb-2 text-[#C9A86A] block`}
            >
              DISPONIBILIDAD INMEDIATA
            </span>
            <h2
              className={`${cormorant.className} text-3xl sm:text-5xl font-light tracking-[0.1em] uppercase text-white`}
            >
              Reserva tu Cita
            </h2>
            <div className="w-12 h-[1px] mx-auto mt-4 bg-[#C9A86A]" />
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/[0.06] p-2 bg-black/40">
            <BookingForm
              businessId={businessId || negocio?.id}
              services={items.map((s) => s.name)}
              primaryColor="#C9A86A"
              secondaryColor="#1A1A1A"
              theme="dark"
            />
          </div>
        </div>
      </section>

      {/* ─── VIDEO ─── */}
      {config.videoUrl && (
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <VideoSection
            videoUrl={config.videoUrl || (sections.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
            accentColor="#C9A86A"
            theme="dark"
            className="rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl"
          />
        </section>
      )}

      {/* ─── GALERIA (Masonry Grid) ─── */}
      {gallery.length > 0 && (
        <section id="galeria" className="py-24 sm:py-32 px-6 max-w-7xl mx-auto scroll-mt-20">
          <div className="text-center mb-16 flex flex-col items-center">
            <span
              className={`${jetbrains.className} text-xs font-semibold tracking-[0.3em] uppercase mb-3 text-[#C9A86A]`}
            >
              PORTAFOLIO VISUAL
            </span>
            <h2
              className={`${cormorant.className} text-4xl sm:text-5xl font-light text-white tracking-[0.1em] uppercase`}
            >
              Nuestra Galería
            </h2>
            <div className="w-12 h-0.5 bg-[#C9A86A]/60 mt-4" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {gallery.map((img: any, i: number) => (
              <div
                key={img.id || i}
                className={`relative group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414] shadow-md ${
                  i === 0 ? "col-span-2 md:col-span-2 aspect-[16/10]" : "aspect-square"
                }`}
              >
                <img
                  src={img.url}
                  alt={`Galería ${businessName} ${i + 1}`}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 filter grayscale-[0.2] group-hover:grayscale-0"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── FOOTER ─── */}
      <footer
        id="contacto"
        className="pt-20 pb-12 px-6 border-t border-white/[0.08] bg-[#050505] text-[#9A9A9A]"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16">
          <div className="flex flex-col items-start">
            <h4
              className={`${cormorant.className} text-2xl font-light tracking-[0.2em] uppercase mb-4 text-[#F5F5F0]`}
            >
              {businessName}
            </h4>
            <p className="text-sm mb-6 font-light leading-relaxed max-w-sm text-[#7A7A7A]">
              {negocio?.description || "Comprometidos con la excelencia y el diseño en cada detalle."}
            </p>
            <div className="flex gap-4">
              {negocio?.instagram && (
                <a
                  href={formatSocialUrl("instagram", negocio.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[#F5F5F0] hover:border-[#C9A86A] hover:text-[#C9A86A] transition-colors"
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
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[#F5F5F0] hover:border-[#C9A86A] hover:text-[#C9A86A] transition-colors"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4
              className={`${jetbrains.className} text-xs font-semibold tracking-[0.25em] uppercase mb-6 text-[#C9A86A]`}
            >
              Contacto & Sede
            </h4>
            <ul className="space-y-4 text-sm font-light text-[#9A9A9A]">
              {negocio?.whatsapp && (
                <li>
                  <a
                    href={formatSocialUrl("whatsapp", negocio.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#C9A86A]" />
                    <span>{negocio.whatsapp}</span>
                  </a>
                </li>
              )}
              {negocio?.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C9A86A] mt-0.5 flex-shrink-0" />
                  <span>{negocio.address}</span>
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-col md:items-end justify-between">
            <span className={`${cormorant.className} text-3xl font-light text-[#C9A86A]`}>
              NOIR ATELIER
            </span>
            <p className={`${jetbrains.className} text-[10px] tracking-widest text-[#555] uppercase mt-4`}>
              © {new Date().getFullYear()} {businessName}. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
