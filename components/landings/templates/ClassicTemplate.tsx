"use client";

import React, { useState } from "react";
import { BusinessDataContract } from "@/lib/templates/contract";
import { getThemeDefinition, generateThemeVariables } from "@/lib/templates/themes";

export interface TemplateProps {
  data: BusinessDataContract;
  bookingElement?: React.ReactNode;
}

export default function ClassicTemplate({ data, bookingElement }: TemplateProps) {
  const { identity, contact, branding, hero, services, gallery, schedule, staff, testimonials, social, booking, design } = data;
  const theme = getThemeDefinition(design.themeId, "classic");
  const themeVars = generateThemeVariables(theme, branding.primaryColor, branding.secondaryColor);

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const primary = branding.primaryColor || theme.visuals.defaultPrimary;
  const isDark = theme.visuals.isDark;

  // WhatsApp helper
  const getWhatsAppLink = (serviceName?: string) => {
    const phone = contact.whatsapp.replace(/\D/g, "");
    const text = serviceName
      ? `Hola ${identity.name}, quiero reservar un turno para: ${serviceName}`
      : `Hola ${identity.name}, me gustaría consultar por turnos disponibles.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const buttonClass = branding.buttonStyle === "pill" ? "rounded-full" : (branding.buttonStyle === "square" ? "rounded-none" : "rounded-xl");

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

  return (
    <div
      className={`min-h-screen font-sans ${isDark ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"}`}
      style={{ ...themeVars, fontFamily: branding.font }}
    >
      {/* ── HEADER / NAVBAR ── */}
      <header className={`sticky top-0 z-40 border-b ${isDark ? "bg-zinc-950/90 border-zinc-800/80" : "bg-white/90 border-zinc-200/80"} backdrop-blur-md transition-colors`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-3 group">
            {identity.logo ? (
              <img
                src={identity.logo}
                alt={identity.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
              />
            ) : (
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm"
                style={{ backgroundColor: primary }}
              >
                {identity.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-bold text-lg sm:text-xl tracking-tight block leading-tight">
                {identity.name}
              </span>
              {identity.tagline && (
                <span className="text-[11px] text-zinc-500 hidden sm:block truncate max-w-xs">
                  {identity.tagline}
                </span>
              )}
            </div>
          </a>

          {/* Live Status */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs">
            <span className={`w-2 h-2 rounded-full ${status.open ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="font-medium text-zinc-600 dark:text-zinc-400">{status.text}</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#servicios" className="hover:opacity-75 transition-opacity">Servicios</a>
            {gallery.length > 0 && <a href="#galeria" className="hover:opacity-75 transition-opacity">Galería</a>}
            <a href="#horarios" className="hover:opacity-75 transition-opacity">Horarios</a>
            <a href="#contacto" className="hover:opacity-75 transition-opacity">Contacto</a>
            <a
              href="#reservar"
              className={`px-5 py-2.5 text-white font-semibold text-sm shadow-sm hover:opacity-90 transition-all ${buttonClass}`}
              style={{ backgroundColor: primary }}
            >
              {hero.ctaText || "Reservar"}
            </a>
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            aria-label="Abrir menú"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <nav className={`md:hidden px-4 py-4 border-t flex flex-col gap-3 ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"}`}>
            <a href="#servicios" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm font-medium">Servicios</a>
            {gallery.length > 0 && <a href="#galeria" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm font-medium">Galería</a>}
            <a href="#horarios" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm font-medium">Horarios</a>
            <a href="#contacto" onClick={() => setMobileMenuOpen(false)} className="py-2 text-sm font-medium">Contacto</a>
            <a
              href="#reservar"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full py-3 text-center text-white font-semibold text-sm ${buttonClass}`}
              style={{ backgroundColor: primary }}
            >
              {hero.ctaText || "Reservar"}
            </a>
          </nav>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section id="hero" className="relative py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
        {hero.image && (
          <div className="absolute inset-0 z-0">
            <img src={hero.image} alt={hero.title} className="w-full h-full object-cover" />
            <div
              className={`absolute inset-0 ${isDark ? "bg-zinc-950" : "bg-white"}`}
              style={{ opacity: (hero.bannerOpacity ?? 70) / 100 }}
            />
          </div>
        )}

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {hero.badge && (
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm"
              style={{
                backgroundColor: `${primary}18`,
                color: primary,
                border: `1px solid ${primary}33`,
              }}
            >
              {hero.badge}
            </span>
          )}

          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight"
            style={{ color: hero.titleColor || (isDark ? "#ffffff" : "#0f172a") }}
          >
            {hero.title}
          </h1>

          <p className="text-base sm:text-xl text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            {hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <a
              href="#reservar"
              className={`w-full sm:w-auto px-8 py-3.5 text-white font-bold text-base shadow-md hover:shadow-lg transition-all ${buttonClass}`}
              style={{ backgroundColor: primary }}
            >
              {hero.ctaText}
            </a>
            {contact.whatsapp && (
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full sm:w-auto px-6 py-3.5 font-bold text-base border flex items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all ${buttonClass} ${isDark ? "border-zinc-700 text-zinc-200" : "border-zinc-300 text-zinc-800"}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2M12.05 3.67C16.58 3.67 20.28 7.37 20.28 11.92C20.28 16.46 16.58 20.17 12.05 20.17C10.6 20.17 9.22 19.78 8.03 19.04L7.74 18.87L4.62 19.69L5.45 16.65L5.27 16.35C4.46 15.07 4.02 13.52 4.02 11.91C4.02 7.37 7.72 3.67 12.05 3.67Z" />
                </svg>
                WhatsApp Directo
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── SERVICES SECTION ── */}
      <section id="servicios" className={`py-16 px-4 sm:px-6 border-t ${isDark ? "border-zinc-900 bg-zinc-900/40" : "border-zinc-100 bg-zinc-50"}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Nuestros Servicios</h2>
            <p className="text-sm text-zinc-500">Seleccioná tu servicio y reservá tu lugar en minutos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv) => (
              <div
                key={srv.id}
                onClick={() => setSelectedService(srv.name)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${isDark ? "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-200/80 hover:border-zinc-300"} hover:shadow-md`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-2xl">{srv.emoji || "✨"}</span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: `${primary}18`, color: primary }}
                    >
                      {srv.price}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">{srv.name}</h3>
                  <p className="text-xs text-zinc-500 mb-4 leading-relaxed line-clamp-3">
                    {srv.description || "Servicio profesional de máxima calidad."}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {srv.duration} min
                  </span>
                  <a
                    href="#reservar"
                    className="font-bold text-xs hover:underline flex items-center gap-1"
                    style={{ color: primary }}
                  >
                    Elegir &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY (if present) ── */}
      {gallery.length > 0 && (
        <section id="galeria" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Galería de Trabajos</h2>
            <p className="text-sm text-zinc-500">Conocé la calidad y el detalle que nos define</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SCHEDULE & LOCATION ── */}
      <section id="horarios" className={`py-16 px-4 sm:px-6 border-t ${isDark ? "border-zinc-900 bg-zinc-900/30" : "border-zinc-100 bg-zinc-50"}`}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Horarios */}
          <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Horarios de Atención
            </h3>
            <div className="space-y-2.5 text-sm">
              {schedule.map((day) => (
                <div key={day.day} className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{day.label}</span>
                  {day.enabled ? (
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{day.open} - {day.close} hs</span>
                  ) : (
                    <span className="text-xs text-zinc-400 font-medium">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contacto & Ubicación */}
          <div className={`p-6 sm:p-8 rounded-2xl border flex flex-col justify-between ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Ubicación & Contacto
              </h3>
              <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                {contact.address && (
                  <p className="flex items-start gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">Dirección:</span>
                    <span>{contact.address}</span>
                  </p>
                )}
                {contact.phone && (
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">Teléfono:</span>
                    <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
                  </p>
                )}
                {contact.email && (
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">Email:</span>
                    <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
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
                  className={`w-full py-3 text-white font-bold text-center flex items-center justify-center gap-2 shadow-sm ${buttonClass}`}
                  style={{ backgroundColor: primary }}
                >
                  Contactar por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── BOOKING SECTION ── */}
      <section id="reservar" className="py-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className={`p-6 sm:p-10 rounded-3xl border shadow-xl ${isDark ? "bg-zinc-900/90 border-zinc-800" : "bg-white border-zinc-200"}`}>
          <div className="text-center max-w-md mx-auto mb-8 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {booking.title || "Reservá tu turno"}
            </h2>
            <p className="text-sm text-zinc-500">
              {booking.subtitle || "Seleccioná fecha y hora para confirmar tu cita"}
            </p>
            {selectedService && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                Servicio preseleccionado: {selectedService}
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
              <p className="text-sm text-zinc-500">
                Reservá directamente enviándonos un mensaje con el horario de tu preferencia.
              </p>
              <a
                href={getWhatsAppLink(selectedService || undefined)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-8 py-3.5 text-white font-bold text-base shadow-md ${buttonClass}`}
                style={{ backgroundColor: primary }}
              >
                Confirmar Reserva por WhatsApp
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={`py-12 px-4 sm:px-6 border-t text-center text-xs text-zinc-500 ${isDark ? "border-zinc-900 bg-zinc-950" : "border-zinc-100 bg-white"}`}>
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-4">
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:opacity-75">
                Instagram
              </a>
            )}
            {social.facebook && (
              <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-75">
                Facebook
              </a>
            )}
            {social.tiktok && (
              <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="hover:opacity-75">
                TikTok
              </a>
            )}
          </div>
          <p>&copy; {new Date().getFullYear()} {identity.name}. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* ── BARRA FLOTANTE MÓVIL ── */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40">
        <div
          className={`p-2.5 rounded-2xl border shadow-xl flex items-center justify-between gap-2.5 backdrop-blur-xl ${
            isDark ? "bg-zinc-900/90 border-zinc-800 shadow-black/60" : "bg-white/95 border-zinc-200 shadow-zinc-300/50"
          }`}
        >
          <div className="pl-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {status.open ? "Abierto" : "Turnos online"}
            </div>
            <div className="text-xs font-bold truncate max-w-[130px]">
              {identity.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contact.whatsapp && (
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg hover:scale-105 active:scale-95 transition-all"
                title="WhatsApp"
              >
                💬
              </a>
            )}
            <a
              href="#reservar"
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: primary }}
            >
              <span>Reservar</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
