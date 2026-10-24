"use client";

import React, { useState } from "react";
import { Sparkles, Calendar, Clock, Heart, ShieldCheck, Gem, Award } from "lucide-react";
import LoyaltyCard from "@/components/ui/LoyaltyCard";

interface GlitzLashTemplateProps {
  negocio: any;
  businessId?: string;
  sections?: any[];
  isPreview?: boolean;
}

export default function GlitzLashTemplate({ negocio, businessId }: GlitzLashTemplateProps) {
  const [selectedShape, setSelectedShape] = useState<string>("almendra");
  const [selectedLength, setSelectedLength] = useState<string>("mediana");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");

  const cfg = negocio?.layoutConfig || {};
  const colors = cfg.colors || {};
  const primaryColor = colors.primary || "#EC4899"; // Fucsia Neón / Hot Pink Luxury
  const secondaryColor = colors.secondary || "#F43F5E"; // Rose Glamour
  const bgColor = colors.background || "#09090B"; // Dark Velvet Luxury
  const textColor = colors.text || "#FAFAFA";

  const defaultServices = [
    {
      id: "gl1",
      name: "Mega Volumen Ruso & Efecto Foxy Eyes",
      category: "pestanas",
      price: 950,
      duration: 120,
      description: "Abanicos hechos a mano de 6D a 10D con curvatura personalizada. Retención de 4 a 6 semanas con adhesivo de grado médico hipoalergénico.",
    },
    {
      id: "gl2",
      name: "Esculturales XL con Encapsulado 3D & Cristales Swarovski",
      category: "unas",
      price: 850,
      duration: 110,
      description: "Estructura perfecta con acrílico de alta densidad, efecto cuarzo o milky glitter, y pedrería original montada con gel estructural.",
    },
    {
      id: "gl3",
      name: "Efecto Wet Lash / Pestañas Efecto Mojado",
      category: "pestanas",
      price: 780,
      duration: 90,
      description: "Pestañas con efecto espiga texturizada que simulan mirada mojada y fresca. Ideal para lucir maquillada sin esfuerzo.",
    },
    {
      id: "gl4",
      name: "Rubber Gel Fortalecedor + Manicura Rusa Profunda",
      category: "unas",
      price: 480,
      duration: 60,
      description: "Limpieza anatómica de cutícula con fresas diamantadas de precisión y nivelación con base rubber para uñas naturales fuertes.",
    },
    {
      id: "gl5",
      name: "Laminado de Cejas HD + Diseño con Henna / Híbrido",
      category: "cejas",
      price: 450,
      duration: 45,
      description: "Direccionamiento de folículos rebeldes para mayor densidad visual y perfilado con tinte híbrido de larga duración en piel y vello.",
    },
    {
      id: "gl6",
      name: "Retiro Seguro con Vapor Ozono & Nutrición de Queratina",
      category: "mantenimiento",
      price: 250,
      duration: 35,
      description: "Retiro sin daño mecánico con bálsamo desmineralizante y baño nutritivo de queratina botánica para pestañas y uñas naturales.",
    },
  ];

  const services = (cfg.services && cfg.services.length > 0) ? cfg.services : defaultServices;
  const filteredServices = selectedCategory === "todos" ? services : services.filter((s: any) => s.category === selectedCategory);
  const phoneClean = (negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "");

  const handleBook = (s: any) => {
    const shapeText = s.category === "unas" ? ` (Forma deseada: *${selectedShape.toUpperCase()}*, Largo: *${selectedLength.toUpperCase()}*)` : "";
    const msg = `¡Hola *${negocio?.name || "Glitz & Lash Studio"}*! ✨ Quiero agendar cita VIP para: *${s.name}* ($${s.price} MXN)${shapeText}. ¿Qué fechas y horarios tienen disponibles esta semana?`;
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div
      className="min-h-[100dvh] font-sans selection:bg-pink-500/30 transition-colors duration-300 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        "--primary": primaryColor,
        "--secondary": secondaryColor,
      } as React.CSSProperties}
    >
      {/* ─── LUXURY BAR ─── */}
      <div className="bg-gradient-to-r from-pink-950 via-purple-950 to-rose-950 border-b border-pink-500/30 py-2.5 px-4 text-center text-xs tracking-widest uppercase font-bold text-pink-300 flex items-center justify-center gap-2">
        <Gem className="w-3.5 h-3.5 text-pink-400 animate-bounce" />
        <span>Studio VIP • Esterilización Autoclave Grado Hospital • Citas Exclusivas</span>
      </div>

      {/* ─── HERO DARK GLAM ─── */}
      <header className="relative py-16 px-6 sm:px-12 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-300 flex items-center justify-center text-white mb-6 shadow-2xl shadow-pink-500/30 ring-4 ring-pink-500/20">
          <Sparkles className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-black tracking-widest uppercase mb-3">
          <Heart className="w-3 h-3 fill-pink-400" />
          <span>{negocio?.niche || "Luxury Nails & Lash Artistry"}</span>
        </div>

        <h1 className="text-3xl sm:text-6xl font-black tracking-tight mb-4 text-white uppercase italic">
          {negocio?.name || "Glitz & Glam Lash Bar"}
        </h1>

        <p className="text-base sm:text-lg text-neutral-300 max-w-xl mx-auto mb-8 font-light leading-relaxed">
          {negocio?.description || "Diseño de miradas de alto impacto y arte en uñas de alta costura. Trabajamos con materiales premium importados e instrumental 100% esterilizado en autoclave."}
        </p>

        {/* Badges de Calidad */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg mb-8 text-xs font-semibold text-neutral-300">
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-pink-500/20 px-3.5 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-pink-400" />
            <span>Autoclave Grado Quirúrgico</span>
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-pink-500/20 px-3.5 py-2 rounded-xl">
            <Award className="w-4 h-4 text-pink-400" />
            <span>Artistas Certificadas</span>
          </div>
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-pink-500/20 px-3.5 py-2 rounded-xl">
            <Clock className="w-4 h-4 text-pink-400" />
            <span>Tolerancia Máx: 10 Min</span>
          </div>
        </div>

        {/* Selector Interactivo de Estilo de Uñas */}
        <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 text-left mb-6 shadow-xl">
          <span className="block text-xs font-black uppercase text-pink-400 tracking-wider mb-2">
            Personaliza tu Estilo Favorito
          </span>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Forma de Uña:</label>
              <select
                value={selectedShape}
                onChange={(e) => setSelectedShape(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
                style={{ fontSize: "16px" }}
              >
                <option value="almendra">Almendra (Elegante)</option>
                <option value="coffin">Coffin / Bailarina</option>
                <option value="stiletto">Stiletto (Extrema)</option>
                <option value="cuadrada">Cuadrada Clásica</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Largo Deseado:</label>
              <select
                value={selectedLength}
                onChange={(e) => setSelectedLength(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-2 text-xs font-semibold focus:outline-none focus:border-pink-500"
                style={{ fontSize: "16px" }}
              >
                <option value="corta">N° 1 - 2 (Corta y Práctica)</option>
                <option value="mediana">N° 3 - 4 (Media Estilizada)</option>
                <option value="larga">N° 5 - 6 (Larga Glam)</option>
                <option value="xl">N° 7+ (Mega XL Artística)</option>
              </select>
            </div>
          </div>
          <p className="text-[10px] text-neutral-500">
            * Al agendar tu cita por WhatsApp, tu preferencia de forma y largo se enviará pre-cargada.
          </p>
        </div>
      </header>

      {/* ─── FILTROS Y CATÁLOGO DE SERVICIOS ─── */}
      <section className="py-6 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wide">Menú de Tratamientos VIP</h2>
            <p className="text-xs text-neutral-400 mt-1">Garantía de 7 días en retención de pestañas y durabilidad de esmaltado</p>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            {(["todos", "pestanas", "unas", "cejas"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  selectedCategory === cat
                    ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((s: any) => (
            <div
              key={s.id}
              className="bg-neutral-900/60 border border-neutral-800 hover:border-pink-500/40 rounded-2xl p-5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-white text-base leading-snug">{s.name}</h3>
                  <span className="text-pink-400 font-black text-lg whitespace-nowrap">
                    ${s.price} <span className="text-xs font-normal text-neutral-400">MXN</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-neutral-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-pink-400" />
                    {s.duration || 60} min
                  </span>
                  <span className="text-pink-500">•</span>
                  <span>Incluye aromaterapia y colágeno de cortesía</span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed mb-4">{s.description}</p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Apartado sin comisión</span>
                <button
                  onClick={() => handleBook(s)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/20 active:scale-95 transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar Cita VIP</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TARJETA DE LEALTAD GLAM ─── */}
      <section className="py-8 px-4 sm:px-8 max-w-xl mx-auto">
        <LoyaltyCard
          businessId={businessId || negocio?.id || "glitz-demo"}
          businessName={negocio?.name || "Glitz & Lash Studio"}
          accentColor={primaryColor}
          initialGoal={5}
          initialReward="Retiro Gratis o Efecto Glitter Extra en tu 5ta Visita"
        />
      </section>

      {/* ─── POLÍTICA ANTI NO-SHOW ─── */}
      <footer className="py-8 px-4 text-center border-t border-neutral-800/60 max-w-3xl mx-auto text-xs text-neutral-400 space-y-2">
        <p className="font-semibold text-neutral-300">
          📍 {negocio?.address || "Atención en cabina privada climatizada • Estacionamiento seguro"}
        </p>
        <p className="text-[11px] text-neutral-500">
          * Para respetar la agenda de todas las clientas, contamos con 10 minutos de tolerancia. En caso de cancelación, por favor avísanos 4 horas antes por WhatsApp para reasignar tu espacio.
        </p>
      </footer>
    </div>
  );
}
