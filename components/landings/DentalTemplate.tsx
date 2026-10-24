"use client";

import React, { useState } from "react";
import { ShieldCheck, Stethoscope, Clock, MapPin, Phone, Calendar, Award, CheckCircle2 } from "lucide-react";

interface DentalTemplateProps {
  negocio: any;
  businessId?: string;
  sections?: any[];
  isPreview?: boolean;
}

export default function DentalTemplate({ negocio }: DentalTemplateProps) {

  const cfg = negocio?.layoutConfig || {};
  const colors = cfg.colors || {};
  const primaryColor = colors.primary || "#0EA5E9"; // Cyan / Sky Blue médico
  const secondaryColor = colors.secondary || "#0284C7";
  const bgColor = colors.background || "#090E17";
  const textColor = colors.text || "#F8FAFC";

  const defaultServices = [
    { id: "d1", specialty: "general", name: "Valoración & Diagnóstico Odontológico Integral", price: 350, duration: 40, description: "Evaluación clínica completa con cámara intraoral, plan de tratamiento personalizado y presupuesto." },
    { id: "d2", specialty: "limpieza", name: "Limpieza Profunda con Ultrasonido y Profilaxis", price: 650, duration: 50, description: "Eliminación de sarro supra y subgingival, pulido dental y aplicación de flúor remineralizante." },
    { id: "d3", specialty: "estetica", name: "Resinas Estéticas Fotocurables de Alta Gama", price: 750, duration: 45, description: "Restauración anatómica en tono exacto del diente para eliminar caries o fracturas sin metal." },
    { id: "d4", specialty: "estetica", name: "Blanqueamiento Dental LED en Consultorio", price: 1850, duration: 60, description: "Aclaramiento de 3 a 5 tonos en una sola sesión. Incluye kit desensibilizante post-tratamiento." },
    { id: "d5", specialty: "cirugia", name: "Extracción Dental Simple / Quirúrgica", price: 900, duration: 45, description: "Procedimiento indoloro con anestesia computarizada o localizada y medicación postoperatoria." },
    { id: "d6", specialty: "ortodoncia", name: "Consulta y Diagnóstico de Ortodoncia (Brackets/Alineadores)", price: 400, duration: 45, description: "Estudio cefalométrico, análisis facial y propuesta de corrección de mordida y alineación." },
  ];

  const services = (cfg.services && cfg.services.length > 0) ? cfg.services : defaultServices;
  const phoneClean = (negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "");

  const handleBookWhatsApp = (service: any) => {
    const text = `¡Hola Dr.(a) ${negocio?.name || "Especialista"}! 🩺 Deseo agendar una cita para: *${service.name}* ($${service.price} MXN). ¿Qué días y horarios tienen disponibles para consulta?`;
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      className="min-h-[100dvh] font-sans selection:bg-sky-500/30 transition-colors duration-300 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        "--primary": primaryColor,
        "--secondary": secondaryColor,
      } as React.CSSProperties}
    >
      {/* ─── BANNER DE URGENCIAS Y CERTIFICACIÓN ─── */}
      <div className="bg-sky-950/80 border-b border-sky-500/20 py-2.5 px-4 text-center text-xs tracking-wide font-medium text-sky-200 flex items-center justify-center gap-3">
        <span className="flex items-center gap-1.5 font-bold text-sky-400">
          <Award className="w-4 h-4" /> Cédula Profesional & Especialidad Registrada
        </span>
        <span className="hidden sm:inline opacity-40">•</span>
        <span className="hidden sm:flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Lunes a Sábado con Cita Previa
        </span>
      </div>

      {/* ─── HERO CONSULTORIO ─── */}
      <header className="relative py-16 px-6 sm:px-12 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-6 shadow-xl shadow-sky-500/10">
          <Stethoscope className="w-10 h-10" />
        </div>

        <span className="text-xs font-bold tracking-[0.2em] uppercase text-sky-400 mb-2">
          {negocio?.niche || "Consultorio Dental & Especialidades Médicas"}
        </span>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white">
          {negocio?.name || "Clínica Dental Especializada"}
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
          {negocio?.description || "Atención odontológica integral, cálida y de vanguardia. Cuidamos la salud y estética de tu sonrisa con protocolos clínicos certificados y tecnología sin dolor."}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="#tratamientos"
            className="px-8 py-4 rounded-xl font-bold text-sm tracking-wide bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span>Consultar Tratamientos</span>
          </a>

          {phoneClean && (
            <a
              href={`https://wa.me/${phoneClean}?text=${encodeURIComponent("Hola, necesito informes para una cita de valoración.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl font-bold text-sm tracking-wide bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-500/30 transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Agendar por WhatsApp</span>
            </a>
          )}
        </div>
      </header>

      {/* ─── CATÁLOGO DE TRATAMIENTOS ─── */}
      <section id="tratamientos" className="py-12 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Tratamientos Odontológicos</span>
          <h2 className="text-3xl font-extrabold text-white mt-1">Cuidado Clínico de tu Sonrisa</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((s: any) => (
            <div
              key={s.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-lg group"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-bold text-lg text-white group-hover:text-sky-300 transition-colors">
                    {s.name}
                  </h3>
                  <span className="font-extrabold text-xl text-sky-400 shrink-0">
                    ${s.price} <span className="text-xs font-normal text-slate-400">MXN</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Duración aprox: {s.duration || 45} min</span>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed mb-6 font-light">
                  {s.description}
                </p>
              </div>

              <button
                onClick={() => handleBookWhatsApp(s)}
                className="w-full py-3.5 rounded-xl bg-sky-500/10 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/30 hover:border-sky-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Agendar Tratamiento</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── RECORDATORIO DE CITA & CONFIRMACIÓN MÉDICA ─── */}
      <section className="py-12 px-6 max-w-3xl mx-auto">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white text-base mb-1">
              Confirmación Activa de tu Consulta Médica
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Para optimizar la esterilización y el tiempo en consultorio, te enviaremos un mensaje de confirmación por WhatsApp 24 horas antes. Agradecemos confirmarlo con 1 clic para reservar de forma definitiva tu espacio clínico.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 px-6 border-t border-slate-800 text-center text-xs text-slate-500 max-w-5xl mx-auto flex flex-col items-center gap-3">
        {negocio?.address && (
          <p className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>{negocio.address}</span>
          </p>
        )}
        <p>© {new Date().getFullYear()} {negocio?.name || "Consultorio Médico / Dental"}. Todos los derechos reservados.</p>
        <p className="text-[11px] opacity-60">
          Powered by <span className="font-bold text-sky-300">SaaS Miniwebs</span> • México
        </p>
      </footer>
    </div>
  );
}
