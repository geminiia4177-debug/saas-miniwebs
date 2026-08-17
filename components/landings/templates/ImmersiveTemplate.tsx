"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { BusinessDataContract } from "@/lib/templates/contract";
import { getThemeDefinition, generateThemeVariables } from "@/lib/templates/themes";
import { TemplateProps } from "./ClassicTemplate";

// Lazy load ThreePresetCanvas to avoid blocking initial HTML render (FCP optimization)
const ThreePresetCanvas = dynamic(
  () => import("./three/ThreePresetCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#060810]" aria-hidden="true" />
    ),
  }
);

export default function ImmersiveTemplate({ data, bookingElement }: TemplateProps) {
  const { identity, contact, branding, hero, services, gallery, schedule, staff, testimonials, social, booking, design } = data;
  const theme = getThemeDefinition(design.themeId, "immersive");
  const themeVars = generateThemeVariables(theme, branding.primaryColor, branding.secondaryColor);

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const primary = branding.primaryColor || theme.visuals.defaultPrimary;
  const secondary = branding.secondaryColor || theme.visuals.defaultSecondary;
  const preset = design.visualPreset || theme.defaultPreset || "flow";
  const intensity = design.visualIntensity ?? 0.8;

  const getWhatsAppLink = (serviceName?: string) => {
    const phone = contact.whatsapp.replace(/\D/g, "");
    const text = serviceName
      ? `Hola ${identity.name}, quiero reservar un turno para la experiencia: ${serviceName}`
      : `Hola ${identity.name}, deseo consultar disponibilidad de turnos.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const buttonClass = branding.buttonStyle === "pill" ? "rounded-full" : (branding.buttonStyle === "square" ? "rounded-none" : "rounded-2xl");

  const categories = ["all", ...Array.from(new Set(services.map((s) => s.category).filter(Boolean)))];
  const filteredServices = activeCategory === "all"
    ? services
    : services.filter((s) => s.category === activeCategory);

  return (
    <div
      className="min-h-screen bg-[#05070e] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-black"
      style={{ ...themeVars, fontFamily: branding.font }}
    >
      {/* ── IMMERSIVE 3D CANVAS BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ThreePresetCanvas
          preset={preset}
          primaryColor={primary}
          secondaryColor={secondary}
          intensity={intensity}
        />
        {/* Subtle dark vignette overlay to ensure text contrast */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#05070e]/60 via-transparent to-[#05070e]/80"
          aria-hidden="true"
        />
      </div>

      {/* ── FROSTED GLASS NAVBAR ── */}
      <header className="sticky top-0 z-40 bg-[#05070e]/70 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3 group">
            {identity.logo ? (
              <img
                src={identity.logo}
                alt={identity.name}
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-cyan-400/40 p-0.5"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-xl text-white shadow-xl ring-2 ring-cyan-400/40"
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                {identity.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight block text-white">
                {identity.name}
              </span>
              <span className="text-[10px] tracking-widest text-cyan-400 font-semibold uppercase block">
                {identity.tagline || "Experiencia 3D Envolvente"}
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-bold text-slate-300">
            <a href="#servicios" className="hover:text-cyan-300 transition-colors">Servicios</a>
            {gallery.length > 0 && <a href="#galeria" className="hover:text-cyan-300 transition-colors">Galería</a>}
            <a href="#horarios" className="hover:text-cyan-300 transition-colors">Horarios</a>
            <a href="#testimonios" className="hover:text-cyan-300 transition-colors">Reseñas</a>
            <a
              href="#reservar"
              className={`px-7 py-3 text-white font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all ${buttonClass}`}
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              Reservar 3D
            </a>
          </nav>
        </div>
      </header>

      {/* ── IMMERSIVE HERO SECTION ── */}
      <section id="hero" className="relative pt-24 pb-20 sm:pt-36 sm:pb-32 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 backdrop-blur-xl shadow-2xl text-xs font-bold uppercase tracking-wider text-cyan-300">
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: primary }} />
            <span>{hero.badge || "Experiencia Visual Inmersiva"}</span>
          </div>

          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text drop-shadow-2xl"
            style={{
              backgroundImage: `linear-gradient(135deg, #ffffff 40%, ${secondary} 100%)`,
            }}
          >
            {hero.title}
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-md">
            {hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <a
              href="#reservar"
              className={`w-full sm:w-auto px-10 py-4 text-white font-extrabold text-sm uppercase tracking-wider shadow-2xl hover:scale-105 transition-all ${buttonClass}`}
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              {hero.ctaText || "Comenzar Experiencia"}
            </a>
            <a
              href="#servicios"
              className={`w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold text-sm uppercase tracking-wider backdrop-blur-xl transition-all ${buttonClass}`}
            >
              {hero.ctaSecondary || "Ver Servicios"}
            </a>
          </div>
        </div>
      </section>

      {/* ── HOLOGRAPHIC SERVICES SECTION ── */}
      <section id="servicios" className="relative py-24 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 block mb-2">
                Menú de Experiencias
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white">
                Nuestros Servicios
              </h2>
            </div>

            {categories.length > 2 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as string)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-lg transition-all ${
                      activeCategory === cat
                        ? "bg-white text-slate-900 shadow-xl"
                        : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
                    }`}
                  >
                    {cat === "all" ? "Todos" : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((srv) => (
              <div
                key={srv.id}
                onClick={() => setSelectedService(srv.name)}
                className="group relative p-7 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-2xl hover:border-cyan-400/60 transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between shadow-2xl hover:shadow-cyan-500/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner">
                      {srv.emoji || "✨"}
                    </div>
                    <span
                      className="px-4 py-1.5 rounded-full text-xs font-extrabold shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${primary}40, ${secondary}40)`,
                        border: `1px solid ${primary}60`,
                        color: "#ffffff",
                      }}
                    >
                      {srv.price}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    {srv.description || "Experiencia de nivel superior con atención al detalle."}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {srv.duration} min
                  </span>
                  <a
                    href="#reservar"
                    className="font-extrabold text-cyan-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  >
                    Seleccionar
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3D GALLERY CARDS ── */}
      {gallery.length > 0 && (
        <section id="galeria" className="relative py-24 px-6 z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
                Visual Showcase
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white">
                Galería de Creaciones
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map((item, i) => (
                <div
                  key={item.id || i}
                  className="group relative aspect-square rounded-3xl overflow-hidden border border-white/15 backdrop-blur-md shadow-2xl cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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

      {/* ── HORARIOS & UBICACIÓN ── */}
      <section id="horarios" className="relative py-24 px-6 z-10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-2xl shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-white/10">📅</span>
              Horarios de Atención
            </h3>
            <div className="space-y-3 text-sm">
              {schedule.map((day) => (
                <div key={day.day} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-slate-300 font-medium">{day.label}</span>
                  {day.enabled ? (
                    <span className="text-cyan-300 font-extrabold">{day.open} — {day.close} hs</span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-2xl shadow-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/10">📍</span>
                Ubicación & Contacto
              </h3>
              <div className="space-y-4 text-sm text-slate-300">
                {contact.address && (
                  <p>
                    <strong className="block text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-1">Dirección:</strong>
                    {contact.address}
                  </p>
                )}
                {contact.phone && (
                  <p>
                    <strong className="block text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-1">Teléfono:</strong>
                    <a href={`tel:${contact.phone}`} className="hover:text-cyan-300">{contact.phone}</a>
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
                  className={`w-full py-4 text-white font-extrabold text-xs uppercase tracking-widest text-center block shadow-2xl hover:scale-105 transition-all ${buttonClass}`}
                  style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                >
                  Contactar por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── BOOKING CARD ── */}
      <section id="reservar" className="relative py-24 px-6 z-10">
        <div className="max-w-3xl mx-auto p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-white/20 backdrop-blur-3xl shadow-2xl">
          <div className="text-center max-w-md mx-auto mb-10 space-y-3">
            <span className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-extrabold block">
              Acceso Inmediato
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {booking.title || "Reservar Turno"}
            </h2>
            <p className="text-xs text-slate-300">
              {booking.subtitle || "Elegí tu horario y recibí confirmación instantánea"}
            </p>
            {selectedService && (
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-cyan-200 bg-cyan-500/20 border border-cyan-500/40 mt-2">
                Experiencia seleccionada: {selectedService}
              </span>
            )}
          </div>

          {bookingElement ? (
            bookingElement
          ) : (
            <div className="text-center space-y-4">
              <a
                href={getWhatsAppLink(selectedService || undefined)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-10 py-4 text-white font-black text-sm uppercase tracking-wider shadow-2xl hover:scale-105 transition-all ${buttonClass}`}
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                Confirmar Reserva por WhatsApp
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative py-16 px-6 border-t border-white/10 text-center text-xs text-slate-500 z-10">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-6 text-slate-400">
            {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a>}
            {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a>}
            {social.tiktok && <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-white">TikTok</a>}
          </div>
          <p>&copy; {new Date().getFullYear()} {identity.name}. Experiencia visual 3D interactiva.</p>
        </div>
      </footer>
    </div>
  );
}
