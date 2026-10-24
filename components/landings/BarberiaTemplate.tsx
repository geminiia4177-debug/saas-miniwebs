"use client";

import React, { useState, useEffect, useRef } from "react";
import { Playfair_Display, Cinzel, DM_Sans, Special_Elite } from "next/font/google";
import BookingForm from "@/app/[subdomain]/BookingForm";
import { extractYouTubeId } from "@/components/ui/VideoSection";
import { formatSocialUrl } from "@/components/landings/biolinks/utils";
import styles from "./BarberiaTemplate.module.css";

// ─── Google Fonts via next/font ───
const cinzel = Cinzel({ subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap" });
const specialElite = Special_Elite({ weight: "400", subsets: ["latin"], display: "swap" });

// ─── Roman Numerals Helper ───
function toRoman(num: number): string {
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI"];
  return romans[num] || String(num + 1);
}

// ─── Vintage SVG Icons ───
function RazorIcon({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M3 21l3.5-3.5" />
      <path d="M6.5 17.5L16 8l-2-2-9.5 9.5z" />
      <path d="M14 6l4-4 3 3-4 4-3-3z" />
      <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function ShearsIcon({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M8.5 8.5L21 21" />
      <path d="M8.5 15.5L21 3" />
    </svg>
  );
}

function CombIcon({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M2 7h20v4H2z" />
      <path d="M5 11v6" />
      <path d="M8 11v6" />
      <path d="M11 11v6" />
      <path d="M14 11v6" />
      <path d="M17 11v6" />
      <path d="M20 11v6" />
    </svg>
  );
}

export default function BarberiaTemplate(props: { negocio: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, media = [], businessId } = props;

  const defaultSections = [
    { id: "hero", visible: true },
    { id: "services", visible: true },
    { id: "productos", visible: true },
    { id: "gallery", visible: true },
    { id: "video", visible: true },
    { id: "booking", visible: true },
    { id: "contact", visible: true }
  ];

  const sectionList = props.sections && props.sections.length > 0 
    ? (() => {
        const merged = props.sections.map(ps => {
          const found = defaultSections.find(ds => ds.id === ps.id);
          return found ? { ...found, ...ps } : ps;
        });
        defaultSections.forEach(ds => {
          if (!merged.find(m => m.id === ds.id)) merged.push(ds);
        });
        return merged;
      })()
    : defaultSections;

  const [menuOpen, setMenuOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [loadVideo, setLoadVideo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const layout = negocio?.layoutConfig || {};
  // ─── Paleta Siglo XX (1920-1950) con overrides seguros ───
  const accent = negocio?.accentColor || negocio?.primaryColor || "#C8A96E"; // Latón / Dorado viejo
  const walnutWood = "#1A0F0A"; // Madera nogal oscuro
  const creamPaper = layout.backgroundColor || "#F5F1E8"; // Crema envejecido
  const ivoryCard = layout.cardColor || "#FFFCF5"; // Marfil
  const englishGreen = "#0F2F3A"; // Verde inglés oscuro
  const barberRed = "#8B1A1A"; // Rojo Barber Pole
  const customBorder = layout.borderColor || "rgba(200, 169, 110, 0.4)";
  const customBtnBg = layout.buttonBgColor || accent;
  const customBtnText = layout.buttonTextColor || "#1A0F0A";

  const servicios = negocio?.layoutConfig?.barberiaServices || [];
  const productos = negocio?.layoutConfig?.barberiaProducts || [];
  const galleryImages = media.filter((m: any) => m.type === "image") || [];
  const videoUrl = negocio?.layoutConfig?.videoUrl || "";
  const bookingUrl = negocio?.layoutConfig?.bookingUrl || "";
  const heroText = negocio?.layoutConfig?.heroText || "Reservá tu turno online en segundos. Navaja afilada, toalla caliente y el mejor corte tradicional de autor.";
  const address = negocio?.address || negocio?.layoutConfig?.address || "";
  const mapUrl = negocio?.mapUrl || negocio?.layoutConfig?.mapUrl || "";

  // Extraer nombres de servicios para BookingForm
  const serviceNames = servicios.length > 0
    ? servicios.filter((s: any) => s.active !== false).map((s: any) => s.name)
    : ["Corte Clásico Tradicional", "Afeitado con Navaja & Toalla Caliente", "Corte & Barba Completa"];

  // ─── 1. Fix handleScroll: clonar array con [...sections].reverse() ───
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);

      if (menuOpen && scrollTop > 100) {
        setMenuOpen(false);
      }

      const sections = ["servicios", "productos", "galeria", "video", "booking", "contacto"];
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  // ─── 3. Fix IntersectionObserver: dependencia [sectionList] ───
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    const elements = document.querySelectorAll(`.${styles.animateOnScroll}`);
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionList]);

  // ─── 4. Limpieza: background style sin 'backgroundAttachment: scroll' ───
  const getBackgroundStyle = () => {
    if (negocio?.backgroundType === "image" && (negocio?.backgroundImageUrl || layout.backgroundImageUrl)) {
      const bgImg = negocio?.backgroundImageUrl || layout.backgroundImageUrl;
      return { backgroundImage: `url(${bgImg})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
    if (negocio?.backgroundType === "gradient") {
      return { background: `linear-gradient(135deg, ${walnutWood}, ${englishGreen})` };
    }
    return { backgroundColor: creamPaper };
  };

  const handleReservarClick = () => {
    if (bookingUrl) {
      window.open(bookingUrl, "_blank");
    } else {
      document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const navLinkClass = (id: string) =>
    `text-xs tracking-[0.2em] uppercase transition-colors duration-300 font-bold ${
      activeSection === id ? "text-[#C8A96E]" : "text-[#F5F1E8]/75 hover:text-[#C8A96E]"
    }`;

  const fontVariables = {
    "--brass-gold": accent,
    "--font-cinzel": cinzel.style.fontFamily,
    "--font-playfair": playfair.style.fontFamily,
    "--font-body": dmSans.style.fontFamily,
    "--font-typewriter": specialElite.style.fontFamily,
  } as React.CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`${styles.wrapper} ${dmSans.className} min-h-[100dvh] pb-[calc(3rem+env(safe-area-inset-bottom,0px))] text-[#1A0F0A] overflow-x-hidden relative scroll-smooth selection:bg-[#C8A96E] selection:text-[#1A0F0A]`}
      style={{ ...getBackgroundStyle(), ...fontVariables }}
    >
      {/* ─── Paper Noise Grain Overlay (Obligatorio opacidad 0.04) ─── */}
      <div className={styles.noiseOverlay} aria-hidden="true" />

      {/* ─── Scroll Progress Bar ─── */}
      <div className={styles.scrollProgress} style={{ transform: `scaleX(${scrollProgress / 100})` }} />

      {/* ─── NAVBAR (Estilo Madera Nogal + Acabados Oro / Damero) ─── */}
      <header className="fixed top-0 w-full z-50 bg-[#1A0F0A]/95 text-[#F5F1E8] backdrop-blur-md border-b-2 border-double border-[#C8A96E]/50 shadow-xl transition-all">
        {/* Damero Micro-band superior */}
        <div className={styles.dameroDarkBar} aria-hidden="true" />

        <div className="px-4 py-3 sm:px-6 sm:py-3.5 md:px-12 flex justify-between items-center max-w-7xl mx-auto">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => scrollToSection("hero")}>
            {negocio?.logoUrl ? (
              <img
                src={negocio.logoUrl}
                alt={`Logo ${negocio?.name || "Barbería"}`}
                className="w-9 h-9 sm:w-11 sm:h-11 object-cover rounded-full border-2 border-[#C8A96E] shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-[#C8A96E] flex items-center justify-center bg-[#2B160C] text-[#C8A96E] flex-shrink-0 shadow-inner">
                <ShearsIcon className="w-5 h-5 text-[#C8A96E]" />
              </div>
            )}
            <div className="flex flex-col">
              <span
                className={`${cinzel.className} text-base sm:text-lg font-bold tracking-[0.18em] uppercase text-[#F5F1E8] truncate drop-shadow-sm`}
              >
                {negocio?.name || "The Barber Club"}
              </span>
              <span className={`${specialElite.className} text-[9px] sm:text-[10px] tracking-[0.25em] text-[#C8A96E] uppercase -mt-0.5`}>
                EST. 1924 • BARBER SHOP
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            <ul className="flex gap-7 list-none items-center" style={{ fontFamily: cinzel.style.fontFamily }}>
              <li><button onClick={() => scrollToSection("servicios")} className={navLinkClass("servicios")}>Servicios</button></li>
              {productos.length > 0 && <li><button onClick={() => scrollToSection("productos")} className={navLinkClass("productos")}>Botica</button></li>}
              {galleryImages.length > 0 && <li><button onClick={() => scrollToSection("galeria")} className={navLinkClass("galeria")}>Galería</button></li>}
              {(() => {
                const vSec = sectionList.find((s) => s.id === "video" && s.visible !== false);
                const hasVid = vSec && (vSec.config?.youtubeUrl || vSec.config?.videoUrl || videoUrl);
                if (!hasVid) return null;
                return (
                  <li>
                    <button onClick={() => scrollToSection("video")} className={navLinkClass("video")}>
                      {vSec.label || vSec.config?.title || "Video"}
                    </button>
                  </li>
                );
              })()}
              <li><button onClick={() => scrollToSection("booking")} className={navLinkClass("booking")}>Citas</button></li>
              <li><button onClick={() => scrollToSection("contacto")} className={navLinkClass("contacto")}>Contacto</button></li>
            </ul>

            <div className="w-px h-5 bg-[#C8A96E]/30" />

            {/* ─── 6. Unificar social links en NAV con formatSocialUrl() ─── */}
            <div className="flex items-center gap-2.5">
              {negocio?.instagram && (
                <a
                  href={formatSocialUrl("instagram", negocio.instagram)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-7 h-7 rounded-full bg-[#2B160C] border border-[#C8A96E]/40 flex items-center justify-center text-[#C8A96E] hover:bg-[#C8A96E] hover:text-[#1A0F0A] transition-all"
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {negocio?.facebook && (
                <a
                  href={formatSocialUrl("facebook", negocio.facebook)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="w-7 h-7 rounded-full bg-[#2B160C] border border-[#C8A96E]/40 flex items-center justify-center text-[#C8A96E] hover:bg-[#C8A96E] hover:text-[#1A0F0A] transition-all"
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {negocio?.whatsapp && (
                <a
                  href={formatSocialUrl("whatsapp", negocio.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="w-7 h-7 rounded-full bg-[#2B160C] border border-[#C8A96E]/40 flex items-center justify-center text-[#C8A96E] hover:bg-[#C8A96E] hover:text-[#1A0F0A] transition-all"
                >
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.88-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                </a>
              )}
            </div>

            {/* Desktop CTA Beveled Button */}
            <button
              onClick={handleReservarClick}
              aria-label="Reservar Turno"
              className={`${styles.btnVintage} px-5 py-2 text-xs`}
              style={{ fontFamily: cinzel.style.fontFamily }}
            >
              Pedir Turno
            </button>
          </nav>

          {/* ─── 8. Accesibilidad: Mobile hamburger aria-label ─── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded border border-[#C8A96E]/40 bg-[#2B160C]"
            aria-label={menuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          >
            <span className={`block w-5 h-0.5 bg-[#C8A96E] transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#C8A96E] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[#C8A96E] transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-[#1A0F0A] border-b-2 border-double border-[#C8A96E]/50 px-6 py-6 flex flex-col gap-4 text-left shadow-2xl animate-fade-in">
            <button onClick={() => scrollToSection("servicios")} className="text-sm font-bold tracking-[0.2em] uppercase text-[#F5F1E8] hover:text-[#C8A96E] py-2 border-b border-[#C8A96E]/20 text-left">
              Servicios
            </button>
            {productos.length > 0 && (
              <button onClick={() => scrollToSection("productos")} className="text-sm font-bold tracking-[0.2em] uppercase text-[#F5F1E8] hover:text-[#C8A96E] py-2 border-b border-[#C8A96E]/20 text-left">
                Botica & Productos
              </button>
            )}
            {galleryImages.length > 0 && (
              <button onClick={() => scrollToSection("galeria")} className="text-sm font-bold tracking-[0.2em] uppercase text-[#F5F1E8] hover:text-[#C8A96E] py-2 border-b border-[#C8A96E]/20 text-left">
                Galería de Cortes
              </button>
            )}
            <button onClick={() => scrollToSection("booking")} className="text-sm font-bold tracking-[0.2em] uppercase text-[#F5F1E8] hover:text-[#C8A96E] py-2 border-b border-[#C8A96E]/20 text-left">
              Reservar Cita
            </button>
            <button onClick={() => scrollToSection("contacto")} className="text-sm font-bold tracking-[0.2em] uppercase text-[#F5F1E8] hover:text-[#C8A96E] py-2 text-left">
              Contacto & Ubicación
            </button>
            <div className="flex gap-4 pt-3 border-t border-[#C8A96E]/20">
              {negocio?.instagram && (
                <a href={formatSocialUrl("instagram", negocio.instagram)} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-[#C8A96E] text-xs uppercase tracking-wider font-bold">
                  Instagram
                </a>
              )}
              {negocio?.whatsapp && (
                <a href={formatSocialUrl("whatsapp", negocio.whatsapp)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="text-[#C8A96E] text-xs uppercase tracking-wider font-bold">
                  WhatsApp
                </a>
              )}
            </div>
            <button onClick={handleReservarClick} aria-label="Reservar Turno" className={`${styles.btnVintage} w-full py-3 text-xs mt-2`}>
              Reservar Turno Online
            </button>
          </div>
        )}
      </header>

      {/* ─── Render dynamic sections ─── */}
      {sectionList.filter((s: any) => s.visible !== false).map((s: any) => {
        switch (s.id) {
          case "hero":
            return (
              <React.Fragment key={s.id}>
                {/* ─── HERO EDITORIAL VINTAGE (1920-1950) ─── */}
                <section
                  id="hero"
                  className="relative min-h-[100svh] grid place-items-center px-4 sm:px-6 md:px-12 z-10 pt-28 pb-16 bg-cover bg-center overflow-hidden"
                  style={
                    negocio?.bannerUrl
                      ? { backgroundImage: `url(${negocio.bannerUrl})` }
                      : { background: `linear-gradient(145deg, #1A0F0A 0%, #120906 50%, #0F2F3A 100%)` }
                  }
                >
                  {/* Overlay vignette */}
                  <div className="absolute inset-0 bg-black/60 pointer-events-none -z-10" />
                  <div className="absolute inset-0 bg-radial-vignette pointer-events-none -z-10" style={{ background: "radial-gradient(circle at center, transparent 35%, rgba(10, 5, 3, 0.85) 100%)" }} />

                  {/* Damero sutil en fondo de Hero */}
                  <div className={`absolute inset-0 ${styles.dameroSubtle} opacity-20 pointer-events-none -z-10`} />

                  <div className="relative text-center max-w-4xl mx-auto w-full flex flex-col items-center">
                    {/* ─── Sello Circular Giratorio Siglo XX 'EST. 1924' ─── */}
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-6 flex items-center justify-center animate-fade-in">
                      <svg viewBox="0 0 100 100" className={`w-full h-full ${styles.rotatingSeal}`} aria-hidden="true">
                        <defs>
                          <path id="heroSealPath" d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" />
                        </defs>
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#C8A96E" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                        <circle cx="50" cy="50" r="43" fill="none" stroke="#C8A96E" strokeWidth="0.8" opacity="0.8" />
                        <circle cx="50" cy="50" r="28" fill="none" stroke="#C8A96E" strokeWidth="0.8" opacity="0.8" />
                        <text className={`${specialElite.className} text-[6.5px] uppercase font-bold tracking-[0.18em] fill-[#C8A96E]`}>
                          <textPath href="#heroSealPath" startOffset="0%">
                            ★ TRADITIONAL BARBERSHOP ★ EST. 1924 ★ MASTER GROOMING ★
                          </textPath>
                        </text>
                      </svg>
                      {/* Emblema central de navajas cruzadas */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#C8A96E] pointer-events-none">
                        <ShearsIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#C8A96E]" />
                        <span className={`${specialElite.className} text-[8px] font-bold tracking-widest text-[#FFFCF5] mt-0.5`}>
                          EST. 1924
                        </span>
                      </div>
                    </div>

                    {/* Tagline con Líneas Dobles Doradas */}
                    <div className="flex items-center justify-center gap-3 sm:gap-5 mb-4 animate-fade-in delay-100 w-full max-w-md">
                      <span className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-[#C8A96E] to-[#C8A96E] border-t border-b border-[#C8A96E]/50" />
                      <span
                        className={`${cinzel.className} text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#C8A96E] font-bold whitespace-nowrap`}
                      >
                        {negocio?.tagline || "Barbería & Peluquería Tradicional"}
                      </span>
                      <span className="h-0.5 flex-1 bg-gradient-to-l from-transparent via-[#C8A96E] to-[#C8A96E] border-t border-b border-[#C8A96E]/50" />
                    </div>

                    {/* Título Gigante con Borde + Sombra Profunda */}
                    <h1
                      className={`${cinzel.className} ${styles.heroTitleVintage} text-4xl sm:text-6xl md:text-7xl font-black uppercase text-center mx-auto mb-6 leading-[1.05] tracking-[0.06em]`}
                    >
                      {negocio?.layoutConfig?.heroTitle || negocio?.name || "The Barber Club"}
                    </h1>

                    {/* Subtítulo Vintage */}
                    <p
                      className={`${dmSans.className} text-base sm:text-lg md:text-xl text-[#F5F1E8]/80 max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed px-4`}
                    >
                      {heroText}
                    </p>

                    {/* Botones de acción biselados y con doble borde */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full px-4 animate-fade-in delay-300">
                      <button
                        onClick={handleReservarClick}
                        aria-label="Agendar Turno Ahora"
                        className={`${styles.btnVintage} px-8 sm:px-10 py-3.5 sm:py-4 text-xs tracking-[0.2em] w-full sm:w-auto shadow-2xl`}
                        style={{ fontFamily: cinzel.style.fontFamily }}
                      >
                        <span className="flex items-center gap-3">
                          <RazorIcon className="w-4 h-4 text-[#1A0F0A]" />
                          Agendar Ahora
                        </span>
                      </button>
                      <button
                        onClick={() => scrollToSection("servicios")}
                        aria-label="Ver Carta de Servicios"
                        className={`${styles.btnVintageOutline} px-7 sm:px-9 py-3.5 sm:py-4 text-xs tracking-[0.2em] w-full sm:w-auto`}
                        style={{ fontFamily: cinzel.style.fontFamily }}
                      >
                        Ver Servicios
                      </button>
                    </div>

                    {/* Indicador inferior Art Deco */}
                    <div className="mt-12 flex flex-col items-center gap-1 opacity-70">
                      <span className={`${specialElite.className} text-[9px] uppercase tracking-[0.3em] text-[#C8A96E]`}>
                        Deslizar
                      </span>
                      <div className="w-px h-8 bg-gradient-to-b from-[#C8A96E] to-transparent" />
                    </div>
                  </div>
                </section>

                {/* ─── Barber Pole Animado como Divisor de Hero a Secciones ─── */}
                <div className="relative z-20">
                  <div className={styles.barberPoleHorizontal} aria-hidden="true" />
                </div>
              </React.Fragment>
            );

          case "services":
          case "servicios":
            return (
              <React.Fragment key={s.id}>
                {/* ─── SERVICIOS: Tarjetas de Papel Marfil con Remaches de Latón y Números Romanos ─── */}
                <section id="servicios" className="relative py-20 sm:py-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10">
                  <div className={`${styles.animateOnScroll} text-center mb-12 sm:mb-16`}>
                    <div className="inline-flex items-center gap-3 mb-3">
                      <ShearsIcon className="w-4 h-4 text-[#C8A96E]" />
                      <span className={`${specialElite.className} text-[11px] tracking-[0.3em] uppercase text-[#8B1A1A] font-bold`}>
                        CARTA DE SERVICIOS TRADICIONALES
                      </span>
                      <ShearsIcon className="w-4 h-4 text-[#C8A96E]" />
                    </div>
                    <h2 className={`${cinzel.className} text-3xl sm:text-4xl md:text-5xl font-black text-[#1A0F0A] uppercase tracking-wide mb-4`}>
                      Cortes & <em className={`${playfair.className} italic text-[#8B1A1A] font-normal`}>Afeitados</em>
                    </h2>
                    <div className={styles.goldDoubleDivider} />
                    <p className="text-[#1A0F0A]/70 max-w-lg mx-auto text-sm sm:text-base mt-3">
                      Técnicas de barbería clásica de los años 1920 a 1950. Atención minuciosa con navaja recta y toalla aromatizada.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    {servicios.length === 0 ? (
                      <div className="col-span-full p-10 sm:p-14 text-center bg-[#FFFCF5] border-2 border-double border-[#C8A96E] shadow-md rounded-none">
                        <ShearsIcon className="w-10 h-10 text-[#C8A96E] mx-auto mb-3" />
                        <p className={`${cinzel.className} font-bold text-lg text-[#1A0F0A] uppercase tracking-wider mb-1`}>
                          Catálogo en preparación
                        </p>
                        <p className="text-sm text-[#1A0F0A]/60">Los servicios estarán disponibles a la brevedad.</p>
                      </div>
                    ) : (
                      servicios.filter((srv: any) => srv.active !== false).map((srv: any, idx: number) => (
                        <div
                          key={srv.id || idx}
                          className={`${styles.serviceCard} ${styles.animateOnScroll} p-6 sm:p-7 flex flex-col sm:flex-row gap-5 relative`}
                          style={{ transitionDelay: `${idx * 60}ms` }}
                        >
                          {/* 4 Remaches de Latón en las esquinas */}
                          <span className={`${styles.rivet} ${styles.rivetTl}`} aria-hidden="true" />
                          <span className={`${styles.rivet} ${styles.rivetTr}`} aria-hidden="true" />
                          <span className={`${styles.rivet} ${styles.rivetBl}`} aria-hidden="true" />
                          <span className={`${styles.rivet} ${styles.rivetBr}`} aria-hidden="true" />

                          {/* Foto o Emblema del Servicio */}
                          <div className="w-full sm:w-36 h-44 sm:h-auto flex-shrink-0 border-2 border-[#C8A96E]/50 overflow-hidden relative bg-[#241710] shadow-inner">
                            {srv.imageUrl ? (
                              <img
                                src={srv.imageUrl}
                                alt={srv.name}
                                className="w-full h-full object-cover filter contrast-[1.08] sepia-[0.25] transition-transform duration-700 hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-[#C8A96E] p-4 text-center">
                                <RazorIcon className="w-8 h-8 mb-2 opacity-80" />
                                <span className={`${specialElite.className} text-[9px] uppercase tracking-widest opacity-70`}>
                                  CLASSIC
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Contenido de la tarjeta de servicio */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-3 mb-2 border-b border-[#C8A96E]/30 pb-2">
                                <div className="flex items-center gap-2">
                                  {/* Número Romano en Dorado */}
                                  <span className={`${cinzel.className} font-bold text-lg text-[#C8A96E] tracking-wider`}>
                                    {toRoman(idx)}.
                                  </span>
                                  <h3 className={`${cinzel.className} text-lg sm:text-xl font-bold text-[#1A0F0A] uppercase tracking-wider`}>
                                    {srv.name}
                                  </h3>
                                </div>
                                {/* Precio con tipografía vintage máquina de escribir */}
                                <span className={`${specialElite.className} text-xl sm:text-2xl font-black text-[#8B1A1A] shrink-0`}>
                                  ${srv.price}
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm text-[#1A0F0A]/70 mb-4 leading-relaxed">
                                {srv.desc || "Atención personalizada con técnica tradicional, toalla caliente y loción de época."}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-dashed border-[#C8A96E]/40 mt-auto">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A0F0A]/60 uppercase tracking-widest">
                                <CombIcon className="w-3.5 h-3.5 text-[#C8A96E]" />
                                <span>{srv.duration || 30} Minutos</span>
                              </div>

                              <button
                                onClick={() => {
                                  setPreselectedService(srv.name);
                                  document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                aria-label={`Reservar ${srv.name}`}
                                className={`${styles.btnVintage} px-4 py-1.5 text-[10px] tracking-[0.16em]`}
                                style={{ fontFamily: cinzel.style.fontFamily }}
                              >
                                Reservar Turno →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </React.Fragment>
            );

          case "products":
          case "productos":
            return (
              <React.Fragment key={s.id}>
                {/* ─── PRODUCTOS: Vitrina de Botica Antigua (Madera Nogal + Mármol / Farmacia) ─── */}
                {productos.filter((p: any) => p.active !== false).length > 0 && (
                  <section id="productos" className="relative py-20 sm:py-28 px-4 sm:px-6 md:px-12 bg-[#1A0F0A] text-[#F5F1E8] z-10 border-t-2 border-b-2 border-double border-[#C8A96E]/50">
                    {/* Damero Micro-band superior */}
                    <div className={`${styles.dameroDarkBar} absolute top-0 left-0 w-full`} aria-hidden="true" />

                    <div className="max-w-7xl mx-auto">
                      <div className={`${styles.animateOnScroll} text-center mb-12 sm:mb-16`}>
                        <p className={`${specialElite.className} text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] font-bold mb-2`}>
                          FÓRMULAS & PREPARADOS DE ÉPOCA
                        </p>
                        <h2 className={`${cinzel.className} text-3xl sm:text-4xl md:text-5xl font-black text-[#F5F1E8] uppercase tracking-wide mb-3`}>
                          Vitrina de <em className={`${playfair.className} italic text-[#C8A96E] font-normal`}>Botica</em>
                        </h2>
                        <div className={styles.goldDoubleDivider} />
                        <p className="text-[#F5F1E8]/70 max-w-md mx-auto text-sm sm:text-base mt-3">
                          Pomadas con cera de abeja, tónicos capilares y bálsamos artesanales para tu cuidado diario.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {productos.filter((p: any) => p.active !== false).map((prod: any, idx: number) => (
                          <div
                            key={prod.id || idx}
                            className={`${styles.productCard} ${styles.animateOnScroll} p-4 sm:p-5 flex flex-col text-center`}
                            style={{ transitionDelay: `${idx * 50}ms` }}
                          >
                            {/* Remaches de latón */}
                            <span className={`${styles.rivet} ${styles.rivetTl}`} aria-hidden="true" />
                            <span className={`${styles.rivet} ${styles.rivetTr}`} aria-hidden="true" />

                            {/* Etiqueta superior tipo farmacia de 1930 */}
                            <div className="border-b border-[#C8A96E]/40 pb-2 mb-3">
                              <span className={`${specialElite.className} text-[9px] uppercase tracking-[0.25em] text-[#8B1A1A] font-bold block`}>
                                APOTHECARY GRADE • NO. 0{idx + 1}
                              </span>
                            </div>

                            {/* Imagen del producto */}
                            <div className="w-full aspect-square mb-3 overflow-hidden bg-[#F5F1E8] border border-[#C8A96E]/40 p-2 shadow-inner flex items-center justify-center">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-full h-full object-contain filter contrast-[1.05] sepia-[0.15] transition-transform duration-500 hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="text-center text-[#1A0F0A]/40 flex flex-col items-center">
                                  <ShearsIcon className="w-8 h-8 text-[#C8A96E] mb-1" />
                                  <span className={`${specialElite.className} text-[9px] uppercase tracking-wider`}>
                                    ELIXIR & POMADE
                                  </span>
                                </div>
                              )}
                            </div>

                            <h3 className={`${cinzel.className} text-base sm:text-lg font-bold text-[#1A0F0A] uppercase tracking-wider mb-1 line-clamp-1`}>
                              {prod.name}
                            </h3>

                            {prod.description && (
                              <p className="text-xs text-[#1A0F0A]/70 mb-3 line-clamp-2 leading-relaxed">
                                {prod.description}
                              </p>
                            )}

                            <div className="mt-auto pt-3 border-t border-dashed border-[#C8A96E]/40 flex items-center justify-between">
                              <span className={`${specialElite.className} text-xs text-[#1A0F0A]/60 uppercase tracking-widest`}>
                                Precio:
                              </span>
                              <span className={`${specialElite.className} text-lg sm:text-xl font-black text-[#8B1A1A]`}>
                                ${prod.price}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </React.Fragment>
            );

          case "gallery":
          case "galeria":
            return (
              <React.Fragment key={s.id}>
                {/* ─── GALERÍA: Muro de Barbería Antigua con Marcos Dorados & Sepia ─── */}
                {galleryImages.length > 0 && (
                  <section id="galeria" className="relative py-20 sm:py-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10">
                    <div className={`${styles.animateOnScroll} text-center mb-12 sm:mb-16`}>
                      <p className={`${specialElite.className} text-[11px] tracking-[0.3em] uppercase text-[#8B1A1A] font-bold mb-2`}>
                        ARCHIVO FOTOGRÁFICO DE CLIENTES
                      </p>
                      <h2 className={`${cinzel.className} text-3xl sm:text-4xl md:text-5xl font-black text-[#1A0F0A] uppercase tracking-wide mb-3`}>
                        Muro de <em className={`${playfair.className} italic text-[#8B1A1A] font-normal`}>Trabajos</em>
                      </h2>
                      <div className={styles.goldDoubleDivider} />
                      <p className="text-[#1A0F0A]/70 max-w-md mx-auto text-sm sm:text-base mt-3">
                        Retratos de caballeros atendidos bajo los más altos estándares de la barbería tradicional.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                      {galleryImages.slice(0, 9).map((img: any, i: number) => (
                        <div
                          key={img.id || i}
                          className={`${styles.vintageFrame} ${styles.animateOnScroll} ${
                            i === 0 ? "col-span-2 md:col-span-2 md:row-span-2" : ""
                          }`}
                          style={{ transitionDelay: `${i * 70}ms` }}
                        >
                          {/* Tachuelas / remaches de latón en las esquinas del marco */}
                          <span className={`${styles.rivet} ${styles.rivetTl}`} aria-hidden="true" />
                          <span className={`${styles.rivet} ${styles.rivetTr}`} aria-hidden="true" />
                          <span className={`${styles.rivet} ${styles.rivetBl}`} aria-hidden="true" />
                          <span className={`${styles.rivet} ${styles.rivetBr}`} aria-hidden="true" />

                          <div className="aspect-square overflow-hidden bg-black">
                            <img
                              src={img.url}
                              alt={`Trabajo de corte y barbería ${i + 1}`}
                              className={`${styles.vintageSepiaImg} w-full h-full object-cover`}
                              loading="lazy"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </React.Fragment>
            );

          case "video": {
            const currentVideoUrl = s.config?.youtubeUrl || s.config?.videoUrl || videoUrl;
            const videoTitle = s.config?.title || s.label || "Nuestra Tradición";
            const videoDesc = s.config?.description || s.config?.subtitle || "Conocé el oficio en acción";
            const youtubeId = extractYouTubeId(currentVideoUrl);

            return (
              <React.Fragment key={s.id}>
                {/* ─── VIDEO: Marco de TV / Radio Antigua 1930-1940 con Perillas de Latón ─── */}
                {currentVideoUrl && youtubeId && (
                  <section id="video" className="relative py-20 sm:py-28 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto z-10">
                    <div className={`${styles.animateOnScroll} text-center mb-10 sm:mb-14`}>
                      <p className={`${specialElite.className} text-[11px] tracking-[0.3em] uppercase text-[#8B1A1A] font-bold mb-2`}>
                        {videoDesc}
                      </p>
                      <h2 className={`${cinzel.className} text-3xl sm:text-4xl md:text-5xl font-black text-[#1A0F0A] uppercase tracking-wide mb-3`}>
                        {videoTitle}
                      </h2>
                      <div className={styles.goldDoubleDivider} />
                    </div>

                    {/* Mueble de Madera de TV / Radio Antigua */}
                    <div className={`${styles.tvCabinet} p-4 sm:p-7 shadow-2xl relative`}>
                      {/* Cabezal de la TV con perillas de latón */}
                      <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#C8A96E]/30">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#8B1A1A] animate-pulse" />
                          <span className={`${specialElite.className} text-[10px] tracking-[0.2em] text-[#C8A96E] uppercase font-bold`}>
                            BROADCAST • 1938
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className={`${specialElite.className} text-[9px] text-[#C8A96E]/70 uppercase`}>TUNING</span>
                            <div className={styles.brassKnob} title="Tuning knob" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`${specialElite.className} text-[9px] text-[#C8A96E]/70 uppercase`}>VOL</span>
                            <div className={styles.brassKnob} title="Volume knob" />
                          </div>
                        </div>
                      </div>

                      {/* Pantalla con marco de latón */}
                      <div
                        className="aspect-video rounded-xl overflow-hidden border-4 border-[#C8A96E]/60 shadow-2xl relative group cursor-pointer bg-black"
                        onClick={() => setLoadVideo(true)}
                      >
                        {!loadVideo ? (
                          <>
                            <img
                              src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                              alt="Video Thumbnail"
                              className="w-full h-full object-cover filter sepia-[0.35] contrast-[1.08] group-hover:scale-105 transition-transform duration-700"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                              <button
                                aria-label="Reproducir video"
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-double border-[#FFFCF5] bg-[#C8A96E] text-[#1A0F0A] flex items-center justify-center pl-1 shadow-[0_0_30px_rgba(200,169,110,0.6)] transform group-hover:scale-110 transition-transform"
                              >
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </button>
                            </div>
                          </>
                        ) : (
                          // 8. Accesibilidad: iframe con title
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                            className="w-full h-full border-none"
                            allowFullScreen
                            title="Video del negocio"
                          />
                        )}
                      </div>

                      {/* Rejilla de altavoz inferior */}
                      <div className="mt-4 pt-3 border-t border-[#C8A96E]/30 flex justify-center gap-2" aria-hidden="true">
                        {[...Array(9)].map((_, idx) => (
                          <div key={idx} className="h-1.5 w-6 bg-[#C8A96E]/30 rounded-full" />
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </React.Fragment>
            );
          }

          case "booking":
            return (
              <React.Fragment key={s.id}>
                {/* ─── BOOKING: Tarjeta de Cita Antigua 'APPOINTMENT CARD' ─── */}
                <section id="booking" className="relative py-20 sm:py-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
                    {/* Lateral Izquierdo: Descripción & Garantías Clásicas */}
                    <div className="lg:col-span-5 flex flex-col justify-center animate-on-scroll">
                      <div className="inline-flex items-center gap-2 mb-3">
                        <RazorIcon className="w-4 h-4 text-[#8B1A1A]" />
                        <span className={`${specialElite.className} text-[11px] tracking-[0.25em] uppercase text-[#8B1A1A] font-bold`}>
                          REGISTRO DE CITAS
                        </span>
                      </div>

                      <h2 className={`${cinzel.className} text-3xl sm:text-4xl md:text-5xl font-black text-[#1A0F0A] uppercase tracking-wide mb-4 leading-tight`}>
                        Reservá tu <em className={`${playfair.className} italic text-[#8B1A1A] font-normal`}>Turno</em>
                      </h2>

                      <div className="w-20 h-0.5 bg-[#C8A96E] mb-6" />

                      <p className="text-[#1A0F0A]/75 mb-8 leading-relaxed text-sm sm:text-base">
                        Elegí tu corte o afeitado, seleccioná la fecha y asegurá tu asiento en el sillón de barbería. Sin esperas, confirmación garantizada.
                      </p>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3.5 p-3.5 bg-[#FFFCF5] border border-[#C8A96E]/40 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 flex items-center justify-center flex-shrink-0 text-[#8B1A1A] mt-0.5">
                            <ShearsIcon className="w-4 h-4 text-[#8B1A1A]" />
                          </div>
                          <div>
                            <p className={`${cinzel.className} text-xs sm:text-sm font-bold uppercase text-[#1A0F0A]`}>
                              Confirmación Inmediata
                            </p>
                            <p className="text-xs text-[#1A0F0A]/60 mt-0.5">
                              Tu turno queda asentado en nuestro libro de reservas al instante.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-3.5 bg-[#FFFCF5] border border-[#C8A96E]/40 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-[#C8A96E]/20 border border-[#C8A96E]/40 flex items-center justify-center flex-shrink-0 text-[#1A0F0A] mt-0.5">
                            <RazorIcon className="w-4 h-4 text-[#C8A96E]" />
                          </div>
                          <div>
                            <p className={`${cinzel.className} text-xs sm:text-sm font-bold uppercase text-[#1A0F0A]`}>
                              Puntualidad de Caballero
                            </p>
                            <p className="text-xs text-[#1A0F0A]/60 mt-0.5">
                              Llegás a tu horario y el barbero te recibe sin demoras.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-3.5 bg-[#FFFCF5] border border-[#C8A96E]/40 shadow-sm">
                          <div className="w-8 h-8 rounded-full bg-[#0F2F3A]/15 border border-[#0F2F3A]/30 flex items-center justify-center flex-shrink-0 text-[#0F2F3A] mt-0.5">
                            <CombIcon className="w-4 h-4 text-[#0F2F3A]" />
                          </div>
                          <div>
                            <p className={`${cinzel.className} text-xs sm:text-sm font-bold uppercase text-[#1A0F0A]`}>
                              Servicio Tradicional
                            </p>
                            <p className="text-xs text-[#1A0F0A]/60 mt-0.5">
                              Navaja desinfectada, toalla caliente y café de cortesía.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lateral Derecho: Tarjeta de Cita Antigua 'APPOINTMENT CARD' + BookingForm */}
                    <div className="lg:col-span-7 animate-on-scroll">
                      <div className={`${styles.appointmentCard} p-6 sm:p-8 relative`}>
                        {/* 4 Remaches de latón */}
                        <span className={`${styles.rivet} ${styles.rivetTl}`} aria-hidden="true" />
                        <span className={`${styles.rivet} ${styles.rivetTr}`} aria-hidden="true" />
                        <span className={`${styles.rivet} ${styles.rivetBl}`} aria-hidden="true" />
                        <span className={`${styles.rivet} ${styles.rivetBr}`} aria-hidden="true" />

                        {/* Encabezado con Sello 'APPOINTMENT CARD' */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-6 border-b-2 border-double border-[#C8A96E]">
                          <div>
                            <span className={`${cinzel.className} text-base sm:text-lg font-bold tracking-[0.2em] uppercase text-[#1A0F0A] block`}>
                              TARJETA OFICIAL DE CITA
                            </span>
                            <span className={`${specialElite.className} text-[10px] uppercase tracking-widest text-[#1A0F0A]/60`}>
                              OFFICIAL APPOINTMENT LEDGER
                            </span>
                          </div>

                          {/* Sello Rojo Vintage */}
                          <div className={styles.vintageStamp}>
                            ★ GUARANTEED SERVICE ★
                          </div>
                        </div>

                        {/* Formulario de Reserva */}
                        {businessId ? (
                          <div className="appointment-form-wrapper">
                            <BookingForm
                              businessId={businessId}
                              primaryColor={accent}
                              secondaryColor={walnutWood}
                              services={serviceNames}
                              theme="light"
                              preselectedService={preselectedService}
                              variant="barberia"
                            />
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-[#F5F1E8] border border-[#C8A96E]/50">
                            <p className={`${cinzel.className} text-sm font-bold uppercase text-[#1A0F0A] mb-3`}>
                              Atención por Turno Telefónico o WhatsApp
                            </p>
                            <p className="text-xs text-[#1A0F0A]/70 mb-5">
                              Para reservar tu turno en este momento, comunicate de manera directa con nuestro equipo.
                            </p>
                            {negocio?.whatsapp && (
                              <a
                                href={formatSocialUrl("whatsapp", negocio.whatsapp)}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Escribir por WhatsApp"
                                className={`${styles.btnVintage} px-6 py-3 text-xs`}
                                style={{ fontFamily: cinzel.style.fontFamily }}
                              >
                                Escribir por WhatsApp
                              </a>
                            )}
                          </div>
                        )}

                        {/* Borde inferior con línea punteada de desgarre */}
                        <div className="mt-6 pt-4 border-t border-dashed border-[#C8A96E] flex justify-between items-center text-[9px] uppercase text-[#1A0F0A]/50 tracking-widest">
                          <span className={specialElite.className}>✂ CORTE POR LA LÍNEA DE PUNTOS</span>
                          <span className={specialElite.className}>VALID ONLY AT APPOINTMENT TIME</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </React.Fragment>
            );

          default:
            return null;
        }
      })}

      {/* ─── FOOTER / CONTACTO: Cuero Oscuro / Damero Superior ─── */}
      {/* 5. UX Mobile: pb-24 md:pb-0 para que el botón flotante no tape el contenido */}
      <footer id="contacto" className="border-t-4 border-double border-[#C8A96E]/60 bg-[#120906] text-[#F5F1E8] z-10 relative mt-16 pb-24 md:pb-0">
        {/* Damero blanco y negro superior */}
        <div className={styles.dameroBar} aria-hidden="true" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-14 sm:py-18">
          {/* Mapa si está configurado */}
          {mapUrl && (
            <div className="mb-10 sm:mb-14 rounded-none overflow-hidden border-2 border-double border-[#C8A96E] h-52 sm:h-64 shadow-2xl">
              <iframe
                src={mapUrl}
                className="w-full h-full border-none filter contrast-[1.05]"
                allowFullScreen
                loading="lazy"
                title="Ubicación de la barbería"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
            {/* Columna Marca */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {negocio?.logoUrl ? (
                  <img
                    src={negocio.logoUrl}
                    alt="Logo"
                    className="w-10 h-10 object-cover rounded-full border border-[#C8A96E]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-[#C8A96E] flex items-center justify-center bg-[#241710] text-[#C8A96E]">
                    <ShearsIcon className="w-5 h-5 text-[#C8A96E]" />
                  </div>
                )}
                <span className={`${cinzel.className} text-lg sm:text-xl font-bold tracking-[0.16em] uppercase text-[#C8A96E]`}>
                  {negocio?.name || "The Barber Club"}
                </span>
              </div>
              <p className="text-sm text-[#F5F1E8]/70 leading-relaxed mb-4">
                {negocio?.description || negocio?.tagline || "Barbería clásica y speakeasy. Pasión por el oficio tradicional, cortes pulidos a navaja y el mejor servicio."}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#C8A96E]">
                <RazorIcon className="w-4 h-4 text-[#C8A96E]" />
                <span className={`${specialElite.className} uppercase tracking-widest`}>ESTABLISHED 1924</span>
              </div>
            </div>

            {/* Columna Contacto */}
            <div>
              <h3 className={`${cinzel.className} text-base sm:text-lg font-bold uppercase tracking-wider text-[#C8A96E] mb-4 border-b border-[#C8A96E]/30 pb-2`}>
                Contacto & Sede
              </h3>
              <div className="space-y-3 text-sm text-[#F5F1E8]/80">
                {negocio?.phone && (
                  <a
                    href={`tel:${negocio.phone}`}
                    className="flex items-center gap-3 hover:text-[#C8A96E] transition-colors"
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-[#C8A96E] flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <span>{negocio.phone}</span>
                  </a>
                )}

                {negocio?.email && negocio?.layoutConfig?.showEmailFooter !== false && (
                  <a
                    href={`mailto:${negocio.email}`}
                    className="flex items-center gap-3 hover:text-[#C8A96E] transition-colors truncate"
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-[#C8A96E] flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <span className="truncate">{negocio.email}</span>
                  </a>
                )}

                {address && (
                  <div className="flex items-start gap-3">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-[#C8A96E] flex-shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span>{address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Columna Redes Sociales con formatSocialUrl() */}
            <div>
              <h3 className={`${cinzel.className} text-base sm:text-lg font-bold uppercase tracking-wider text-[#C8A96E] mb-4 border-b border-[#C8A96E]/30 pb-2`}>
                Conectá con Nosotros
              </h3>
              <div className="flex gap-3 mb-6">
                {negocio?.instagram && (
                  <a
                    href={formatSocialUrl("instagram", negocio.instagram)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="w-10 h-10 rounded-full bg-[#1A0F0A] border border-[#C8A96E]/50 flex items-center justify-center text-[#C8A96E] hover:bg-[#C8A96E] hover:text-[#1A0F0A] transition-all shadow-md"
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}

                {negocio?.facebook && (
                  <a
                    href={formatSocialUrl("facebook", negocio.facebook)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="w-10 h-10 rounded-full bg-[#1A0F0A] border border-[#C8A96E]/50 flex items-center justify-center text-[#C8A96E] hover:bg-[#C8A96E] hover:text-[#1A0F0A] transition-all shadow-md"
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}

                {negocio?.tiktok && (
                  <a
                    href={formatSocialUrl("tiktok", negocio.tiktok)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                    className="w-10 h-10 rounded-full bg-[#1A0F0A] border border-[#C8A96E]/50 flex items-center justify-center text-[#C8A96E] hover:bg-[#C8A96E] hover:text-[#1A0F0A] transition-all shadow-md"
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  </a>
                )}

                {negocio?.whatsapp && (
                  <a
                    href={formatSocialUrl("whatsapp", negocio.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="w-10 h-10 rounded-full bg-[#1A0F0A] border border-[#C8A96E]/50 flex items-center justify-center text-[#C8A96E] hover:bg-[#C8A96E] hover:text-[#1A0F0A] transition-all shadow-md"
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.88-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  </a>
                )}
              </div>

              <button
                onClick={handleReservarClick}
                aria-label="Pedir Cita Online"
                className={`${styles.btnVintage} w-full py-3 text-xs`}
                style={{ fontFamily: cinzel.style.fontFamily }}
              >
                Pedir Cita Online
              </button>
            </div>
          </div>

          {/* Pie de derechos de autor */}
          <div className="border-t border-[#C8A96E]/20 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#F5F1E8]/50">
            <p className={specialElite.className}>
              © {new Date().getFullYear()} {negocio?.name || "The Barber Club"}. TRADITIONAL BARBERSHOP REGISTERED.
            </p>
            <p className={`${specialElite.className} text-[10px] text-[#C8A96E]/70`}>
              CREADO CON MINICLUB & MINIPLATE
            </p>
          </div>
        </div>
      </footer>

      {/* ─── 5. BOTÓN FLOTANTE MOBILE con bottom-safe env(safe-area-inset-bottom) ─── */}
      <div
        className={`md:hidden fixed bottom-0 left-0 w-full px-4 z-[100] ${styles.bottomSafe} bg-gradient-to-t from-[#120906] via-[#120906]/95 to-transparent pt-4`}
      >
        <button
          onClick={handleReservarClick}
          aria-label="Reservar Turno Ahora"
          className={`${styles.btnVintage} w-full py-3.5 text-xs tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3`}
          style={{ fontFamily: cinzel.style.fontFamily }}
        >
          <RazorIcon className="w-4 h-4 text-[#1A0F0A]" />
          <span>RESERVAR TURNO ✂</span>
        </button>
      </div>
    </div>
  );
}