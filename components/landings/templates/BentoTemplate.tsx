"use client";

import React, { useState } from "react";
import { BusinessDataContract } from "@/lib/templates/contract";
import {
  Sparkles,
  Clock,
  MapPin,
  MessageCircle,
  Star,
  Calendar,
  ArrowRight,
  Phone,
  Navigation,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

export interface TemplateProps {
  data: BusinessDataContract;
  bookingElement?: React.ReactNode;
}

export default function BentoTemplate({ data, bookingElement }: TemplateProps) {
  const { identity, contact, branding, hero, services, schedule, testimonials, social } = data;
  const primary = branding.primaryColor || "#6366F1";
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Business open/closed status calculation
  const getOpenStatus = () => {
    try {
      const now = new Date();
      const days = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
      const todayKey = days[now.getDay()];
      const todaySchedule = schedule.find((s) => s.day === todayKey);
      if (!todaySchedule || !todaySchedule.enabled) {
        return { isOpen: false, text: "Cerrado hoy", hours: "Atención online 24/7" };
      }

      const [openH, openM] = todaySchedule.open.split(":").map(Number);
      const [closeH, closeM] = todaySchedule.close.split(":").map(Number);
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const openMin = openH * 60 + (openM || 0);
      const closeMin = closeH * 60 + (closeM || 0);

      if (currentMin >= openMin && currentMin < closeMin) {
        return {
          isOpen: true,
          text: "Abierto ahora",
          hours: `Hasta las ${todaySchedule.close} hs`,
        };
      }
      return {
        isOpen: false,
        text: "Cerrado ahora",
        hours: `Abre ${todaySchedule.open} hs`,
      };
    } catch {
      return { isOpen: true, text: "Abierto", hours: "Consultas online" };
    }
  };

  const status = getOpenStatus();
  const cleanPhone = contact.whatsapp ? contact.whatsapp.replace(/\D/g, "") : null;
  const featuredService = services[0];
  const featuredReview = testimonials[0];

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── BENTO MOSAIC GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* 1. HERO BRAND CARD (Span 8) */}
          <div className="lg:col-span-8 p-6 sm:p-10 rounded-3xl bg-[#0E131F] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
            {hero.image && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-15 transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                style={{ backgroundImage: `url(${hero.image})` }}
              />
            )}
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                {identity.logo ? (
                  <img
                    src={identity.logo}
                    alt={identity.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-md"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md"
                    style={{ background: primary }}
                  >
                    {identity.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-sm font-bold text-white tracking-wide">{identity.name}</h2>
                  <span className="text-xs text-indigo-400 font-medium">{identity.tagline}</span>
                </div>
              </div>

              <div className="pt-4 max-w-xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-white border border-white/10 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  {hero.badge || "Experiencia de Vanguardia"}
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  {hero.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
                  {hero.subtitle}
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-8 flex flex-wrap items-center gap-3">
              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center gap-2"
                  style={{ background: primary }}
                >
                  <Calendar className="w-4 h-4" />
                  <span>{hero.ctaText || "Reservar Turno"}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* 2. LIVE STATUS & SCHEDULE CARD (Span 4) */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0E131F] border border-white/10 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Horario Comercial
                </span>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                  <span
                    className={`w-2 h-2 rounded-full ${status.isOpen ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
                  />
                  <span className={status.isOpen ? "text-emerald-300 font-bold" : "text-red-300 font-bold"}>
                    {status.text}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-black text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>{status.hours}</span>
                </div>
                <p className="text-xs text-slate-400">
                  Atención presional en nuestro establecimiento.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-1.5 text-xs text-slate-300">
              {schedule.slice(0, 4).map((d) => (
                <div key={d.day} className="flex justify-between">
                  <span className="capitalize">{d.label}:</span>
                  <span className="font-mono text-slate-400">
                    {d.enabled ? `${d.open} - ${d.close} hs` : "Cerrado"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. FEATURED SERVICE CARD (Span 4) */}
          {featuredService && (
            <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0E131F] border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-indigo-500/40 transition-all">
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Servicio Destacado
                </span>
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {featuredService.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {featuredService.description || "Atención personalizada y resultados de máxima calidad."}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Precio</span>
                  <span className="text-lg font-black text-white tabular-nums">
                    {featuredService.price ? `$${featuredService.price}` : "A consultar"}
                  </span>
                </div>
                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola! Quiero consultar por ${featuredService.name}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95"
                    style={{ background: primary }}
                  >
                    Agendar
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 4. WHATSAPP DIRECT CHAT CARD (Span 4) */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-[#0E131F] border border-emerald-500/20 shadow-2xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Atención Inmediata</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Respondemos tus dudas en minutos por WhatsApp.
              </p>
            </div>

            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Chatear por WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* 5. CLIENT REVIEW CARD (Span 4) */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#0E131F] border border-white/10 shadow-2xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "{featuredReview?.comment || "Excelente experiencia, súper profesionales y puntuales. Muy recomendado!"}"
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-xs">
                {(featuredReview?.name || "C").charAt(0)}
              </div>
              <span className="text-xs font-semibold text-white">
                {featuredReview?.name || "Cliente Satisfecho"}
              </span>
            </div>
          </div>

          {/* 6. LOCATION & MAP CARD (Span 6) */}
          {contact.address && (
            <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#0E131F] border border-white/10 shadow-2xl flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Ubicación & Local
                </span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-400" />
                  <span>{contact.address}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Estacionamiento y fácil acceso. Te esperamos.
                </p>
              </div>

              <div className="pt-6">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-all"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Ver en Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          )}

          {/* 7. ALL SERVICES EXPANDER / BOOKING CARD (Span 6) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#0E131F] border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Catálogo de Servicios
              </span>
              <span className="text-xs text-slate-400">{services.length} disponibles</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv.name)}
                  className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                    selectedService === srv.name
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <span className="font-semibold">{srv.name}</span>
                  <span className="font-bold text-white tabular-nums">
                    {srv.price ? `$${srv.price}` : "Consultar"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── OPTIONAL BOOKING WIDGET INJECTOR ── */}
        {bookingElement && (
          <div className="p-6 sm:p-10 rounded-3xl bg-[#0E131F] border border-white/10 shadow-2xl">
            {bookingElement}
          </div>
        )}

        {/* ── FOOTER ── */}
        <footer className="pt-6 border-t border-white/5 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {identity.name}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400">
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noreferrer" className="hover:text-white">
                Instagram
              </a>
            )}
            {cleanPhone && (
              <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noreferrer" className="hover:text-white">
                WhatsApp
              </a>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
