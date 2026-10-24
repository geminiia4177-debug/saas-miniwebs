"use client";

import React, { useState } from "react";
import { Sparkles, Clock, MapPin, Phone, Heart, Calendar, ShieldCheck } from "lucide-react";
import LoyaltyCard from "@/components/ui/LoyaltyCard";

interface UnasTemplateProps {
  negocio: any;
  businessId?: string;
  sections?: any[];
  isPreview?: boolean;
}

export default function UnasTemplate({ negocio, businessId }: UnasTemplateProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");

  const cfg = negocio?.layoutConfig || {};
  const colors = cfg.colors || {};
  const primaryColor = colors.primary || "#E07A94";
  const secondaryColor = colors.secondary || "#F9A8D4";
  const bgColor = colors.background || "#0D090B";
  const textColor = colors.text || "#FFFFFF";

  const defaultServices = [
    { id: "u1", category: "uñas", name: "Uñas Acrílicas Esculturales (Nude / Francesa)", price: 480, duration: 90, description: "Estructura perfecta con punta almendra o coffin, acabado brillante o mate." },
    { id: "u2", category: "uñas", name: "Baño de Acrílico / Kapping en Uña Natural", price: 350, duration: 60, description: "Refuerzo protector para crecimiento natural, incluye esmaltado semipermanente." },
    { id: "u3", category: "uñas", name: "Esmaltado en Gel Semipermanente (Gelish)", price: 260, duration: 45, description: "Más de 80 tonos en tendencia. Duración intacta de 21 días garantizada." },
    { id: "p1", category: "pestañas", name: "Extensiones de Pestañas Clásicas 1x1", price: 550, duration: 100, description: "Efecto rímel natural pelo a pelo. Fibras de seda ultra ligeras e hipoalergénicas." },
    { id: "p2", category: "pestañas", name: "Extensiones Volumen Ruso Híbrido", price: 750, duration: 120, description: "Mirada profunda y tupida con abanicos hechos a mano a la medida de tu ojo." },
    { id: "c1", category: "cejas", name: "Laminado de Cejas + Perfilado con Cera", price: 380, duration: 50, description: "Alisado y direccionamiento de vello para cejas orgánicas más pobladas y peinadas." },
    { id: "c2", category: "cejas", name: "Diseño de Cejas con Henna Orgánica", price: 320, duration: 40, description: "Sombreado semipermanente efecto maquillaje en piel (7 días) y vello (3 semanas)." },
  ];

  const services = (cfg.services && cfg.services.length > 0) ? cfg.services : defaultServices;

  const filteredServices = selectedCategory === "todos"
    ? services
    : services.filter((s: any) => (s.category || "").toLowerCase() === selectedCategory);

  const phoneClean = (negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "");

  const handleBookWhatsApp = (service: any) => {
    const text = `¡Hola ${negocio?.name || "Beauty Studio"}! ✨ Me gustaría agendar una cita para el servicio: *${service.name}* ($${service.price} MXN). ¿Qué horarios tienen disponibles?`;
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      className="min-h-[100dvh] font-sans selection:bg-pink-500/30 transition-colors duration-300 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        "--primary": primaryColor,
        "--secondary": secondaryColor,
      } as React.CSSProperties}
    >
      {/* ─── BARRA DE AVISO SUPERIOR (ESTILO BEAUTY STUDIO) ─── */}
      <div className="bg-gradient-to-r from-pink-900/60 via-purple-900/40 to-pink-900/60 border-b border-pink-500/20 py-2.5 px-4 text-center text-xs tracking-wider uppercase font-semibold text-pink-200 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
        <span>Atención con Cita Previa por WhatsApp • Tolerancia 10 min</span>
      </div>

      {/* ─── HERO SECTION ─── */}
      <header className="relative py-16 px-6 sm:px-12 max-w-5xl mx-auto text-center flex flex-col items-center">
        {negocio?.logoUrl ? (
          <img
            src={negocio.logoUrl}
            alt={negocio.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-pink-400/40 shadow-2xl shadow-pink-500/20 mb-6"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-rose-300 flex items-center justify-center text-white mb-6 shadow-xl shadow-pink-500/30">
            <Heart className="w-10 h-10 fill-white" />
          </div>
        )}

        <span className="text-xs font-bold tracking-[0.25em] uppercase text-pink-400 mb-2">
          {negocio?.niche || "Studio de Belleza & Mirada"}
        </span>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4 text-white">
          {negocio?.name || "Lash & Nails Studio"}
        </h1>

        <p className="text-base sm:text-lg text-pink-100/70 max-w-xl mx-auto mb-8 font-light leading-relaxed">
          {negocio?.description || "Realzamos tu belleza natural con técnicas de vanguardia en uñas esculturales, extensiones de pestañas y micropigmentación de cejas."}
        </p>

        {/* Botones de Acción Inmediata */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="#servicios"
            className="px-8 py-4 rounded-full font-bold text-sm tracking-wide bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:brightness-110 shadow-lg shadow-pink-500/30 transition-all flex items-center gap-2.5 active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span>Ver Menú de Servicios</span>
          </a>

          {phoneClean && (
            <a
              href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(`Hola ${negocio?.name || ""}, quiero consultar por citas disponibles.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full font-bold text-sm tracking-wide bg-zinc-900/80 hover:bg-zinc-800 text-pink-300 border border-pink-500/30 transition-all flex items-center gap-2.5"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Directo</span>
            </a>
          )}
        </div>
      </header>

      {/* ─── FILTROS DE CATEGORÍAS ─── */}
      <section id="servicios" className="py-8 px-4 max-w-5xl mx-auto">
        <div className="flex justify-center gap-2 sm:gap-3 flex-wrap mb-10">
          {[
            { id: "todos", label: "✨ Todo el Menú" },
            { id: "uñas", label: "💅 Uñas & Gelish" },
            { id: "pestañas", label: "👁️ Pestañas" },
            { id: "cejas", label: "✨ Cejas & Diseño" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                selectedCategory === cat.id
                  ? "bg-pink-500 text-white shadow-md shadow-pink-500/30 scale-105"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white border border-pink-500/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ─── GRILLA DE SERVICIOS BEAUTY ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredServices.map((s: any) => (
            <div
              key={s.id}
              className="bg-zinc-900/70 border border-pink-500/20 hover:border-pink-500/50 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10 group"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-bold text-lg text-white group-hover:text-pink-300 transition-colors">
                    {s.name}
                  </h3>
                  <span className="font-extrabold text-xl text-pink-400 shrink-0">
                    ${s.price} <span className="text-xs font-normal text-zinc-400">MXN</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-pink-200/60 mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{s.duration || 60} minutos aprox.</span>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed mb-6 font-light">
                  {s.description}
                </p>
              </div>

              <button
                onClick={() => handleBookWhatsApp(s)}
                className="w-full py-3.5 rounded-2xl bg-pink-500/10 hover:bg-pink-500 text-pink-300 hover:text-white border border-pink-500/30 hover:border-pink-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Agendar por WhatsApp</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TARJETA DE FIDELIZACIÓN (SELLOS DIGITALES) ─── */}
      <section className="py-12 px-4 max-w-md mx-auto">
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-pink-400">Programa de Clienta Frecuente</span>
          <h2 className="text-2xl font-bold text-white mt-1">¡Tus Visitas Tienen Premio!</h2>
        </div>
        <LoyaltyCard
          businessId={businessId || negocio?.id || "beauty"}
          businessName={negocio?.name || "Beauty Studio"}
          initialReward="Retoque de Gelish o Tratamiento de Hidratación GRATIS"
          initialGoal={5}
        />
      </section>

      {/* ─── POLÍTICA DE PUNTUALIDAD ANTI NO-SHOW ─── */}
      <section className="py-12 px-6 max-w-3xl mx-auto">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-pink-400 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-white text-base mb-1">
              Política de Puntualidad & Cuidado de tu Turno
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Para garantizar que cada clienta reciba su servicio sin prisas, contamos con una tolerancia máxima de 10 minutos. Te enviaremos un recordatorio por WhatsApp 24 horas antes con un botón para confirmar tu turno en 1 toque.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER & UBICACIÓN ─── */}
      <footer className="py-12 px-6 border-t border-pink-500/10 text-center text-xs text-zinc-500 max-w-5xl mx-auto flex flex-col items-center gap-3">
        {negocio?.address && (
          <p className="flex items-center gap-1.5 text-zinc-400">
            <MapPin className="w-3.5 h-3.5 text-pink-400" />
            <span>{negocio.address}</span>
          </p>
        )}
        <p>© {new Date().getFullYear()} {negocio?.name || "Studio de Belleza"}. Todos los derechos reservados.</p>
        <p className="text-[11px] opacity-60">
          Powered by <span className="font-bold text-pink-300">SaaS Miniwebs</span> • México
        </p>
      </footer>
    </div>
  );
}
