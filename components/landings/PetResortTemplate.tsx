"use client";

import React, { useState } from "react";
import { Dog, Sun, ShieldCheck, Clock, Calendar, Heart, Camera, Sparkles } from "lucide-react";
import LoyaltyCard from "@/components/ui/LoyaltyCard";

interface PetResortTemplateProps {
  negocio: any;
  businessId?: string;
  sections?: any[];
  isPreview?: boolean;
}

export default function PetResortTemplate({ negocio, businessId }: PetResortTemplateProps) {
  const [selectedPetSize, setSelectedPetSize] = useState<"chico" | "mediano" | "grande">("mediano");
  const [stayDuration, setStayDuration] = useState<number>(1);

  const cfg = negocio?.layoutConfig || {};
  const colors = cfg.colors || {};
  const primaryColor = colors.primary || "#10B981"; // Verde esmeralda campestre
  const secondaryColor = colors.secondary || "#F59E0B"; // Sol dorado / energía
  const bgColor = colors.background || "#064E3B"; // Dark Pine Forest Resort
  const textColor = colors.text || "#ECFDF5";

  const defaultServices = [
    {
      id: "pr1",
      name: "Noche de Hotel Canino VIP (Suite Climatizada sin Jaulas)",
      price: 450,
      tag: "Hospedaje de Lujo",
      description: "Habitación individual con camita ortopédica, música relajante, 4 paseos en jardín empastado y reportes de fotos/videos por WhatsApp cada 2 horas.",
    },
    {
      id: "pr2",
      name: "Daycare / Guardería de Día Campestre (8 AM a 7 PM)",
      price: 280,
      tag: "Socialización & Juego",
      description: "Día completo de juegos supervisados por entrenadores certificados, alberca de pelotas, circuito de agilidad y hora de siesta en sombra.",
    },
    {
      id: "pr3",
      name: "Sesión de Alberca Climatizada Canina + Hidromasaje",
      price: 320,
      tag: "Hidroterapia & Diversión",
      description: "Alberca con rampa suave, chaleco salvavidas incluido y monitor acuático. Ideal para quemar energía, salud articular y perritos seniors.",
    },
    {
      id: "pr4",
      name: "Spa Canino Completo + Deslanado Furminator",
      price: 380,
      tag: "Grooming Premium",
      description: "Baño tibio con shampoo hipoalergénico de avena, eliminación de nudos, vaciado de glándulas, corte de uñas con lima pulidora y perfume natural.",
    },
    {
      id: "pr5",
      name: "Transporte 'Pet Taxi' Redondo Climatizado",
      price: 180,
      tag: "Comodidad Puerta a Puerta",
      description: "Recogemos y entregamos a tu peludo directamente en tu domicilio en camioneta con arneses de seguridad y aire acondicionado.",
    },
    {
      id: "pr6",
      name: "Entrenamiento Positivo de Modificación de Conducta (1h)",
      price: 450,
      tag: "Adiestramiento Amable",
      description: "Sesión 1 a 1 de obediencia urbana, control de impulsos y socialización con reforzamiento positivo (sin collares de castigo).",
    },
  ];

  const services = (cfg.services && cfg.services.length > 0) ? cfg.services : defaultServices;
  const phoneClean = (negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "");

  const handleBook = (s: any) => {
    const sizeTxt = ` (Tamaño de mascota: *${selectedPetSize.toUpperCase()}*, Estancia: *${stayDuration} día(s)*)`;
    const msg = `¡Hola *${negocio?.name || "Pet Resort & Hotel Canino"}*! 🐾 Quiero reservar para mi perrito: *${s.name}* ($${s.price} MXN)${sizeTxt}. ¿Tienen espacio para las fechas próximas? Cuento con su cartilla de vacunación completa.`;
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleCheckRequirements = () => {
    const msg = `¡Hola *${negocio?.name || "Pet Resort"}*! 🐶 Quisiera consultar los requisitos de cartilla y vacunas (Séxtuple, Rabia, Bordetella) para ingresar a mi perro a su hotel/guardería. ¿Me podrían orientar?`;
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div
      className="min-h-[100dvh] font-sans selection:bg-emerald-500/30 transition-colors duration-300 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        "--primary": primaryColor,
        "--secondary": secondaryColor,
      } as React.CSSProperties}
    >
      {/* ─── RESORT PROMISE BAR ─── */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-green-950 border-b border-emerald-500/30 py-2.5 px-4 text-center text-xs tracking-wider uppercase font-bold text-emerald-300 flex items-center justify-center gap-2">
        <Sun className="w-4 h-4 text-amber-400 animate-spin" />
        <span>Resort Campestre 100% Libre de Jaulas • Fotos y Videos por WhatsApp • Jardines de 2,000m²</span>
      </div>

      {/* ─── HERO HOTEL CANINO VIP ─── */}
      <header className="relative py-14 px-6 sm:px-12 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-amber-400 flex items-center justify-center text-slate-950 mb-6 shadow-2xl shadow-emerald-500/30">
          <Dog className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black tracking-widest uppercase mb-3">
          <Sparkles className="w-3 h-3" />
          <span>{negocio?.niche || "Hotel Canino Boutique & Guardería Campestre"}</span>
        </div>

        <h1 className="text-3xl sm:text-6xl font-black tracking-tight mb-4 text-white uppercase">
          {negocio?.name || "Rancho Canino Resort & Spa"}
        </h1>

        <p className="text-base sm:text-lg text-emerald-100/80 max-w-xl mx-auto mb-6 font-light leading-relaxed">
          {negocio?.description || "Vacaciones soñadas para tu mejor amigo. Áreas verdes abiertas, alberca con hidromasaje, suites climatizadas y cuidadores amorosos las 24 horas del día."}
        </p>

        {/* Garantías de Seguridad */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mb-8 text-xs font-semibold text-emerald-100">
          <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-3 flex flex-col items-center gap-1">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Fotos & Videos Cada 2h</span>
          </div>
          <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-3 flex flex-col items-center gap-1">
            <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>Cero Jaulas ni Castigos</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-950/60 border border-emerald-500/30 rounded-xl p-3 flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Veterinario en Guardia 24/7</span>
          </div>
        </div>

        {/* Calculadora de Estancia Rápida */}
        <div className="w-full max-w-md bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 text-left mb-6 shadow-xl">
          <span className="block text-xs font-black uppercase text-amber-400 tracking-wider mb-2">
            Configura la estancia de tu perrito
          </span>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] text-emerald-200 block mb-1">Tamaño:</label>
              <select
                value={selectedPetSize}
                onChange={(e) => setSelectedPetSize(e.target.value as any)}
                className="w-full bg-slate-900 border border-emerald-500/30 text-white rounded-xl p-2 text-xs font-semibold focus:outline-none"
                style={{ fontSize: "16px" }}
              >
                <option value="chico">Chico (Pug, Pomerania, Shih Tzu)</option>
                <option value="mediano">Mediano (French, Beagle, Corgi)</option>
                <option value="grande">Grande (Golden, Husky, Pastor)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-emerald-200 block mb-1">Días estimativos:</label>
              <input
                type="number"
                min="1"
                max="30"
                value={stayDuration}
                onChange={(e) => setStayDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-900 border border-emerald-500/30 text-white rounded-xl p-2 text-xs font-semibold focus:outline-none"
                style={{ fontSize: "16px" }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-900/40">
            <button
              onClick={handleCheckRequirements}
              className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1 text-[11px]"
            >
              <span>Ver requisitos de vacunas</span>
            </button>
            <span className="text-emerald-300 text-[11px] font-mono">Cupo limitado por día</span>
          </div>
        </div>
      </header>

      {/* ─── MENÚ DE SERVICIOS RESORT ─── */}
      <section className="py-6 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-wide">Planes de Hospedaje, Guardería y Spa</h2>
          <p className="text-xs text-emerald-200/70 mt-1">Supervisión amorosa constante y protocolo de adaptación sin estrés</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((s: any) => (
            <div
              key={s.id}
              className="bg-slate-950/70 border border-emerald-500/20 hover:border-emerald-400/50 rounded-2xl p-5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-white text-base leading-snug">{s.name}</h3>
                  <span className="text-amber-400 font-black text-lg whitespace-nowrap">
                    ${s.price} <span className="text-xs font-normal text-emerald-200/60">MXN</span>
                  </span>
                </div>

                {s.tag && (
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 mb-3">
                    {s.tag}
                  </span>
                )}

                <p className="text-xs text-emerald-100/70 leading-relaxed mb-4">{s.description}</p>
              </div>

              <div className="pt-3 border-t border-emerald-900/40 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Atención personalizada
                </span>
                <button
                  onClick={() => handleBook(s)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reservar Espacio</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PROGRAMA DE LEALTAD PATITAS CLUB ─── */}
      <section className="py-8 px-4 sm:px-8 max-w-xl mx-auto">
        <LoyaltyCard
          businessId={businessId || negocio?.id || "petresort-demo"}
          businessName={negocio?.name || "Rancho Canino Resort"}
          accentColor={primaryColor}
          initialGoal={6}
          initialReward="Día de Guardería Gratis o Baño Spa de Cortesía"
        />
      </section>

      {/* ─── UBICACIÓN CAMPESINA & TRANSPORTE ─── */}
      <footer className="py-8 px-4 text-center border-t border-emerald-900/50 max-w-3xl mx-auto text-xs text-emerald-200/60 space-y-2">
        <p className="font-semibold text-emerald-100">
          📍 {negocio?.address || "Finca Campestre con Seguridad 24/7 • Servicio de Pet Taxi a Domicilio"}
        </p>
        <p className="text-[11px]">
          Requisito obligatorio para ingreso de perritos: Cartilla con vacunas vigentes (Séxtuple, Rabia, Bordetella) y desparasitación externa/interna reciente para proteger a toda la manada.
        </p>
      </footer>
    </div>
  );
}
