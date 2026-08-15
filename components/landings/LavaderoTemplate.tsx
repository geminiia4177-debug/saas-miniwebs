"use client";

import React, { useState, useEffect, useRef } from "react";
import BookingForm from "@/app/[subdomain]/BookingForm";
import styles from "./LavaderoTemplate.module.css";

export default function LavaderoTemplate(props: { negocio: any; media?: any[]; businessId?: string; sections?: any[] }) {
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState<number | null>(null);
  const [preselectedService, setPreselectedService] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  
  const accent = negocio?.accentColor || "#38bdf8"; // Light blue glow default for dark theme
  const primary = negocio?.primaryColor || "#09090b"; // zinc-950
  const secondary = negocio?.secondaryColor || "#18181b"; // zinc-900

  const vehiculos = negocio?.layoutConfig?.vehiculos || negocio?.layoutConfig?.lavaderoVehiculos || [];
  const productos = negocio?.layoutConfig?.barberiaProducts || negocio?.layoutConfig?.products || [];
  const galleryImages = media.filter((m: any) => m.type === "image") || [];
  const videoUrl = negocio?.layoutConfig?.videoUrl || "";
  const bookingUrl = negocio?.layoutConfig?.bookingUrl || "";
  const heroText = negocio?.layoutConfig?.heroText || "Lavado premium y detailing profesional para tu vehículo. Excelencia en cada detalle.";
  const address = negocio?.address || negocio?.layoutConfig?.address || "";
  const mapUrl = negocio?.mapUrl || negocio?.layoutConfig?.mapUrl || "";

  // Extraer servicio names para el BookingForm (fallback)
  const serviceNames = selectedVehicleIdx !== null && vehiculos[selectedVehicleIdx]
    ? (vehiculos[selectedVehicleIdx].products || []).map((s: any) => s.name)
    : vehiculos.flatMap((v: any) => (v.products || []).map((s: any) => s.name));

  // Generar categorías para el BookingForm
  const bookingCategories: { name: string; items: string[] }[] = [];
  vehiculos.forEach((v: any) => {
    if (v.products && v.products.length > 0) {
      bookingCategories.push({
        name: v.name,
        items: v.products.map((p: any) => p.name)
      });
    }
  });
  if (productos.length > 0) {
    bookingCategories.push({
      name: "Productos",
      items: productos.map((p: any) => p.name)
    });
  }

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
    const elements = document.querySelectorAll(`.${styles.animateOnScroll}`);
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selectedVehicleIdx]);

  const getBackgroundStyle = () => {
    if (negocio?.backgroundType === "image" && negocio?.backgroundImageUrl) {
      return { backgroundImage: `url(${negocio.backgroundImageUrl})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" as const };
    }
    return { backgroundColor: "#09090b" }; // Fuerza oscuro premium
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
    `text-xs tracking-[0.15em] uppercase font-semibold transition-all duration-300 ${
      activeSection === id ? "text-white" : "text-white/50 hover:text-white"
    }`;

  return (
    <>
      <style>{`
        ${googleFontUrl ? `@import url('${googleFontUrl}');` : ''}
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        
        .font-display { font-family: 'Outfit', sans-serif; }
        .font-body { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ─── Base Dark Theme Overrides ─── */
        body { background-color: #09090b; color: #ffffff; }

        /* ─── Typography Scales ─── */
        .template-wrapper .hero-title {
          font-size: calc(clamp(3rem, 10vw, 8rem) * var(--scale-hero, 1)) !important;
          line-height: 0.9;
        }
        .template-wrapper h2.font-display {
          font-size: calc(clamp(2rem, 6vw, 4rem) * var(--scale-titles, 1)) !important;
        }
      `}</style>

      <div
        ref={containerRef}
        className="template-wrapper min-h-screen text-white bg-zinc-950 overflow-x-hidden relative scroll-smooth selection:bg-[var(--accent)] selection:text-black"
        style={{ ...getBackgroundStyle(), ...fontStyle, ["--accent" as any]: accent }}
      >
        <div className={`${styles.scrollProgress}`} style={{ width: `${scrollProgress}%` }} />

        {/* ─── Global Background Effects ─── */}
        <div className={`absolute inset-0 ${styles.cyberGrid} z-0 pointer-events-none opacity-50`}></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-20 blur-[120px] pointer-events-none" style={{ background: accent }}></div>
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-[0.15] blur-[150px] pointer-events-none" style={{ background: accent }}></div>

        {/* ─── NAV ─── */}
        <nav className="fixed top-0 w-full z-50 px-4 py-4 md:px-12 flex justify-between items-center bg-zinc-950/50 backdrop-blur-2xl border-b border-white/5 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            {negocio?.logoUrl && <img src={negocio.logoUrl} alt="Logo" className="w-10 h-10 object-cover rounded-full border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] flex-shrink-0" />}
            <span className="font-display text-lg font-black tracking-[0.2em] uppercase text-white truncate">
              {negocio?.name || "Premium Wash"}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <ul className="flex gap-8 list-none">
              <li><button onClick={() => scrollToSection("servicios")} className={navLinkClass("servicios")}>Servicios</button></li>
              {productos.length > 0 && <li><button onClick={() => scrollToSection("productos")} className={navLinkClass("productos")}>Productos</button></li>}
              {galleryImages.length > 0 && <li><button onClick={() => scrollToSection("galeria")} className={navLinkClass("galeria")}>Galería</button></li>}
              <li><button onClick={() => scrollToSection("contacto")} className={navLinkClass("contacto")}>Contacto</button></li>
            </ul>
            <div className="w-px h-6 bg-white/10"></div>
            <button onClick={handleReservarClick} className={`${styles.btnReserva} px-6 py-2.5 text-xs tracking-[0.15em] uppercase font-bold rounded-full`}>
              Reservar
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5" aria-label="Menú">
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 bg-zinc-950/95 backdrop-blur-3xl pt-24 px-6 md:hidden">
            <div className="flex flex-col gap-6">
              <button onClick={() => scrollToSection("servicios")} className="text-xl font-display font-bold tracking-widest uppercase text-white/80 hover:text-white transition-colors text-left">Servicios</button>
              {productos.length > 0 && <button onClick={() => scrollToSection("productos")} className="text-xl font-display font-bold tracking-widest uppercase text-white/80 hover:text-white transition-colors text-left">Productos</button>}
              {galleryImages.length > 0 && <button onClick={() => scrollToSection("galeria")} className="text-xl font-display font-bold tracking-widest uppercase text-white/80 hover:text-white transition-colors text-left">Galería</button>}
              <button onClick={() => scrollToSection("contacto")} className="text-xl font-display font-bold tracking-widest uppercase text-white/80 hover:text-white transition-colors text-left">Contacto</button>
              <button onClick={handleReservarClick} className={`${styles.btnReserva} w-full py-4 text-sm font-bold tracking-widest uppercase rounded-xl mt-8`}>
                Agendar Turno
              </button>
            </div>
          </div>
        )}

        {/* ─── DYNAMIC SECTIONS ─── */}
        {sectionList.filter((s: any) => s.visible !== false).map((s: any) => {
          switch (s.id) {
            case 'hero': return <React.Fragment key={s.id}>
        {/* ─── HERO ─── */}
        <section 
          className="relative min-h-[100svh] flex flex-col justify-center px-4 sm:px-6 md:px-12 z-10 pt-20 bg-cover bg-center"
          style={negocio?.bannerUrl ? { backgroundImage: `url(${negocio.bannerUrl})` } : {}}
        >
          {negocio?.bannerUrl && <div className="absolute inset-0 bg-zinc-950/80 pointer-events-none -z-10 backdrop-blur-[2px]"></div>}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/30 via-transparent to-zinc-950 pointer-events-none -z-10"></div>

          <div className="relative text-center max-w-5xl mx-auto w-full flex flex-col items-center">
            <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 ${styles.animateHero}`}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }}></span>
              <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-white/80 font-semibold">
                {negocio?.tagline || "Premium Auto Detailing"}
              </span>
            </div>

            <h1 className={`font-display hero-title font-black uppercase text-center w-full mx-auto break-words mb-8 drop-shadow-2xl ${styles.animateHero} ${styles.delay100}`} style={{ color: negocio?.layoutConfig?.heroTitleColor || "#ffffff" }}>
              {negocio?.layoutConfig?.heroTitle || negocio?.name || "Detailing."}
            </h1>

            <p className={`text-sm sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 font-body ${styles.animateHero} ${styles.delay200}`}>
              {heroText}
            </p>

            <div className={`flex flex-col sm:flex-row gap-4 justify-center ${styles.animateHero} ${styles.delay300} w-full sm:w-auto`}>
              <button onClick={handleReservarClick} className={`${styles.btnReserva} w-full sm:w-auto px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-full group flex items-center justify-center gap-3`}>
                Agendar Cita
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button onClick={() => scrollToSection("servicios")} className="w-full sm:w-auto px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all">
                Explorar
              </button>
            </div>
          </div>
        </section>
        </React.Fragment>;

            case 'services': 
            case 'servicios': return <React.Fragment key={s.id}>
        {/* ─── SERVICES ─── */}
        <section id="servicios" className="relative py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10">
          <div className={`text-center mb-16 ${styles.animateOnScroll}`}>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 uppercase tracking-tight">
              {selectedVehicleIdx === null ? "Seleccioná tu Vehículo" : vehiculos[selectedVehicleIdx]?.name}
            </h2>
            <div className="h-1 w-24 mx-auto rounded-full" style={{ background: accent }}></div>
          </div>

          {selectedVehicleIdx === null ? (
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {vehiculos.length === 0 ? (
                <div className={`w-full p-12 text-center text-white/40 ${styles.glassCard} rounded-3xl font-body`}>
                  No hay vehículos cargados
                </div>
              ) : (
                vehiculos.map((v: any, idx: number) => (
                  <button key={v.id || idx} onClick={() => setSelectedVehicleIdx(idx)} className={`${styles.glassCard} ${styles.animateOnScroll} group relative flex flex-col items-center gap-6 p-8 rounded-3xl overflow-hidden w-[45%] sm:w-auto flex-1 min-w-[140px] sm:min-w-[220px] max-w-[280px]`} style={{ transitionDelay: `${idx * 50}ms` }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {v.imageUrl ? (
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-white/10 bg-white/5 p-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <img src={v.imageUrl} alt={v.name} className="w-full h-full object-contain filter drop-shadow-lg" />
                      </div>
                    ) : (
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        {v.emoji || "🚗"}
                      </div>
                    )}
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white group-hover:text-[var(--accent)] transition-colors relative z-10">{v.name}</h3>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className={styles.animateHero}>
              <button onClick={() => setSelectedVehicleIdx(null)} className={`mb-8 flex items-center gap-3 text-xs font-bold tracking-widest uppercase text-white/50 hover:text-white transition-colors border border-white/10 rounded-full px-6 py-2 ${styles.glassCard} inline-flex`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Cambiar Vehículo
              </button>
              
              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                {!(vehiculos[selectedVehicleIdx]?.products?.length) ? (
                  <div className={`col-span-full p-12 text-center text-white/40 ${styles.glassCard} rounded-3xl font-body`}>
                    Aún no hay lavados para este vehículo
                  </div>
                ) : (
                  vehiculos[selectedVehicleIdx].products.map((srv: any, idx: number) => (
                    <div key={srv.id || idx} className={`${styles.glassCard} ${styles.serviceCardPremium} group flex flex-col sm:flex-row gap-6 p-6 rounded-3xl`}>
                      {srv.imageUrl && (
                        <div className="w-full sm:w-40 h-48 sm:h-auto flex-shrink-0 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10">
                          <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:opacity-80" loading="lazy" />
                        </div>
                      )}
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2 gap-4">
                          <h3 className="font-display text-2xl font-bold text-white group-hover:text-[var(--accent)] transition-colors">{srv.name}</h3>
                          <span className="service-price font-display text-2xl font-black text-white shrink-0 transition-colors">${srv.price}</span>
                        </div>
                        <p className="text-sm text-white/50 mb-6 font-body flex-1 leading-relaxed">{srv.description || srv.desc || "Tratamiento premium al detalle."}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2 text-xs text-white/40 tracking-widest uppercase font-bold font-display">
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                            {srv.duration || 30} Min
                          </div>
                          <button onClick={() => { setPreselectedService(srv.name); document.getElementById('booking')?.scrollIntoView({behavior:'smooth'}); }} className="text-xs tracking-[0.2em] uppercase font-bold text-[var(--accent)] hover:text-white transition-colors">
                            Reservar →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
        </React.Fragment>;

            case 'products': 
            case 'productos': return <React.Fragment key={s.id}>
        {/* ─── PRODUCTOS ─── */}
        {productos.filter((p: any) => p.active !== false).length > 0 && (
          <section id="productos" className="relative py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10 border-t border-white/5">
            <div className={`text-center mb-16 ${styles.animateOnScroll}`}>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 uppercase tracking-tight">Car <span style={{color: accent}}>Care</span></h2>
              <p className="text-white/50 max-w-md mx-auto font-body text-lg">Mantené el brillo de tu vehículo con nuestros productos oficiales.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {productos.filter((p: any) => p.active !== false).map((prod: any, idx: number) => (
                <div key={prod.id} className={`${styles.glassCard} ${styles.animateOnScroll} rounded-3xl p-5 group flex flex-col text-center`} style={{ transitionDelay: `${idx * 50}ms` }}>
                  <div className="w-full aspect-square mb-6 rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {prod.imageUrl
                      ? <img src={prod.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={prod.name} loading="lazy" />
                      : <div className="w-full h-full flex items-center justify-center text-white/10"><svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>
                    }
                  </div>
                  <h3 className="font-bold text-white mb-2 font-body text-lg">{prod.name}</h3>
                  {prod.description && <p className="text-sm text-white/40 mb-4 line-clamp-2 font-body flex-1">{prod.description}</p>}
                  <p className="font-black text-2xl font-display mt-auto" style={{color: accent}}>${prod.price}</p>
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
          <section id="galeria" className="relative py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10 border-t border-white/5">
            <div className={`text-center mb-16 ${styles.animateOnScroll}`}>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 uppercase tracking-tight">Portfolio</h2>
              <p className="text-white/50 max-w-md mx-auto font-body text-lg">Resultados que hablan por sí solos.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {galleryImages.slice(0, 9).map((img: any, i: number) => (
                <div key={img.id || i} className={`${styles.galleryItem} ${styles.animateOnScroll} overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 group ${i === 0 ? "col-span-2 md:col-span-2 md:row-span-2" : ""}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className={`${i === 0 ? "aspect-square md:aspect-auto md:h-full" : "aspect-square"} relative`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                    <img src={img.url} alt={`Trabajo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        </React.Fragment>;

            case 'video': {
              const currentVideoUrl = s.config?.youtubeUrl || videoUrl;
              return <React.Fragment key={s.id}>
        {/* ─── VIDEO ─── */}
        {currentVideoUrl && extractYouTubeId(currentVideoUrl) && (
          <section className="relative py-24 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto z-10 border-t border-white/5">
            <div className={`aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative ${styles.animateOnScroll} group bg-black`}>
              <div className="absolute inset-0 bg-[var(--accent)] opacity-20 blur-[100px] -z-10 mix-blend-screen"></div>
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(currentVideoUrl)}?controls=1&rel=0`}
                className="w-full h-full border-none relative z-10"
                allowFullScreen
                title="Video del negocio"
                loading="lazy"
              />
            </div>
          </section>
        )}
        </React.Fragment>;
            }

            case 'booking': return <React.Fragment key={s.id}>
        {/* ─── BOOKING ─── */}
        <section id="booking" className="relative py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20 items-center">
            <div className={`flex flex-col ${styles.animateOnScroll}`}>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight leading-none">
                Asegurá <br/><span style={{color: accent}}>tu lugar.</span>
              </h2>
              <p className="text-white/50 mb-10 font-body text-lg max-w-md">
                Sistema de reservas 100% online. Elegí tu servicio, seleccioná el horario y dejá tu vehículo en manos expertas.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "Confirmación Inmediata", desc: "Recibís la confirmación por email en el acto." },
                  { title: "Sin Esperas", desc: "Tu turno es exclusivo. Llegás y te atendemos." },
                  { title: "Atención Premium", desc: "Productos importados y personal capacitado." }
                ].map((item, i) => (
                  <div key={i} className={`flex items-start gap-4 p-4 ${styles.glassCard} rounded-2xl`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${accent}40, transparent)`, border: `1px solid ${accent}50` }}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{color: accent}}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div>
                      <h4 className="text-white font-bold font-display text-lg mb-1">{item.title}</h4>
                      <p className="text-white/40 text-sm font-body">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.animateOnScroll} relative`} style={{ transitionDelay: "200ms" }}>
              <div className="absolute -inset-4 bg-[var(--accent)] opacity-10 blur-[50px] rounded-full z-0 pointer-events-none"></div>
              <div className={`relative z-10 ${styles.glassCard} rounded-[2rem] p-2 border border-white/10 shadow-2xl`}>
                {businessId ? (
                  <div className="bg-zinc-950 rounded-[1.8rem] overflow-hidden">
                    <BookingForm
                      businessId={businessId}
                      primaryColor={accent}
                      secondaryColor={secondary}
                      services={serviceNames}
                      categories={selectedVehicleIdx === null ? bookingCategories : undefined}
                      theme="dark"
                      preselectedService={preselectedService}
                      variant="lavadero"
                    />
                  </div>
                ) : (
                  <div className="p-12 text-center bg-zinc-950 rounded-[1.8rem]">
                    <h3 className="text-white font-display text-2xl font-bold mb-4">Reservas por WhatsApp</h3>
                    <p className="text-white/50 font-body mb-8">Escribinos para coordinar tu turno.</p>
                    {negocio?.whatsapp && (
                      <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className={`${styles.btnReserva} inline-flex items-center gap-3 px-8 py-4 text-sm font-bold tracking-[0.15em] uppercase rounded-full`}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                        Contactar
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        </React.Fragment>;

            default: return null;
          }
        })}
        
        {/* ─── FOOTER / CONTACTO ─── */}
        <footer id="contacto" className="border-t border-white/5 py-16 px-4 sm:px-6 md:px-12 bg-black relative mt-20 z-10">
          <div className={`absolute inset-0 ${styles.cyberGrid} opacity-20 pointer-events-none`}></div>
          <div className="max-w-7xl mx-auto relative z-10">
            {mapUrl && (
              <div className="mb-16 rounded-3xl overflow-hidden border border-white/10 h-64 sm:h-80 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700">
                <iframe src={mapUrl} className="w-full h-full border-none" allowFullScreen loading="lazy" title="Ubicación"></iframe>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 sm:gap-16">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  {negocio?.logoUrl && <img src={negocio.logoUrl} alt="Logo" className="w-12 h-12 object-cover rounded-full border border-white/20" />}
                  <span className="font-display text-2xl font-black tracking-widest uppercase text-white">{negocio?.name || "Premium Wash"}</span>
                </div>
                <p className="text-white/40 text-sm font-body leading-relaxed max-w-sm">
                  {negocio?.description || negocio?.tagline || "Pasión por los detalles. Cuidado extremo para tu vehículo."}
                </p>
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-white mb-6 uppercase tracking-widest">Contacto</h3>
                <div className="space-y-4 font-body">
                  {negocio?.phone && (
                    <a href={`tel:${negocio.phone}`} className="flex items-center gap-3 text-white/50 hover:text-white transition-colors text-sm">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      {negocio.phone}
                    </a>
                  )}
                  {negocio?.email && negocio?.layoutConfig?.showEmailFooter !== false && (
                    <a href={`mailto:${negocio.email}`} className="flex items-center gap-3 text-white/50 hover:text-white transition-colors text-sm">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      {negocio.email}
                    </a>
                  )}
                  {address && (
                    <div className="flex items-start gap-3 text-white/50 text-sm">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mt-0.5 flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {address}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-white mb-6 uppercase tracking-widest">Redes</h3>
                <div className="flex flex-wrap gap-3">
                  {negocio?.instagram && (
                    <a href={`https://instagram.com/${negocio.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className={`w-12 h-12 rounded-full ${styles.glassCard} flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all`}>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  )}
                  {negocio?.facebook && (
                    <a href={`https://facebook.com/${negocio.facebook.replace('@','')}`} target="_blank" rel="noreferrer" className={`w-12 h-12 rounded-full ${styles.glassCard} flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all`}>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                  )}
                  {negocio?.tiktok && (
                    <a href={`https://tiktok.com/@${negocio.tiktok.replace('@','')}`} target="_blank" rel="noreferrer" className={`w-12 h-12 rounded-full ${styles.glassCard} flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all`}>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white/30 font-body">© {new Date().getFullYear()} {negocio?.name || "Premium Wash"}. Todos los derechos reservados.</p>
              <p className="text-xs text-white/20 font-body">Creado con MiniWebs</p>
            </div>
          </div>
        </footer>

        {/* Floating Mobile Button */}
        <div className="md:hidden fixed bottom-0 left-0 w-full px-6 z-[100] pb-6 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pt-12 pointer-events-none">
          <button onClick={handleReservarClick} className={`${styles.btnReserva} w-full py-4 text-sm font-bold tracking-[0.2em] uppercase rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3 pointer-events-auto`}>
            Reservar Turno
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </button>
        </div>

      </div>
    </>
  );
}