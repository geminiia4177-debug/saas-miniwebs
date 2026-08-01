"use client";

import React, { useState, useEffect, useRef } from "react";
import BookingForm from "@/app/[subdomain]/BookingForm";

export default function BarberiaTemplate(props: { negocio: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, media = [], businessId } = props;

  const defaultSections = [ {id: "hero", visible: true}, {id: "services", visible: true}, {id: "productos", visible: true}, {id: "gallery", visible: true}, {id: "video", visible: true}, {id: "booking", visible: true}, {id: "contact", visible: true} ];
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
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [loadVideo, setLoadVideo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const accent = negocio?.accentColor || "#C8A96E";
  const primary = negocio?.primaryColor || "#0a0a0a";
  const secondary = negocio?.secondaryColor || "#1a1a1a";

  const servicios = negocio?.layoutConfig?.barberiaServices || [];
  const productos = negocio?.layoutConfig?.barberiaProducts || [];
  const galleryImages = media.filter((m: any) => m.type === "image") || [];
  const videoUrl = negocio?.layoutConfig?.videoUrl || "";
  const bookingUrl = negocio?.layoutConfig?.bookingUrl || "";
  const heroText = negocio?.layoutConfig?.heroText || "Reservá tu turno online en segundos. Sin esperas, sin llamadas. Solo vos y el mejor corte de tu vida.";
  const address = negocio?.address || negocio?.layoutConfig?.address || "";
  const mapUrl = negocio?.mapUrl || negocio?.layoutConfig?.mapUrl || "";

  // Extraer servicio names para el BookingForm
  const serviceNames = servicios.length > 0
    ? servicios.filter((s: any) => s.active !== false).map((s: any) => s.name)
    : ["Servicio General"];

  // ─── Scroll progress + close mobile menu on scroll ───
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);

      // Close mobile menu on scroll
      if (menuOpen && scrollTop > 100) {
        setMenuOpen(false);
      }

      // Active section detection
      const sections = ["servicios", "productos", "galeria", "booking", "contacto"];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  // ─── Intersection Observer for scroll animations ───
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
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const getBackgroundStyle = () => {
    if (negocio?.backgroundType === "image" && negocio?.backgroundImageUrl) {
      return { backgroundImage: `url(${negocio.backgroundImageUrl})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" as const };
    }
    if (negocio?.backgroundType === "gradient") {
      return { background: `linear-gradient(135deg, ${primary}, ${secondary})` };
    }
    return { backgroundColor: primary };
  };

  const googleFontUrl = negocio?.fontFamily && negocio.fontFamily.includes("'")
    ? `https://fonts.googleapis.com/css2?family=${negocio.fontFamily.split("'")[1].replace(/ /g, '+')}:wght@300;400;600;700;800;900&display=swap`
    : null;

  const fontStyle = {
    fontFamily: negocio?.fontFamily && negocio.fontFamily.includes("'")
      ? negocio.fontFamily
      : negocio?.fontFamily === "serif" ? "Georgia,serif" :
        negocio?.fontFamily === "mono" ? "monospace" :
        negocio?.fontFamily === "rounded" ? "'Nunito',system-ui,sans-serif" :
        "system-ui,sans-serif",
    ["--scale-hero" as any]: (negocio?.layoutConfig?.fontSizeHero || 100) / 100,
    ["--scale-titles" as any]: (negocio?.layoutConfig?.fontSizeTitles || 100) / 100,
    ["--scale-body" as any]: (negocio?.layoutConfig?.fontSizeBody || 100) / 100,
  };

  // Extraer ID de video YouTube
  const extractYouTubeId = (url: string) => {
    if (!url) return "";
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : "";
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
    `text-xs tracking-[0.15em] uppercase transition-colors duration-300 ${
      activeSection === id ? "text-[var(--accent)]" : "text-white/70 hover:text-[var(--accent)]"
    }`;

  return (
    <>
      <style>{`
        ${googleFontUrl ? `@import url('${googleFontUrl}');` : ''}
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }

        /* ─── Scroll Progress Bar ─── */
        .scroll-progress {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--accent);
          transform-origin: left;
          z-index: 9999;
          will-change: transform;
        }

        /* ─── Buttons ─── */
        .btn-reserva {
          background-color: var(--accent);
          color: #000;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .btn-reserva:hover {
          filter: brightness(1.15);
          transform: translateY(-3px);
          box-shadow: 0 12px 30px -8px var(--accent);
        }

        /* ─── Service Card ─── */
        .service-card {
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .service-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent) !important;
          box-shadow: 0 20px 40px -12px rgba(0,0,0,0.5);
        }
        .service-card:hover .service-price {
          color: var(--accent);
        }
        .service-card .service-book-btn {
          opacity: 1;
        }
        @media (min-width: 768px) {
          .service-card .service-book-btn {
            opacity: 0;
          }
          .service-card:hover .service-book-btn {
            opacity: 1;
          }
        }

        /* ─── Gallery ─── */
        .gallery-item {
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .gallery-item:hover {
          transform: scale(1.03);
        }
        .gallery-item:hover img {
          transform: scale(1.12);
        }
        .gallery-item img {
          transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* ─── Products ─── */
        .product-card {
          transition: all 0.4s ease;
        }
        .product-card:hover {
          transform: translateY(-6px);
          border-color: var(--accent) !important;
        }
        .product-card:hover img {
          transform: scale(1.08);
        }

        /* ─── Decorative ─── */
        .pattern-overlay {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .gold-line {
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
        }

        /* ─── Scroll Animations ─── */
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .animate-visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ─── Hero Animations ─── */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.7s ease forwards; }
        .delay-100 { animation-delay: 0.1s; opacity: 0; }
        .delay-200 { animation-delay: 0.2s; opacity: 0; }
        .delay-300 { animation-delay: 0.3s; opacity: 0; }
        .delay-400 { animation-delay: 0.4s; opacity: 0; }

        /* ─── Mobile Menu ─── */
        .mobile-menu-enter {
          animation: slideDown 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ─── Safe Area for bottom CTA ─── */
        .bottom-safe {
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom, 1.5rem));
        }

        /* ─── Responsive Typography ─── */
        .template-wrapper .hero-title {
          font-size: calc(clamp(2.5rem, 8vw, 7rem) * var(--scale-hero, 1)) !important;
          line-height: 0.9;
        }
        .template-wrapper h2.font-display {
          font-size: calc(clamp(1.875rem, 5vw, 3rem) * var(--scale-titles, 1)) !important;
        }
        .template-wrapper .text-\\[10px\\] { font-size: calc(10px * var(--scale-body, 1)) !important; }
        .template-wrapper .text-\\[11px\\] { font-size: calc(11px * var(--scale-body, 1)) !important; }
        .template-wrapper .text-xs { font-size: calc(0.75rem * var(--scale-body, 1)) !important; }
        .template-wrapper .text-sm { font-size: calc(0.875rem * var(--scale-body, 1)) !important; }
        .template-wrapper .text-base { font-size: calc(1rem * var(--scale-body, 1)) !important; }
        .template-wrapper .text-lg { font-size: calc(1.125rem * var(--scale-body, 1)) !important; }
        .template-wrapper .text-xl { font-size: calc(1.25rem * var(--scale-body, 1)) !important; }
        .template-wrapper .text-2xl { font-size: calc(1.5rem * var(--scale-titles, 1)) !important; }
      `}</style>

      <div
        ref={containerRef}
        className="template-wrapper min-h-screen text-[#F0EDE8] overflow-x-hidden relative scroll-smooth"
        style={{ ...getBackgroundStyle(), ...fontStyle, ["--accent" as any]: accent }}
      >
        {/* ─── Scroll Progress Bar ─── */}
        <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress / 100})` }} />

        {/* Capa de opacidad */}
        <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>
        {/* Textura sutil */}
        <div className="absolute inset-0 pattern-overlay z-0 pointer-events-none"></div>

        {/* ─── NAV ─── */}
        <nav className="fixed top-0 w-full z-50 px-4 py-3 sm:px-6 sm:py-4 md:px-12 flex justify-between items-center border-b border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {negocio?.logoUrl && <img src={negocio.logoUrl} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full border-2 border-[var(--accent)]/50 flex-shrink-0" />}
            <span className="font-display text-base sm:text-lg font-bold tracking-[0.1em] sm:tracking-[0.15em] uppercase text-[var(--accent)] truncate">
              {negocio?.name || "Tu Barbería"}
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <ul className="flex gap-8 list-none">
              <li><button onClick={() => scrollToSection("servicios")} className={navLinkClass("servicios")}>Servicios</button></li>
              {productos.length > 0 && <li><button onClick={() => scrollToSection("productos")} className={navLinkClass("productos")}>Productos</button></li>}
              {galleryImages.length > 0 && <li><button onClick={() => scrollToSection("galeria")} className={navLinkClass("galeria")}>Galería</button></li>}
              <li><button onClick={() => scrollToSection("booking")} className={navLinkClass("booking")}>Reservar</button></li>
              <li><button onClick={() => scrollToSection("contacto")} className={navLinkClass("contacto")}>Contacto</button></li>
            </ul>
            <div className="w-px h-6 bg-white/20"></div>
            <div className="flex gap-3">
              {negocio?.instagram && (
                <a href={`https://instagram.com/${negocio.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-white/70 hover:text-[var(--accent)] transition-colors">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {negocio?.facebook && (
                <a href={`https://facebook.com/${negocio.facebook.replace('@','')}`} target="_blank" rel="noreferrer" className="text-white/70 hover:text-[var(--accent)] transition-colors">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {negocio?.tiktok && (
                <a href={`https://tiktok.com/@${negocio.tiktok.replace('@','')}`} target="_blank" rel="noreferrer" className="text-white/70 hover:text-[var(--accent)] transition-colors">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </a>
              )}
              {negocio?.whatsapp && (
                <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-white/70 hover:text-[var(--accent)] transition-colors">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.88-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Desktop CTA */}
          <button onClick={handleReservarClick} className="hidden md:block btn-reserva px-6 py-2.5 text-xs tracking-[0.15em] uppercase font-bold rounded-sm">
            Reservar Turno
          </button>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5" aria-label="Menú">
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="fixed inset-x-0 top-[57px] sm:top-[65px] z-40 bg-black/95 backdrop-blur-xl border-b border-white/10 mobile-menu-enter md:hidden">
            <div className="flex flex-col p-6 gap-4">
              <button onClick={() => scrollToSection("servicios")} className="text-sm tracking-[0.15em] uppercase text-white/80 hover:text-[var(--accent)] transition-colors py-2 border-b border-white/5 text-left">Servicios</button>
              {productos.length > 0 && <button onClick={() => scrollToSection("productos")} className="text-sm tracking-[0.15em] uppercase text-white/80 hover:text-[var(--accent)] transition-colors py-2 border-b border-white/5 text-left">Productos</button>}
              {galleryImages.length > 0 && <button onClick={() => scrollToSection("galeria")} className="text-sm tracking-[0.15em] uppercase text-white/80 hover:text-[var(--accent)] transition-colors py-2 border-b border-white/5 text-left">Galería</button>}
              <button onClick={() => scrollToSection("booking")} className="text-sm tracking-[0.15em] uppercase text-white/80 hover:text-[var(--accent)] transition-colors py-2 border-b border-white/5 text-left">Reservar</button>
              <button onClick={() => scrollToSection("contacto")} className="text-sm tracking-[0.15em] uppercase text-white/80 hover:text-[var(--accent)] transition-colors py-2 text-left">Contacto</button>
              <div className="flex gap-4 pt-2">
                {negocio?.instagram && (
                  <a href={`https://instagram.com/${negocio.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-white/60 hover:text-[var(--accent)] transition-colors">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {negocio?.facebook && (
                  <a href={`https://facebook.com/${negocio.facebook.replace('@','')}`} target="_blank" rel="noreferrer" className="text-white/60 hover:text-[var(--accent)] transition-colors">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                )}
                {negocio?.tiktok && (
                  <a href={`https://tiktok.com/@${negocio.tiktok.replace('@','')}`} target="_blank" rel="noreferrer" className="text-white/60 hover:text-[var(--accent)] transition-colors">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  </a>
                )}
                {negocio?.whatsapp && (
                  <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-white/60 hover:text-[var(--accent)] transition-colors">
                    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.88-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  </a>
                )}
              </div>
              {/* Mobile menu CTA */}
              <button onClick={handleReservarClick} className="btn-reserva w-full py-3 text-sm font-bold tracking-widest uppercase rounded-lg mt-2">
                Reservar Turno
              </button>
            </div>
          </div>
        )}

                {sectionList.filter((s: any) => s.visible !== false).map((s: any) => {
          switch (s.id) {
            case 'hero': return <React.Fragment key={s.id}>
{/* ─── HERO ─── */}
        <section 
          className="relative min-h-[100svh] grid place-items-center px-4 sm:px-6 md:px-12 z-10 pt-20 bg-cover bg-center overflow-hidden"
          style={negocio?.bannerUrl ? { backgroundImage: `url(${negocio.bannerUrl})` } : { background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
        >
          {negocio?.bannerUrl ? (
            <div className="absolute inset-0 bg-black pointer-events-none -z-10" style={{ opacity: (negocio?.layoutConfig?.bannerOpacity !== undefined ? negocio.layoutConfig.bannerOpacity : 70) / 100 }}></div>
          ) : (
            <div className="absolute inset-0 pattern-overlay opacity-30 -z-10 pointer-events-none"></div>
          )}
          {/* Decorative elements */}
          <div className="absolute top-1/4 left-0 w-40 sm:w-64 h-40 sm:h-64 rounded-full blur-[100px] sm:blur-[120px] opacity-10 pointer-events-none" style={{ background: accent }}></div>
          <div className="absolute bottom-1/4 right-0 w-48 sm:w-80 h-48 sm:h-80 rounded-full blur-[120px] sm:blur-[150px] opacity-[0.08] pointer-events-none" style={{ background: accent }}></div>

          <div className="relative text-center max-w-4xl mx-auto w-full">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 sm:gap-3 text-[10px] tracking-[0.25em] uppercase text-[var(--accent)] mb-6 sm:mb-8 animate-fade-in-up">
              <div className="w-8 sm:w-12 h-px gold-line opacity-60"></div>
              {negocio?.tagline || "Barbería de autor"}
              <div className="w-8 sm:w-12 h-px gold-line opacity-60"></div>
            </div>

            {/* Title */}
            <h1 className="font-display hero-title font-black tracking-tighter text-center w-full mx-auto break-words mb-6 sm:mb-8 drop-shadow-2xl animate-fade-in-up delay-100">
              <span style={{ color: negocio?.layoutConfig?.heroTitleColor || "#ffffff" }}>
                {negocio?.layoutConfig?.heroTitle || negocio?.name || "Barbería"}
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-lg mx-auto mb-8 sm:mb-12 leading-relaxed font-body animate-fade-in-up delay-200 px-2">
              {heroText}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up delay-300 px-2">
              <button onClick={handleReservarClick} className="btn-reserva inline-flex items-center justify-center gap-3 sm:gap-4 px-8 sm:px-10 py-3.5 sm:py-4 text-xs font-bold tracking-[0.15em] uppercase rounded-sm group">
                <span>Agendar Ahora</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => scrollToSection("servicios")} className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-xs font-bold tracking-[0.15em] uppercase border border-white/20 rounded-sm text-white/80 hover:text-white hover:border-white/40 transition-all">
                Ver Servicios
              </button>
            </div>

            {/* Scroll indicator */}
            <div className="mt-12 sm:mt-16 animate-fade-in-up delay-400">
              <div className="w-px h-10 sm:h-12 mx-auto bg-gradient-to-b from-transparent via-[var(--accent)]/40 to-transparent"></div>
            </div>
          </div>
        </section>

        {/* ─── Decorative divider ─── */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-px gold-line opacity-30"></div>
        </div>
</React.Fragment>;
            case 'services': 
            case 'servicios': return <React.Fragment key={s.id}>
{/* ─── SERVICES ─── */}
        <section id="servicios" className="relative py-16 sm:py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10">
          <div className="text-center mb-10 sm:mb-16 animate-on-scroll">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent)] mb-3 sm:mb-4 font-body font-semibold">Lo que hacemos mejor</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">Nuestros <em className="italic text-[var(--accent)]">Servicios</em></h2>
            <p className="text-white/50 max-w-md mx-auto font-body text-sm sm:text-base px-2">Seleccioná el servicio que buscás y conocé la duración exacta.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {servicios.length === 0 ? (
              <div className="col-span-full p-8 sm:p-12 text-center text-white/40 bg-white/[0.02] border border-white/10 rounded-2xl font-body">
                <div className="text-4xl mb-4">✂️</div>
                <p className="font-semibold text-white/60 mb-1">Aún no hay servicios cargados</p>
                <p className="text-sm">Los servicios aparecerán aquí cuando el negocio los configure.</p>
              </div>
            ) : (
              servicios.filter((srv: any) => srv.active !== false).map((srv: any, idx: number) => (
                <div key={srv.id} className="service-card animate-on-scroll group relative flex flex-col sm:flex-row gap-4 sm:gap-6 p-6 sm:p-8 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-3xl" style={{ transitionDelay: `${idx * 50}ms` }}>
                  {/* Foto del Servicio */}
                  <div className="w-full sm:w-32 md:w-40 h-48 sm:h-auto flex-shrink-0 rounded-xl border border-white/5 overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                    {srv.imageUrl ? (
                      <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <>
                        <div className="absolute inset-0 pattern-overlay opacity-30 pointer-events-none"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-4xl text-[var(--accent)] opacity-40">✂️</div>
                      </>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0 py-1">
                    <div className="flex justify-between items-start mb-2 sm:mb-3 gap-3">
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-white group-hover:text-[var(--accent)] transition-colors line-clamp-2">{srv.name}</h3>
                      <span className="service-price font-display text-xl sm:text-2xl font-bold text-white/80 shrink-0 transition-colors">${srv.price}</span>
                    </div>
                    <p className="text-sm text-white/50 mb-4 font-body flex-1">{srv.desc || "Atención profesional y personalizada."}</p>
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-auto pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-[11px] text-white/40 tracking-widest uppercase font-bold font-body">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {srv.duration} Min
                      </div>
                      <button onClick={() => { setPreselectedService(srv.name); document.getElementById('booking')?.scrollIntoView({behavior:'smooth'}); }} className="service-book-btn text-[10px] sm:text-xs tracking-[0.1em] uppercase font-bold text-[var(--accent)] transition-opacity hover:underline underline-offset-4 flex-shrink-0 whitespace-nowrap">
                        Reservar →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
</React.Fragment>;
            case 'products': 
            case 'productos': return <React.Fragment key={s.id}>
{/* ─── PRODUCTOS ─── */}
        {productos.filter((p: any) => p.active !== false).length > 0 && (
          <section id="productos" className="relative py-16 sm:py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10">
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 mb-10 sm:mb-16">
              <div className="h-px gold-line opacity-20"></div>
            </div>
            <div className="text-center mb-10 sm:mb-16 animate-on-scroll">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent)] mb-3 sm:mb-4 font-body font-semibold">Para tu cuidado diario</p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">Llevate el <em className="italic text-[var(--accent)]">Estilo</em></h2>
              <p className="text-white/50 max-w-md mx-auto font-body text-sm sm:text-base">Productos profesionales disponibles en el local.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {productos.filter((p: any) => p.active !== false).map((prod: any, idx: number) => (
                <div key={prod.id} className="product-card animate-on-scroll bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden group text-center p-4 sm:p-5" style={{ transitionDelay: `${idx * 50}ms` }}>
                  <div className="w-full aspect-square mb-3 sm:mb-4 rounded-xl overflow-hidden bg-white/5 border border-white/5">
                    {prod.imageUrl
                      ? <img src={prod.imageUrl} className="w-full h-full object-cover transition-transform duration-500" alt={prod.name} loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center text-white/15">
                          <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                    }
                  </div>
                  <h3 className="font-bold text-white mb-1 truncate font-body text-sm sm:text-base">{prod.name}</h3>
                  {prod.description && <p className="text-xs text-white/40 mb-2 line-clamp-2 font-body">{prod.description}</p>}
                  <p className="text-[var(--accent)] font-bold text-lg font-display">${prod.price}</p>
                </div>
              ))}
            </div>
          </section>
        )}
</React.Fragment>;
            case 'gallery': 
            case 'galeria': return <React.Fragment key={s.id}>
{/* ─── GALERÍA ─── */}
        {galleryImages.length > 0 && (
          <section id="galeria" className="relative py-16 sm:py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10">
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 mb-10 sm:mb-16">
              <div className="h-px gold-line opacity-20"></div>
            </div>
            <div className="text-center mb-10 sm:mb-16 animate-on-scroll">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent)] mb-3 sm:mb-4 font-body font-semibold">Nuestro portfolio</p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">Nuestros <em className="italic text-[var(--accent)]">Trabajos</em></h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
              {galleryImages.slice(0, 9).map((img: any, i: number) => (
                <div key={img.id || i} className={`gallery-item animate-on-scroll overflow-hidden rounded-xl border border-white/10 group ${i === 0 ? "col-span-2 md:col-span-2 md:row-span-2" : ""}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className={`${i === 0 ? "aspect-square" : "aspect-square"} overflow-hidden`}>
                    <img src={img.url} alt={`Trabajo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
</React.Fragment>;
            case 'video': return <React.Fragment key={s.id}>
{/* ─── VIDEO ─── */}
        {videoUrl && extractYouTubeId(videoUrl) && (
          <section className="relative py-16 sm:py-24 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto z-10">
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 mb-10 sm:mb-16">
              <div className="h-px gold-line opacity-20"></div>
            </div>
            <div className="text-center mb-8 sm:mb-12 animate-on-scroll">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent)] mb-3 sm:mb-4 font-body font-semibold">Conocenos mejor</p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white">Nuestro <em className="italic text-[var(--accent)]">Espacio</em></h2>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden border-2 border-[var(--accent)]/20 shadow-2xl shadow-black/50 animate-on-scroll relative group cursor-pointer" onClick={() => setLoadVideo(true)}>
              {!loadVideo ? (
                <>
                  <img src={`https://img.youtube.com/vi/${extractYouTubeId(videoUrl)}/maxresdefault.jpg`} alt="Video Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--accent)] text-black rounded-full flex items-center justify-center pl-1 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </>
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}?autoplay=1`}
                  className="w-full h-full border-none"
                  allowFullScreen
                  title="Video del negocio"
                />
              )}
            </div>
          </section>
        )}
</React.Fragment>;
            case 'booking': return <React.Fragment key={s.id}>
{/* ─── BOOKING ─── */}
        <section id="booking" className="relative py-16 sm:py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 mb-10 sm:mb-16">
            <div className="h-px gold-line opacity-20"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start">
            {/* Left side: Text */}
            <div className="flex flex-col justify-center animate-on-scroll">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent)] mb-3 sm:mb-4 font-body font-semibold">Agenda online</p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">Reservá tu <em className="italic text-[var(--accent)]">Turno</em></h2>
              <p className="text-white/50 mb-6 sm:mb-8 leading-relaxed font-body max-w-md text-sm sm:text-base">
                Elegí el servicio que necesitás, la fecha y hora que más te convenga. Te confirmamos al instante.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-[var(--accent)]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <p className="text-white text-xs sm:text-sm font-semibold font-body">Confirmación inmediata</p>
                    <p className="text-white/40 text-[11px] sm:text-xs font-body">Recibirás la confirmación al instante</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-[var(--accent)]"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <p className="text-white text-xs sm:text-sm font-semibold font-body">Sin esperas</p>
                    <p className="text-white/40 text-[11px] sm:text-xs font-body">Llegá a tu hora y listo</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-[var(--accent)]"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </div>
                  <div>
                    <p className="text-white text-xs sm:text-sm font-semibold font-body">Sin llamadas</p>
                    <p className="text-white/40 text-[11px] sm:text-xs font-body">Reservá 100% online, 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Booking Form */}
            <div className="animate-on-scroll" style={{ transitionDelay: "150ms" }}>
              {businessId ? (
                <BookingForm
                  businessId={businessId}
                  primaryColor={accent}
                  secondaryColor={accent}
                  services={serviceNames}
                  theme="dark"
                  preselectedService={preselectedService}
                  variant="barberia"
                />
              ) : (
                <div className="rounded-3xl p-6 sm:p-8 text-center bg-white/5 backdrop-blur-md border border-white/10">
                  <p className="text-white/50 font-body">Para reservar, contactanos por WhatsApp</p>
                  {negocio?.whatsapp && (
                    <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="btn-reserva inline-flex items-center gap-2 mt-4 px-6 py-3 text-xs font-bold tracking-[0.15em] uppercase rounded-sm">
                      Escribinos por WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
</React.Fragment>;
            default: return null;
          }
        })}
        
{/* ─── FOOTER / CONTACTO ─── */}
        <footer id="contacto" className="border-t border-white/10 py-12 sm:py-16 px-4 sm:px-6 md:px-12 bg-black/80 backdrop-blur-xl z-10 relative mt-12">
          <div className="max-w-7xl mx-auto">

            {/* Map section */}
            {mapUrl && (
              <div className="mb-8 sm:mb-12 rounded-2xl overflow-hidden border border-white/10 h-48 sm:h-64">
                <iframe src={mapUrl} className="w-full h-full border-none" allowFullScreen loading="lazy" title="Ubicación"></iframe>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
              {/* Brand */}
              <div className="sm:col-span-2 md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  {negocio?.logoUrl && <img src={negocio.logoUrl} alt="Logo" className="w-10 h-10 object-cover rounded-full border border-[var(--accent)]/50" />}
                  <span className="font-display text-lg sm:text-xl font-bold tracking-widest uppercase text-[var(--accent)]">{negocio?.name || "Barbería"}</span>
                </div>
                <p className="text-white/40 text-sm font-body leading-relaxed">
                  {negocio?.description || negocio?.tagline || "Tu barbería de confianza. Cortes premium y atención personalizada."}
                </p>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-display text-lg font-bold text-white mb-4">Contacto</h3>
                <div className="space-y-3 font-body">
                  {negocio?.phone && (
                    <a href={`tel:${negocio.phone}`} className="flex items-center gap-3 text-white/60 hover:text-[var(--accent)] transition-colors text-sm">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      {negocio.phone}
                    </a>
                  )}
                  {negocio?.email && negocio?.layoutConfig?.showEmailFooter !== false && (
                    <a href={`mailto:${negocio.email}`} className="flex items-center gap-3 text-white/60 hover:text-[var(--accent)] transition-colors text-sm">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      {negocio.email}
                    </a>
                  )}
                  {address && (
                    <div className="flex items-start gap-3 text-white/60 text-sm">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {address}
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="font-display text-lg font-bold text-white mb-4">Seguinos</h3>
                <div className="flex gap-3">
                  {negocio?.instagram && (
                    <a href={`https://instagram.com/${negocio.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:bg-[var(--accent)] hover:text-black transition-all border border-white/10">
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  )}
                  {negocio?.facebook && (
                    <a href={`https://facebook.com/${negocio.facebook.replace('@','')}`} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:bg-[var(--accent)] hover:text-black transition-all border border-white/10">
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  )}
                  {negocio?.tiktok && (
                    <a href={`https://tiktok.com/@${negocio.tiktok.replace('@','')}`} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:bg-[var(--accent)] hover:text-black transition-all border border-white/10">
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                    </a>
                  )}
                  {negocio?.whatsapp && (
                    <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:bg-[var(--accent)] hover:text-black transition-all border border-white/10">
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.88-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                    </a>
                  )}
                </div>
                <div className="mt-6">
                  <button onClick={handleReservarClick} className="btn-reserva px-6 py-3 text-xs tracking-[0.12em] uppercase font-bold rounded-sm">
                    Reservar Turno
                  </button>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-white/5 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              <p className="text-xs text-white/30 font-body">© {new Date().getFullYear()} {negocio?.name || "Barbería"}. Todos los derechos reservados.</p>
              <p className="text-[10px] text-white/20 font-body">Creado con MiniWebs</p>
            </div>
          </div>
        </footer>

        {/* Botón Flotante Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 w-full px-4 sm:px-6 z-[100] bottom-safe bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6 pb-4">
          <button onClick={handleReservarClick} className="btn-reserva w-full py-3.5 text-sm font-bold tracking-widest uppercase rounded-xl shadow-2xl flex items-center justify-center gap-2">
            Reservar Turno
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </button>
        </div>

      </div>


    </>
  );
}