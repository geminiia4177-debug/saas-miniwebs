"use client";

import React, { useState } from "react";
import { Bebas_Neue, Inter } from "next/font/google";
import { Scissors, Clock, MapPin, Phone, ShieldCheck, Calendar } from "lucide-react";
import LoyaltyCard from "@/components/ui/LoyaltyCard";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap" });
const inter = Inter({ subsets: ["latin"], display: "swap" });

interface ElPatronTemplateProps {
  negocio: any;
  businessId?: string;
  sections?: any[];
  isPreview?: boolean;
}

export default function ElPatronTemplate({ negocio, businessId }: ElPatronTemplateProps) {
  const cfg = negocio?.layoutConfig || {};

  const services =
    cfg.barberiaServices ||
    cfg.services || [
      { id: "1", name: "Corte Clásico Tradicional", price: 120, duration: 30, description: "Tijera o máquina, parejo, limpio y terminado con navaja al cuello." },
      { id: "2", name: "Corte y Arreglo de Barba con Toalla Caliente", price: 200, duration: 50, description: "Perfilado al ras, espuma tibia, aceite hidratante y toalla al vapor." },
      { id: "3", name: "Afeitado Clásico a Navaja", price: 110, duration: 30, description: "Espuma caliente tradicional, masaje facial relajante y loción after-shave." },
      { id: "4", name: "Corte Escolar / Niño", price: 100, duration: 25, description: "Corte rápido y paciente para los más chicos." },
      { id: "5", name: "Perfilado de Cejas y Limpieza Facial", price: 60, duration: 15, description: "Simetría con navaja desechable esterilizada." },
      { id: "6", name: "Tinte de Barba / Cubre Canas", price: 140, duration: 30, description: "Tono natural uniforme y duradero." },
    ];

  const handleBookService = (service: any) => {
    const msg =
      `💈 *¡Hola ${negocio?.name || "Barbería El Patrón"}! Quiero agendar una cita:*\n\n` +
      `✂️ *Servicio:* ${service.name} ($${service.price} MXN)\n` +
      `⏱️ *Duración estimada:* ${service.duration || 30} min\n\n` +
      `¿Qué horarios tienen disponibles para hoy o mañana? ¡Gracias!`;

    const cleanPhone = (negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className={`min-h-[100dvh] bg-[#0C0B0A] text-[#F5F5F0] ${inter.className} pb-[calc(3rem+env(safe-area-inset-bottom,0px))]`}>
      {/* ─── BARRA DE RESPETO Y TRADICIÓN ─── */}
      <div className="bg-[#181615] border-b border-[#C5A254]/30 py-2.5 px-4 text-center text-xs font-bold tracking-widest uppercase text-[#C5A254] flex items-center justify-center gap-2">
        <Scissors className="w-3.5 h-3.5 text-[#C5A254]" />
        <span>Navaja tradicional • Toalla caliente • Trato de caballero</span>
      </div>

      {/* ─── HERO EL PATRÓN ─── */}
      <header className="py-20 sm:py-28 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto text-center relative">
        <div className="w-20 h-20 mx-auto rounded-full border-2 border-[#C5A254] flex items-center justify-center mb-6 bg-black/60 shadow-[0_0_30px_rgba(197,162,84,0.3)]">
          <Scissors className="w-10 h-10 text-[#C5A254]" />
        </div>

        <h1 className={`${bebas.className} text-5xl sm:text-7xl md:text-8xl tracking-wider text-white uppercase mb-4 leading-none`}>
          {cfg.heroTitle || negocio?.name || "BARBERÍA EL PATRÓN"}
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed font-light">
          {cfg.heroSubtitle ||
            "Tradición, navaja clásica, toalla caliente y el trato que te mereces. Ven a arreglarte como se debe."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="#servicios"
            className={`${bebas.className} text-xl tracking-wider px-9 py-4 rounded-xl bg-[#C5A254] hover:bg-[#b59244] text-[#0C0B0A] shadow-[0_10px_25px_rgba(197,162,84,0.4)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2`}
          >
            <Calendar className="w-5 h-5" />
            <span>Ver Servicios y Precios</span>
          </a>
          <a
            href={`https://wa.me/${(negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent("Hola! ¿Tienen lugar disponible hoy?")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${bebas.className} text-xl tracking-wider px-9 py-4 rounded-xl bg-[#1A1817] hover:bg-[#252221] text-[#C5A254] border border-[#C5A254]/40 transition-all flex items-center gap-2`}
          >
            <Phone className="w-5 h-5 text-green-500" />
            <span>Mandar WhatsApp</span>
          </a>
        </div>
      </header>

      {/* ─── SERVICIOS Y PRECIOS ─── */}
      <section id="servicios" className="py-20 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto border-t border-[#C5A254]/20">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C5A254]">El Menú del Caballero</span>
          <h2 className={`${bebas.className} text-4xl sm:text-6xl text-white uppercase mt-1 tracking-wide`}>
            Servicios y Precios
          </h2>
          <div className="w-16 h-0.5 bg-[#C5A254] mx-auto mt-3" />
        </div>

        <div className="space-y-4">
          {services.map((s: any) => (
            <div
              key={s.id}
              className="bg-[#141211] border border-zinc-800/80 hover:border-[#C5A254]/60 p-6 rounded-2xl transition-all duration-300 flex flex-col sm:flex-row justify-between sm:items-center gap-4 group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className={`${bebas.className} text-2xl text-white tracking-wide group-hover:text-[#C5A254] transition-colors`}>
                    {s.name}
                  </h3>
                  <span className="text-xs text-zinc-500 font-medium">({s.duration || 30} min)</span>
                </div>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{s.description}</p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                <span className={`${bebas.className} text-3xl text-[#C5A254] font-bold`}>
                  ${s.price} <span className="text-xs font-sans text-zinc-500 font-normal">MXN</span>
                </span>
                <button
                  onClick={() => handleBookService(s)}
                  className={`${bebas.className} text-lg px-6 py-2.5 rounded-xl bg-[#C5A254] hover:bg-[#b59244] text-[#0C0B0A] shadow-md transition-all active:scale-95`}
                >
                  Apartar Turno
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Aviso Anti No-Show */}
        <div className="mt-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C5A254]" />
          <span>Te enviaremos un recordatorio por WhatsApp 24h antes para que confirmes tu asistencia con 1 toque.</span>
        </div>
      </section>

      {/* ─── PROGRAMA DE FIDELIZACIÓN (SELLOS) ─── */}
      {cfg.loyaltyEnabled !== false && businessId && (
        <section className="py-16 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto border-t border-[#C5A254]/20">
          <LoyaltyCard
            businessId={businessId}
            businessName={negocio?.name || "Barbería El Patrón"}
            accentColor="#C5A254"
            theme="dark"
            initialGoal={cfg.loyaltyGoal || 6}
            initialReward={cfg.loyaltyReward || "¡Corte gratis en tu 6ta visita!"}
          />
        </section>
      )}

      {/* ─── HORARIOS Y UBICACIÓN ─── */}
      <footer className="py-16 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto border-t border-[#C5A254]/20 text-zinc-400 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <h4 className={`${bebas.className} text-2xl text-white mb-3 uppercase tracking-wide`}>Horario de Atención</h4>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#C5A254] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Lunes a Sábado</p>
                <p>10:00 AM — 8:30 PM</p>
                <p className="font-bold text-white mt-2">Domingo</p>
                <p>10:00 AM — 4:00 PM</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className={`${bebas.className} text-2xl text-white mb-3 uppercase tracking-wide`}>Ubicación</h4>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#C5A254] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">{negocio?.address || "Av. Morelos 123, Colonia Centro"}</p>
                <p className="text-xs text-zinc-500 mt-1">Llegas fácil, cerca de transporte público.</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className={`${bebas.className} text-2xl text-white mb-3 uppercase tracking-wide`}>Contacto</h4>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">WhatsApp para citas</p>
                <p>{negocio?.phone || negocio?.whatsapp || "55 1234 5678"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-zinc-900 text-xs text-zinc-600">
          © {new Date().getFullYear()} {negocio?.name || "Barbería El Patrón"}. Excelencia y tradición en cada navaja.
        </div>
      </footer>
    </div>
  );
}
