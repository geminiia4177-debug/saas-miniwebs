"use client";

import React, { useState } from "react";
import { Scissors, Flame, Clock, MapPin, Phone, ShieldCheck, Zap, Sparkles, Award } from "lucide-react";
import LoyaltyCard from "@/components/ui/LoyaltyCard";

interface UrbanFadeTemplateProps {
  negocio: any;
  businessId?: string;
  sections?: any[];
  isPreview?: boolean;
}

export default function UrbanFadeTemplate({ negocio, businessId }: UrbanFadeTemplateProps) {
  const [selectedFade, setSelectedFade] = useState<string>("todos");
  const [selectedBarber, setSelectedBarber] = useState<string>("cualquiera");

  const cfg = negocio?.layoutConfig || {};
  const colors = cfg.colors || {};
  const primaryColor = colors.primary || "#06B6D4"; // Cian neón urbano
  const secondaryColor = colors.secondary || "#8B5CF6"; // Morado eléctrico
  const bgColor = colors.background || "#0B0F19";
  const textColor = colors.text || "#F8FAFC";

  const defaultServices = [
    { id: "uf1", category: "corte", name: "Skin Fade / Desvanecido a Cero con Shaver", price: 280, duration: 40, description: "Degradado quirúrgico a navaja o shaver, perfilado milimétrico y peinado con cera mate." },
    { id: "uf2", category: "corte", name: "Taper Fade + Texturizado Arriba", price: 250, duration: 35, description: "Desvanecido limpio solo en patillas y nuca. Texturizado con polvo voluminizador." },
    { id: "uf3", category: "barba", name: "Perfilado de Barba + Pigmento Semi-permanente", price: 200, duration: 30, description: "Alineación de contornos con navaja tradicional, toalla caliente y pigmentación para máxima definición." },
    { id: "uf4", category: "combo", name: "Combo Full Urban (Fade + Barba + Cejas)", price: 420, duration: 60, description: "Corte completo, ritual de barba con vapor ozono, exfoliación y diseño de cejas con navaja." },
    { id: "uf5", category: "freestyle", name: "Diseño Freestyle / Grecas Artísticas", price: 150, duration: 25, description: "Líneas, figuras geométricas o tribal personalizadas en laterales con acabado a navaja." },
    { id: "uf6", category: "color", name: "Decoloración Global / Platinado Urbano", price: 850, duration: 120, description: "Extracción de color con plex protector, matiz platinado cenizo y tratamiento sellador." },
  ];

  const barbers = [
    { id: "b1", name: "Alex 'The Razor'", tag: "Especialista en Fades y Texturizado" },
    { id: "b2", name: "Carlos 'Kidd'", tag: "Master en Freestyle y Diseños" },
    { id: "b3", name: "Dany Fade", tag: "Especialista en Barba y Perfilado" },
  ];

  const services = (cfg.services && cfg.services.length > 0) ? cfg.services : defaultServices;
  const phoneClean = (negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "");

  const handleBook = (s: any) => {
    const barberTxt = selectedBarber !== "cualquiera" ? ` con el barbero *${selectedBarber}*` : "";
    const text = `¡Qué onda ${negocio?.name || "Urban Studio"}! ✂️ Quiero agendar cita para: *${s.name}* ($${s.price} MXN)${barberTxt}. ¿Qué horarios tienen disponibles hoy o mañana?`;
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      className="min-h-[100dvh] font-sans selection:bg-cyan-500/30 transition-colors duration-300"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        "--primary": primaryColor,
        "--secondary": secondaryColor,
      } as React.CSSProperties}
    >
      {/* ─── VIBE BAR SUPERIOR (URBAN TRAP & STREET) ─── */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-purple-950/80 border-b border-cyan-500/20 py-2.5 px-4 text-center text-xs tracking-wider uppercase font-bold text-cyan-300 flex items-center justify-center gap-2">
        <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>Urban Barber Lab • Reserva tu Sillón por WhatsApp • Cero Filas</span>
      </div>

      {/* ─── HERO STREETWEAR ─── */}
      <header className="relative py-16 px-6 sm:px-12 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white mb-6 shadow-2xl shadow-cyan-500/30 transform -rotate-3 hover:rotate-0 transition-transform">
          <Scissors className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black tracking-widest uppercase mb-3">
          <Sparkles className="w-3 h-3" />
          <span>{negocio?.niche || "Streetwear Barber Studio"}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 text-white uppercase italic">
          {negocio?.name || "Fade & Street Barber"}
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-8 font-light leading-relaxed">
          {negocio?.description || "Degradados de alta precisión, perfilados con navaja y estilo urbano. El corte exacto que ves en tu feed, sin esperas innecesarias."}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="#servicios"
            className="px-8 py-4 rounded-xl font-black text-sm tracking-wide bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-xl shadow-cyan-500/25 transition-all flex items-center gap-2 active:scale-95 uppercase"
          >
            <Scissors className="w-4 h-4" />
            <span>Ver Menú de Cortes</span>
          </a>

          {phoneClean && (
            <a
              href={`https://wa.me/${phoneClean}?text=${encodeURIComponent("Hola, quiero apartar turno para hoy.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl font-bold text-sm tracking-wide bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Directo</span>
            </a>
          )}
        </div>
      </header>

      {/* ─── SELECTOR DE BARBERO ─── */}
      <section className="py-6 px-4 max-w-4xl mx-auto">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">Elige a tu Barbero</span>
            <p className="text-xs text-slate-400 font-light">¿Tienes un profesional de preferencia en el equipo?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBarber("cualquiera")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedBarber === "cualquiera" ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:text-white"}`}
            >
              Cualquiera disponible
            </button>
            {barbers.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBarber(b.name)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedBarber === b.name ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:text-white"}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GRILLA DE SERVICIOS URBANOS ─── */}
      <section id="servicios" className="py-10 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Servicios Urbanos</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase italic mt-1">Cortes & Ritual de Barba</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((s: any) => (
            <div
              key={s.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 group"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-black text-lg text-white group-hover:text-cyan-300 transition-colors uppercase tracking-wide">
                    {s.name}
                  </h3>
                  <span className="font-black text-xl text-cyan-400 shrink-0">
                    ${s.price} <span className="text-xs font-sans text-slate-400 font-normal">MXN</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{s.duration || 40} minutos aprox.</span>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed mb-6 font-light">
                  {s.description}
                </p>
              </div>

              <button
                onClick={() => handleBook(s)}
                className="w-full py-3.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 hover:border-cyan-500 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Agendar Turno con WhatsApp</span>
                <Scissors className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TARJETA DE SELLOS URBANOS ─── */}
      <section className="py-12 px-4 max-w-md mx-auto">
        <div className="text-center mb-6">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Club de Fieles</span>
          <h2 className="text-2xl font-black text-white uppercase italic mt-1">¡Corte Gratis en tu 6ta Visita!</h2>
        </div>
        <LoyaltyCard
          businessId={businessId || negocio?.id || "urban-fade"}
          businessName={negocio?.name || "Fade Barber"}
          initialReward="Corte Skin Fade o Ritual de Barba GRATIS"
          initialGoal={6}
          accentColor={primaryColor}
        />
      </section>

      {/* ─── POLÍTICA ANTI NO-SHOW ─── */}
      <section className="py-10 px-6 max-w-3xl mx-auto">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white text-base mb-1">
              Puntualidad de Barrio & Cuidado del Turno
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Para respetar los turnos de todos, contamos con 10 minutos de tolerancia. Te enviamos recordatorio con 1 clic para confirmar tu llegada 24 horas antes.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 px-6 border-t border-slate-800 text-center text-xs text-slate-500 max-w-5xl mx-auto flex flex-col items-center gap-3 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]">
        {negocio?.address && (
          <p className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>{negocio.address}</span>
          </p>
        )}
        <p>© {new Date().getFullYear()} {negocio?.name || "Barber Studio"}. Todos los derechos reservados.</p>
        <p className="text-[11px] opacity-60">
          Powered by <span className="font-bold text-cyan-400">SaaS Miniwebs</span> • México
        </p>
      </footer>
    </div>
  );
}
