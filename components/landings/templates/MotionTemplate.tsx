"use client";

import React, { useState, useEffect } from "react";
import { BusinessDataContract } from "@/lib/templates/contract";
import { getThemeDefinition, generateThemeVariables } from "@/lib/templates/themes";
import { TemplateProps } from "./ClassicTemplate";

export default function MotionTemplate({ data, bookingElement }: TemplateProps) {
  const { identity, contact, branding, hero, services, gallery, schedule, staff, testimonials, social, booking, design } = data;
  const theme = getThemeDefinition(design.themeId, "motion");
  const themeVars = generateThemeVariables(theme, branding.primaryColor, branding.secondaryColor);

  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const primary = branding.primaryColor || theme.visuals.defaultPrimary;
  const secondary = branding.secondaryColor || theme.visuals.defaultSecondary;
  const intensity = design.animationIntensity || "balanced";

  // Animation speed/scale factor based on intensity
  const animSpeed = intensity === "subtle" ? "duration-500" : (intensity === "dynamic" ? "duration-200" : "duration-300");
  const hoverScale = intensity === "subtle" ? "hover:scale-[1.01]" : (intensity === "dynamic" ? "hover:scale-[1.04]" : "hover:scale-[1.02]");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getWhatsAppLink = (serviceName?: string) => {
    const phone = contact.whatsapp.replace(/\D/g, "");
    const text = serviceName
      ? `Hola ${identity.name}, quiero reservar un turno para: ${serviceName}`
      : `Hola ${identity.name}, me gustaría consultar por turnos disponibles.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const buttonClass = branding.buttonStyle === "pill" ? "rounded-full" : (branding.buttonStyle === "square" ? "rounded-none" : "rounded-2xl");

  // Dynamic business status (Open / Closed now)
  const isBusinessOpenNow = () => {
    try {
      const now = new Date();
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const currentDayKey = days[now.getDay()];
      const todaySchedule = schedule.find(s => s.day === currentDayKey);
      if (!todaySchedule || !todaySchedule.enabled) return { open: false, text: "Cerrado hoy • Turnos online" };

      const [openH, openM] = todaySchedule.open.split(":").map(Number);
      const [closeH, closeM] = todaySchedule.close.split(":").map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes = openH * 60 + (openM || 0);
      const closeMinutes = closeH * 60 + (closeM || 0);

      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        return { open: true, text: `Abierto ahora hasta las ${todaySchedule.close} hs` };
      }
      return { open: false, text: "Cerrado ahora • Agendá para mañana" };
    } catch {
      return { open: true, text: "Turnos online disponibles" };
    }
  };

  const status = isBusinessOpenNow();

  // Extract unique categories from services
  const categories = ["all", ...Array.from(new Set(services.map((s) => s.category).filter(Boolean)))];
  const filteredServices = activeCategory === "all"
    ? services
    : services.filter((s) => s.category === activeCategory);

  return (
    <div
      className="min-h-screen bg-[#090d16] text-slate-100 font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white"
      style={{ ...themeVars, fontFamily: branding.font }}
    >
      {/* ── AMBIENT GLOW BACKDROPS (GPU Accelerated) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] opacity-25"
          style={{ background: primary }}
        />
        <div
          className="absolute top-1/3 -right-40 w-96 h-96 rounded-full blur-[140px] opacity-20"
          style={{ background: secondary }}
        />
        <div
          className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full blur-[160px] opacity-15"
          style={{ background: primary }}
        />
      </div>

      {/* ── NAVBAR ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#090d16]/80 backdrop-blur-xl border-b border-white/10 shadow-lg py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3 group">
            {identity.logo ? (
              <img
                src={identity.logo}
                alt={identity.name}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover ring-2 ring-white/10 group-hover:ring-indigo-400/50 transition-all"
              />
            ) : (
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-extrabold text-lg text-white shadow-lg ring-2 ring-white/10"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                {identity.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight block text-white drop-shadow-sm">
                {identity.name}
              </span>
              <span className="text-[10px] text-indigo-300/80 font-medium tracking-wider uppercase hidden sm:block">
                {identity.tagline || "Experiencia Digital"}
              </span>
            </div>
          </a>

          {/* Live Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${status.open ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span className="text-slate-300 font-semibold">{status.text}</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#servicios" className="hover:text-white transition-colors">Servicios</a>
            {gallery.length > 0 && <a href="#galeria" className="hover:text-white transition-colors">Galería</a>}
            <a href="#horarios" className="hover:text-white transition-colors">Horarios</a>
            <a href="#testimonios" className="hover:text-white transition-colors">Reseñas</a>
            <a
              href="#reservar"
              className={`px-6 py-2.5 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:opacity-95 transition-all ${hoverScale} ${buttonClass}`}
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              {hero.ctaText || "Reservar Turno"}
            </a>
          </nav>
        </div>
      </header>

      {/* ── HERO SECTION WITH DYNAMIC PARALLAX ── */}
      <section id="hero" className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 px-4 sm:px-6 z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-inner text-xs font-bold">
            <span className={`w-2 h-2 rounded-full ${status.open ? "bg-emerald-400 animate-pulse" : "bg-indigo-400"}`} />
            <span className="text-indigo-200">{hero.badge || status.text}</span>
          </div>

          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text"
            style={{
              backgroundImage: `linear-gradient(135deg, #ffffff 30%, ${secondary} 100%)`,
            }}
          >
            {hero.title}
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#reservar"
              className={`w-full sm:w-auto px-9 py-4 text-white font-extrabold text-base shadow-xl hover:shadow-2xl transition-all ${hoverScale} ${buttonClass}`}
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              {hero.ctaText}
            </a>
            <a
              href="#servicios"
              className={`w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-base backdrop-blur-lg transition-all ${hoverScale} ${buttonClass}`}
            >
              {hero.ctaSecondary || "Explorar Servicios"}
            </a>
          </div>

          {/* Social Proof Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-amber-400 font-bold">★ 4.9/5</span>
              <span>en Google</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-emerald-400 font-bold">⚡ Inmediato</span>
              <span>Confirmación por WhatsApp</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-indigo-400 font-bold">🛡️ 100% Sin espera</span>
              <span>Horarios puntuales</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { label: "Servicios", val: `${services.length}+` },
              { label: "Calificación", val: "5.0 ★" },
              { label: "Atención", val: "Personalizada" },
              { label: "Reserva", val: "100% Online" },
            ].map((stat, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                <div className="text-base sm:text-lg font-black text-white">{stat.val}</div>
                <div className="text-[11px] font-medium text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES WITH INTERACTIVE TABS & CARDS ── */}
      <section id="servicios" className="relative py-20 px-4 sm:px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 block mb-2">
                Experiencias & Tratamientos
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Nuestros Servicios
              </h2>
            </div>

            {/* Filter pills if multiple categories */}
            {categories.length > 2 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as string)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeCategory === cat
                        ? "bg-white text-slate-900 shadow-md"
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {cat === "all" ? "Todos" : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((srv) => {
              const isHovered = hoveredCard === srv.id;
              return (
                <div
                  key={srv.id}
                  onMouseEnter={() => setHoveredCard(srv.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setSelectedService(srv.name)}
                  className={`group relative p-6 rounded-3xl bg-white/[0.03] border transition-all ${animSpeed} ${hoverScale} cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isHovered
                      ? "border-indigo-500/50 bg-white/[0.06] shadow-2xl shadow-indigo-500/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Subtle hover gradient ring */}
                  <div
                    className={`absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
                    style={{
                      background: `radial-gradient(400px circle at 50% 0%, ${primary}33, transparent 60%)`,
                    }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                        {srv.emoji || "✨"}
                      </div>
                      <span
                        className="px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${primary}25, ${secondary}25)`,
                          color: "#ffffff",
                          border: `1px solid ${primary}40`,
                        }}
                      >
                        {srv.price}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      {srv.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6">
                      {srv.description || "Servicio con dedicación profesional exclusiva."}
                    </p>
                  </div>

                  <div className="relative z-10 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {srv.duration} min
                    </span>
                    <a
                      href="#reservar"
                      className="font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      style={{ color: primary }}
                    >
                      Reservar
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DYNAMIC GALLERY ── */}
      {gallery.length > 0 && (
        <section id="galeria" className="relative py-20 px-4 sm:px-6 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">
                Portfolio Visual
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Nuestra Galería
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="group relative aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-lg cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                    <span className="text-xs font-bold text-white drop-shadow-md">
                      {item.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      {testimonials.length > 0 && (
        <section id="testimonios" className="relative py-20 px-4 sm:px-6 z-10 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400">
                Experiencias Reales
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Lo que dicen nuestros clientes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="p-7 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-md relative"
                >
                  <div className="flex items-center gap-1 text-amber-400 text-sm mb-4">
                    {"★".repeat(t.rating || 5)}
                  </div>
                  <p className="text-sm text-slate-300 italic mb-6 leading-relaxed">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{t.name}</div>
                      <div className="text-xs text-slate-400">{t.role || "Cliente Verificado"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── HORARIOS & CONTACTO ── */}
      <section id="horarios" className="relative py-20 px-4 sm:px-6 z-10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Horarios */}
          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-white/5 border border-white/10">📅</span>
              Horarios Semanales
            </h3>
            <div className="space-y-3 text-sm">
              {schedule.map((day) => (
                <div key={day.day} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-slate-300 font-medium">{day.label}</span>
                  {day.enabled ? (
                    <span className="text-white font-bold">{day.open} - {day.close} hs</span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/5 border border-white/10">📍</span>
                Ubicación & Contacto
              </h3>
              <div className="space-y-4 text-sm text-slate-300">
                {contact.address && (
                  <p className="flex items-start gap-2.5">
                    <span className="font-semibold text-white shrink-0">Dirección:</span>
                    <span>{contact.address}</span>
                  </p>
                )}
                {contact.phone && (
                  <p className="flex items-center gap-2.5">
                    <span className="font-semibold text-white">Teléfono:</span>
                    <a href={`tel:${contact.phone}`} className="hover:text-indigo-300 transition-colors">{contact.phone}</a>
                  </p>
                )}
                {contact.email && (
                  <p className="flex items-center gap-2.5">
                    <span className="font-semibold text-white">Email:</span>
                    <a href={`mailto:${contact.email}`} className="hover:text-indigo-300 transition-colors">{contact.email}</a>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-6">
              {contact.whatsapp && (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3.5 text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg transition-all ${hoverScale} ${buttonClass}`}
                  style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                >
                  Escribinos por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── BOOKING CARD ── */}
      <section id="reservar" className="relative py-20 px-4 sm:px-6 z-10">
        <div className="max-w-3xl mx-auto p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/15 backdrop-blur-2xl shadow-2xl">
          <div className="text-center max-w-md mx-auto mb-8 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {booking.title || "Reservá tu turno"}
            </h2>
            <p className="text-sm text-slate-400">
              {booking.subtitle || "Elegí tu fecha y asegurá tu lugar al instante"}
            </p>
            {selectedService && (
              <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold text-indigo-200 bg-indigo-500/20 border border-indigo-500/40 mt-2">
                Servicio seleccionado: {selectedService}
              </span>
            )}
          </div>

          {bookingElement ? (
            React.isValidElement(bookingElement) ? (
              React.cloneElement(bookingElement as React.ReactElement<any>, {
                preselectedService: selectedService || undefined,
              })
            ) : (
              bookingElement
            )
          ) : (
            <div className="text-center space-y-4">
              <a
                href={getWhatsAppLink(selectedService || undefined)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-10 py-4 text-white font-extrabold text-base shadow-xl transition-all ${hoverScale} ${buttonClass}`}
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                Confirmar Reserva por WhatsApp
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative py-12 px-4 sm:px-6 border-t border-white/10 text-center text-xs text-slate-500 z-10">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-6 text-slate-400">
            {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a>}
            {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a>}
            {social.tiktok && <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-white">TikTok</a>}
          </div>
          <p>&copy; {new Date().getFullYear()} {identity.name}. Desarrollado con tecnología de alta velocidad.</p>
        </div>
      </footer>

      {/* ── BARRA FLOTANTE MÓVIL DE ALTA CONVERSIÓN ── */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40">
        <div
          className="p-2.5 rounded-2xl border shadow-2xl flex items-center justify-between gap-2.5 backdrop-blur-xl"
          style={{
            background: "rgba(9, 13, 22, 0.92)",
            borderColor: "rgba(255, 255, 255, 0.12)",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.7)"
          }}
        >
          <div className="pl-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {status.open ? "Abierto hoy" : "Turnos online"}
            </div>
            <div className="text-xs font-extrabold text-white truncate max-w-[130px]">
              {identity.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contact.whatsapp && (
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg hover:scale-105 active:scale-95 transition-all"
                title="Escribir por WhatsApp"
              >
                💬
              </a>
            )}
            <a
              href="#reservar"
              className="px-5 py-2.5 rounded-xl font-extrabold text-xs text-white shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              <span>Reservar Turno</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
