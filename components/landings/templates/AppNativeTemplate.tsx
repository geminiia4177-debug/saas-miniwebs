"use client";

import React, { useState } from "react";
import { BusinessDataContract, NormalizedService } from "@/lib/templates/contract";
import {
  Home,
  Grid,
  Calendar,
  PhoneCall,
  Clock,
  MapPin,
  MessageCircle,
  Sparkles,
  ChevronRight,
  X,
  Plus,
} from "lucide-react";

export interface TemplateProps {
  data: BusinessDataContract;
  bookingElement?: React.ReactNode;
}

type AppTab = "home" | "catalog" | "booking" | "contact";

export default function AppNativeTemplate({ data, bookingElement }: TemplateProps) {
  const { identity, contact, branding, hero, services, schedule, social } = data;
  const primary = branding.primaryColor || "#6366F1";
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [selectedService, setSelectedService] = useState<NormalizedService | null>(null);

  const cleanPhone = contact.whatsapp ? contact.whatsapp.replace(/\D/g, "") : null;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white flex flex-col justify-between pb-24">
      {/* ── APP TOP STATUS HEADER ── */}
      <header className="sticky top-0 z-30 bg-[#0B0F1A]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {identity.logo ? (
            <img
              src={identity.logo}
              alt={identity.name}
              className="w-9 h-9 rounded-xl object-cover border border-white/10"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
              style={{ background: primary }}
            >
              {identity.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-sm font-black text-white leading-tight truncate max-w-[200px]">
              {identity.name}
            </h1>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{identity.tagline}</p>
          </div>
        </div>

        {cleanPhone && (
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noreferrer"
            className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-all active:scale-95"
            title="WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        )}
      </header>

      {/* ── TAB CONTENT ── */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-5">
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Hero App Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 to-[#0E1526] border border-white/10 shadow-2xl relative overflow-hidden space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-indigo-300">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>{hero.badge || "Bienvenido"}</span>
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                {hero.title}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">{hero.subtitle}</p>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("booking")}
                  className="flex-1 py-3 rounded-2xl text-white font-bold text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: primary }}
                >
                  <Calendar className="w-4 h-4" />
                  <span>{hero.ctaText || "Agendar Turno"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("catalog")}
                  className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Ver Menú
                </button>
              </div>
            </div>

            {/* Quick Highlights */}
            <div className="p-4 rounded-2xl bg-[#0E1526] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Horario Comercial</h4>
                  <p className="text-[11px] text-slate-400">Lunes a Sábado</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("contact")}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Ver más
              </button>
            </div>

            {/* Top Services Feed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Servicios Populares
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("catalog")}
                  className="text-xs text-indigo-400 font-medium"
                >
                  Ver todos
                </button>
              </div>

              <div className="space-y-2">
                {services.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className="p-3.5 rounded-2xl bg-[#0E1526] border border-white/5 hover:border-indigo-500/40 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">
                        {s.emoji || "✨"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300">
                          {s.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {s.duration ? `${s.duration} min` : "Atención personalizada"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-white tabular-nums">
                        {s.price ? `$${s.price}` : "Consultar"}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG */}
        {activeTab === "catalog" && (
          <div className="space-y-3 animate-fadeIn">
            <h2 className="text-base font-black text-white px-1">Catálogo Completo</h2>
            <div className="space-y-2">
              {services.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className="p-4 rounded-2xl bg-[#0E1526] border border-white/5 hover:border-indigo-500/40 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300">
                      {s.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {s.description || "Servicio profesional garantizado."}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-white block tabular-nums">
                      {s.price ? `$${s.price}` : "Consultar"}
                    </span>
                    <button
                      type="button"
                      className="mt-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white"
                      style={{ background: primary }}
                    >
                      Elegir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BOOKING */}
        {activeTab === "booking" && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-base font-black text-white px-1">Reservar Turno Online</h2>
            {bookingElement ? (
              <div className="p-4 rounded-3xl bg-[#0E1526] border border-white/10 shadow-xl">
                {bookingElement}
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-[#0E1526] border border-white/10 text-center space-y-4">
                <Calendar className="w-10 h-10 text-indigo-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">Turnos por WhatsApp</h3>
                <p className="text-xs text-slate-400">
                  Comunícate directamente con nuestro equipo para agendar en el día y horario que prefieras.
                </p>
                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Abrir WhatsApp</span>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CONTACT */}
        {activeTab === "contact" && (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-base font-black text-white px-1">Información de Contacto</h2>

            {contact.address && (
              <div className="p-4 rounded-2xl bg-[#0E1526] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                  <MapPin className="w-4 h-4" />
                  <span>Ubicación</span>
                </div>
                <p className="text-xs text-slate-300">{contact.address}</p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-[#0E1526] border border-white/5 space-y-2.5">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                <Clock className="w-4 h-4" />
                <span>Horarios de Atención</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300 divide-y divide-white/5">
                {schedule.map((d) => (
                  <div key={d.day} className="pt-1.5 flex justify-between">
                    <span className="capitalize">{d.label}:</span>
                    <span className="font-mono text-slate-400">
                      {d.enabled ? `${d.open} - ${d.close}` : "Cerrado"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── SERVICE BOTTOM SHEET ── */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="w-full max-w-lg bg-[#0E1526] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative space-y-4 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Detalle del Servicio
                </span>
                <h3 className="text-lg font-black text-white">{selectedService.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedService.description || "Atención personalizada con profesionales calificados."}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total</span>
                <span className="text-xl font-black text-white tabular-nums">
                  {selectedService.price ? `$${selectedService.price}` : "Consultar"}
                </span>
              </div>

              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola! Quiero consultar por ${selectedService.name}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-2xl text-white font-bold text-xs shadow-xl flex items-center gap-2"
                  style={{ background: primary }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Reservar</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM APP TAB BAR ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0B0F1A]/95 backdrop-blur-2xl border-t border-white/10 max-w-lg mx-auto h-16 flex items-center justify-around px-2">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "home" ? "text-white" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Home className="w-4 h-4" style={{ color: activeTab === "home" ? primary : undefined }} />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("catalog")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "catalog" ? "text-white" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Grid className="w-4 h-4" style={{ color: activeTab === "catalog" ? primary : undefined }} />
          <span className="text-[10px] font-bold">Servicios</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("booking")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "booking" ? "text-white" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Calendar className="w-4 h-4" style={{ color: activeTab === "booking" ? primary : undefined }} />
          <span className="text-[10px] font-bold">Turnos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "contact" ? "text-white" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <PhoneCall className="w-4 h-4" style={{ color: activeTab === "contact" ? primary : undefined }} />
          <span className="text-[10px] font-bold">Contacto</span>
        </button>
      </nav>
    </div>
  );
}
