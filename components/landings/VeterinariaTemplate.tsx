"use client";

import React, { useState } from "react";
import { Sparkles, Clock, MapPin, Phone, Calendar, Heart, ShieldCheck } from "lucide-react";
import LoyaltyCard from "@/components/ui/LoyaltyCard";

interface VeterinariaTemplateProps {
  negocio: any;
  businessId?: string;
  sections?: any[];
  isPreview?: boolean;
}

export default function VeterinariaTemplate({ negocio, businessId }: VeterinariaTemplateProps) {
  const [petType, setPetType] = useState<string>("perro");

  const cfg = negocio?.layoutConfig || {};
  const colors = cfg.colors || {};
  const primaryColor = colors.primary || "#10B981"; // Esmeralda / Menta pet-friendly
  const secondaryColor = colors.secondary || "#059669";
  const bgColor = colors.background || "#08130E";
  const textColor = colors.text || "#ECFDF5";

  const defaultServices = [
    { id: "v1", type: "medico", name: "Consulta Médica Veterinaria General", price: 350, duration: 30, description: "Revisión física exhaustiva, peso, auscultación cardíaca y diagnóstico clínico por médico veterinario titulado." },
    { id: "v2", type: "estetica", name: "Baño Completo & Corte Estético (Raza Chica)", price: 320, duration: 60, description: "Corte según raza, deslanado, limpieza de oídos, corte de uñas y vaciado de glándulas perianales." },
    { id: "v3", type: "estetica", name: "Baño & Corte Estético (Raza Mediana / Grande)", price: 480, duration: 90, description: "Shampoo hipoalergénico con aromaterapia, hidratación de manto, secado profesional y corte a tijera." },
    { id: "v4", type: "medico", name: "Vacuna Quíntuple / Séxtuple Canina Anual", price: 450, duration: 25, description: "Protección contra parvovirus, moquillo, hepatitis y leptospirosis. Incluye cartilla de vacunación oficial." },
    { id: "v5", type: "medico", name: "Desparasitación Interna y Externa (Pipeta / Tableta)", price: 220, duration: 15, description: "Tratamiento completo contra pulgas, garrapatas y parásitos intestinales según el peso de tu mascota." },
    { id: "v6", type: "estetica", name: "Limpieza Dental Canina Preventiva (Sin Sedación)", price: 850, duration: 60, description: "Eliminación de placa bacteriana superficial y sarro para combatir el mal aliento y proteger sus encías." },
  ];

  const services = (cfg.services && cfg.services.length > 0) ? cfg.services : defaultServices;
  const phoneClean = (negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "");

  const handleBookWhatsApp = (service: any) => {
    const text = `¡Hola ${negocio?.name || "Clínica Veterinaria"}! 🐾 Quiero agendar una cita para mi mascota para: *${service.name}* ($${service.price} MXN). ¿Qué horarios tienen disponibles?`;
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      className="min-h-[100dvh] font-sans selection:bg-emerald-500/30 transition-colors duration-300 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        "--primary": primaryColor,
        "--secondary": secondaryColor,
      } as React.CSSProperties}
    >
      {/* ─── BANNER SUPERIOR ─── */}
      <div className="bg-emerald-950/70 border-b border-emerald-500/20 py-2.5 px-4 text-center text-xs tracking-wider font-semibold text-emerald-200 flex items-center justify-center gap-2">
        <span>🐾 Cuidado Médico Confiable & Estética Canina con Amor • Atención por WhatsApp</span>
      </div>

      {/* ─── HERO VETERINARIA ─── */}
      <header className="relative py-16 px-6 sm:px-12 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-500/10 text-3xl">
          🐶
        </div>

        <span className="text-xs font-bold tracking-[0.25em] uppercase text-emerald-400 mb-2">
          {negocio?.niche || "Veterinaria & Estética Canina"}
        </span>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 text-white">
          {negocio?.name || "Clínica Veterinaria & Spa Canino"}
        </h1>

        <p className="text-base sm:text-lg text-emerald-100/70 max-w-xl mx-auto mb-8 font-light leading-relaxed">
          {negocio?.description || "Tu mejor amigo en las mejores manos. Medicina preventiva, urgencias veterinarias, vacunas y estética profesional con trato libre de estrés."}
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="#servicios"
            className="px-8 py-4 rounded-full font-bold text-sm tracking-wide bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span>Ver Servicios & Precios</span>
          </a>

          {phoneClean && (
            <a
              href={`https://wa.me/${phoneClean}?text=${encodeURIComponent("Hola, quiero consultar por una cita de estética o revisión para mi mascota.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full font-bold text-sm tracking-wide bg-zinc-900/80 hover:bg-zinc-800 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Directo</span>
            </a>
          )}
        </div>
      </header>

      {/* ─── MENÚ DE SERVICIOS VET & SPA ─── */}
      <section id="servicios" className="py-12 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Servicios para Mascotas</span>
          <h2 className="text-3xl font-extrabold text-white mt-1">Salud & Belleza para tu Peludo</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((s: any) => (
            <div
              key={s.id}
              className="bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/50 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 group"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">
                    {s.name}
                  </h3>
                  <span className="font-extrabold text-xl text-emerald-400 shrink-0">
                    ${s.price} <span className="text-xs font-normal text-zinc-400">MXN</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-300/70 mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{s.duration || 45} min aprox.</span>
                </div>

                <p className="text-sm text-zinc-400 leading-relaxed mb-6 font-light">
                  {s.description}
                </p>
              </div>

              <button
                onClick={() => handleBookWhatsApp(s)}
                className="w-full py-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Agendar Cita por WhatsApp</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FIDELIZACIÓN (SELLOS CANINOS) ─── */}
      <section className="py-12 px-4 max-w-md mx-auto">
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Club Patitas Frecuentes</span>
          <h2 className="text-2xl font-bold text-white mt-1">¡Premio para tu Mascota!</h2>
        </div>
        <LoyaltyCard
          businessId={businessId || negocio?.id || "veterinaria"}
          businessName={negocio?.name || "Clínica Veterinaria"}
          initialReward="Baño y Deslanado de Cortesía en tu 6ta visita"
          initialGoal={6}
        />
      </section>

      {/* ─── AVISO DE RECORDATORIO RECURRENTE ─── */}
      <section className="py-12 px-6 max-w-3xl mx-auto">
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-3xl p-6 sm:p-8 flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white text-base mb-1">
              Recordatorios Automáticos de Baño & Vacunas
            </h3>
            <p className="text-sm text-emerald-100/70 leading-relaxed font-light">
              Nunca olvides la fecha de baño o refuerzo de vacuna de tu mascota. Al agendar con nosotros, te recordamos por WhatsApp cada 4 semanas para que mantengas a tu mejor amigo siempre limpio y protegido.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 px-6 border-t border-emerald-500/10 text-center text-xs text-zinc-500 max-w-5xl mx-auto flex flex-col items-center gap-3">
        {negocio?.address && (
          <p className="flex items-center gap-1.5 text-zinc-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{negocio.address}</span>
          </p>
        )}
        <p>© {new Date().getFullYear()} {negocio?.name || "Clínica Veterinaria"}. Todos los derechos reservados.</p>
        <p className="text-[11px] opacity-60">
          Powered by <span className="font-bold text-emerald-300">SaaS Miniwebs</span> • México
        </p>
      </footer>
    </div>
  );
}
