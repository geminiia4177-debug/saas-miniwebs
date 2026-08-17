"use client";

import React, { useState } from "react";
import { BusinessDataContract } from "@/lib/templates/contract";
import { getThemeDefinition, generateThemeVariables } from "@/lib/templates/themes";
import { TemplateProps } from "./ClassicTemplate";

export default function PremiumTemplate({ data, bookingElement }: TemplateProps) {
  const { identity, contact, branding, hero, services, gallery, schedule, staff, testimonials, social, booking, design } = data;
  const theme = getThemeDefinition(design.themeId, "premium");
  const themeVars = generateThemeVariables(theme, branding.primaryColor, branding.secondaryColor);

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "team" | "story">("services");
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const primary = branding.primaryColor || theme.visuals.defaultPrimary;
  const secondary = branding.secondaryColor || theme.visuals.defaultSecondary;
  const isDark = theme.visuals.isDark;

  const getWhatsAppLink = (serviceName?: string) => {
    const phone = contact.whatsapp.replace(/\D/g, "");
    const text = serviceName
      ? `Estimado equipo de ${identity.name}, solicito información para reservar el servicio de alta gama: ${serviceName}`
      : `Estimado equipo de ${identity.name}, deseo consultar disponibilidad para una reserva exclusiva.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const buttonClass = branding.buttonStyle === "pill" ? "rounded-full" : (branding.buttonStyle === "square" ? "rounded-none" : "rounded-xl");

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-[#0a0a0d] text-[#f5f2eb]" : "bg-[#faf8f5] text-[#1c1917]"} selection:bg-[#c5a059] selection:text-black`}
      style={{ ...themeVars, fontFamily: branding.font || "'Playfair Display', serif" }}
    >
      {/* ── LUXURY HEADER ── */}
      <header className={`sticky top-0 z-40 border-b ${isDark ? "bg-[#0a0a0d]/90 border-white/5" : "bg-[#faf8f5]/90 border-[#e7ded5]"} backdrop-blur-lg`}>
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3 group">
            {identity.logo ? (
              <img
                src={identity.logo}
                alt={identity.name}
                className="w-11 h-11 rounded-full object-cover ring-1 ring-amber-500/40 p-0.5"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-serif text-lg text-white shadow-md ring-1 ring-amber-500/40"
                style={{ backgroundColor: primary }}
              >
                {identity.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-serif font-bold text-xl tracking-wider uppercase block">
                {identity.name}
              </span>
              <span className="text-[10px] tracking-[0.25em] text-amber-500/80 uppercase block font-sans">
                {identity.tagline || "Maison de Beauté & Style"}
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-sans font-medium text-stone-400">
            <a href="#servicios" className="hover:text-amber-400 transition-colors">Servicios</a>
            {staff.length > 0 && <a href="#equipo" className="hover:text-amber-400 transition-colors">Especialistas</a>}
            {gallery.length > 0 && <a href="#galeria" className="hover:text-amber-400 transition-colors">Galería</a>}
            <a href="#horarios" className="hover:text-amber-400 transition-colors">Horarios</a>
            <a
              href="#reservar"
              className={`px-7 py-2.5 text-white font-sans text-xs tracking-widest uppercase font-bold shadow-lg hover:opacity-90 transition-all ${buttonClass}`}
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              Cita Exclusiva
            </a>
          </nav>
        </div>
      </header>

      {/* ── EDITORIAL HERO ── */}
      <section id="hero" className="relative py-24 sm:py-36 px-6 overflow-hidden">
        {/* Ambient golden glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[180px] opacity-15 pointer-events-none"
          style={{ background: primary }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm text-xs font-sans uppercase tracking-[0.2em] text-amber-400">
            <span>✦</span>
            <span>{hero.badge || "Exclusividad & Excelencia"}</span>
            <span>✦</span>
          </div>

          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight leading-[1.15]"
            style={{ color: hero.titleColor || (isDark ? "#ffffff" : "#1a1a1a") }}
          >
            {hero.title}
          </h1>

          <p className="text-base sm:text-xl text-stone-400 max-w-2xl mx-auto font-sans font-light leading-relaxed">
            {hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 font-sans">
            <a
              href="#reservar"
              className={`w-full sm:w-auto px-9 py-4 text-white font-bold text-xs uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all ${buttonClass}`}
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
            >
              {hero.ctaText || "Solicitar Cita"}
            </a>
            <a
              href="#servicios"
              className={`w-full sm:w-auto px-8 py-4 border border-stone-700 hover:border-amber-400/60 text-stone-200 font-bold text-xs uppercase tracking-widest transition-all ${buttonClass}`}
            >
              {hero.ctaSecondary || "Carta de Servicios"}
            </a>
          </div>
        </div>
      </section>

      {/* ── EDITORIAL SERVICES ── */}
      <section id="servicios" className={`py-24 px-6 border-t ${isDark ? "border-white/5 bg-[#0e0e14]" : "border-[#e7ded5] bg-[#f4efe9]"}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-amber-400 font-sans block">
              Colección Exclusiva
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight">
              Nuestros Tratamientos
            </h2>
            <div className="w-16 h-0.5 mx-auto bg-amber-400/40 mt-4" />
          </div>

          <div className="space-y-4">
            {services.map((srv) => (
              <div
                key={srv.id}
                onClick={() => setSelectedService(srv.name)}
                className={`p-6 sm:p-8 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 group ${
                  isDark
                    ? "bg-[#14141c] border-white/5 hover:border-amber-500/40 hover:bg-[#181822]"
                    : "bg-white border-[#e2d8cd] hover:border-stone-400 hover:shadow-lg"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{srv.emoji || "✨"}</span>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold group-hover:text-amber-400 transition-colors">
                      {srv.name}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-400 font-sans font-light leading-relaxed max-w-2xl">
                    {srv.description || "Procedimiento de alta gama con insumos importados de máxima pureza."}
                  </p>
                </div>

                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                  <span className="text-xl sm:text-2xl font-serif font-bold text-amber-400">
                    {srv.price}
                  </span>
                  <span className="text-[11px] font-sans text-stone-400 flex items-center gap-1 uppercase tracking-wider">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {srv.duration} min
                  </span>
                  <a
                    href="#reservar"
                    className="font-sans text-[11px] font-bold uppercase tracking-widest underline decoration-amber-400/50 hover:decoration-amber-400 pt-1"
                    style={{ color: primary }}
                  >
                    Seleccionar
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM / STAFF SPOTLIGHT ── */}
      {staff.length > 0 && (
        <section id="equipo" className="py-24 px-6 max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-amber-400 font-sans block">
              Maestros & Especialistas
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight">
              Nuestro Equipo
            </h2>
            <div className="w-16 h-0.5 mx-auto bg-amber-400/40 mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {staff.map((member) => (
              <div
                key={member.id}
                className={`p-8 rounded-3xl border text-center space-y-4 ${
                  isDark ? "bg-[#121218] border-white/5" : "bg-white border-[#e7ded5]"
                }`}
              >
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto object-cover ring-2 ring-amber-500/40 p-1"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full mx-auto flex items-center justify-center font-serif text-2xl text-white ring-2 ring-amber-500/40"
                    style={{ backgroundColor: primary }}
                  >
                    {member.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-serif font-bold">{member.name}</h3>
                  <p className="text-xs font-sans uppercase tracking-widest text-amber-400 font-semibold mt-1">
                    {member.role}
                  </p>
                </div>
                <p className="text-xs text-stone-400 font-sans font-light leading-relaxed">
                  {member.description || "Especialista dedicado a brindar una atención personalizada insuperable."}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PHOTO GALLERY ── */}
      {gallery.length > 0 && (
        <section id="galeria" className={`py-24 px-6 border-t ${isDark ? "border-white/5 bg-[#0e0e14]" : "border-[#e7ded5] bg-[#f4efe9]"}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
              <span className="text-xs uppercase tracking-[0.3em] text-amber-400 font-sans block">
                Portfolio Editorial
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight">
                Atmósfera & Detalles
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxImg(item.image)}
                  className="aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group relative shadow-md"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-sans uppercase tracking-widest text-white font-bold">
                      Ampliar ✦
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <img src={lightboxImg} alt="Ampliación" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}

      {/* ── HORARIOS & UBICACIÓN ── */}
      <section id="horarios" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`p-8 rounded-3xl border ${isDark ? "bg-[#121218] border-white/5" : "bg-white border-[#e7ded5]"}`}>
            <h3 className="text-2xl font-serif font-bold mb-6">Atención Exclusiva</h3>
            <div className="space-y-3 font-sans text-sm">
              {schedule.map((day) => (
                <div key={day.day} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-stone-300 font-medium">{day.label}</span>
                  {day.enabled ? (
                    <span className="font-bold text-amber-400">{day.open} — {day.close} hs</span>
                  ) : (
                    <span className="text-xs text-stone-500">Bajo Reserva Especial</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={`p-8 rounded-3xl border flex flex-col justify-between ${isDark ? "bg-[#121218] border-white/5" : "bg-white border-[#e7ded5]"}`}>
            <div>
              <h3 className="text-2xl font-serif font-bold mb-6">Ubicación & Concierge</h3>
              <div className="space-y-4 font-sans text-sm text-stone-300">
                {contact.address && (
                  <p>
                    <strong className="block text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1">Dirección:</strong>
                    {contact.address}
                  </p>
                )}
                {contact.phone && (
                  <p>
                    <strong className="block text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1">Línea Directa:</strong>
                    <a href={`tel:${contact.phone}`} className="hover:text-amber-400">{contact.phone}</a>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-6 font-sans">
              {contact.whatsapp && (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-4 text-white font-bold text-xs uppercase tracking-widest text-center block shadow-lg ${buttonClass}`}
                  style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
                >
                  Contactar Concierge por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── BOOKING CARD ── */}
      <section id="reservar" className="py-24 px-6 max-w-3xl mx-auto">
        <div className={`p-10 sm:p-14 rounded-3xl border shadow-2xl ${isDark ? "bg-[#14141c] border-amber-500/20" : "bg-white border-[#e7ded5]"}`}>
          <div className="text-center max-w-md mx-auto mb-10 space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-amber-400 font-sans block">
              Agenda Premium
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              {booking.title || "Reserva de Turnos"}
            </h2>
            <p className="text-xs text-stone-400 font-sans">
              {booking.subtitle || "Garantizamos privacidad y puntualidad absoluta"}
            </p>
            {selectedService && (
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-sans font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 mt-2">
                Tratamiento: {selectedService}
              </span>
            )}
          </div>

          {bookingElement ? (
            bookingElement
          ) : (
            <div className="text-center space-y-4 font-sans">
              <a
                href={getWhatsAppLink(selectedService || undefined)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-10 py-4 text-white font-bold text-xs uppercase tracking-widest shadow-2xl ${buttonClass}`}
                style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
              >
                Confirmar Reserva Exclusiva
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-16 px-6 border-t border-white/5 text-center text-xs text-stone-500 font-sans">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-6 text-stone-400 uppercase tracking-widest text-[11px]">
            {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">Instagram</a>}
            {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">Facebook</a>}
            {social.tiktok && <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">TikTok</a>}
          </div>
          <p>&copy; {new Date().getFullYear()} {identity.name}. Reservados todos los derechos.</p>
        </div>
      </footer>
    </div>
  );
}
