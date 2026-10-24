"use client";

import React, { useState } from "react";
import { Sparkles, Smile, ShieldCheck, Clock, MapPin, Calendar, CheckCircle2, ChevronRight, Award, Camera } from "lucide-react";

interface HolisticSpaTemplateProps {
  negocio: any;
  businessId?: string;
  sections?: any[];
  isPreview?: boolean;
}

export default function HolisticSpaTemplate({ negocio, businessId }: HolisticSpaTemplateProps) {
  const [activeBeforeAfter, setActiveBeforeAfter] = useState<number>(0);
  const [selectedTreatment, setSelectedTreatment] = useState<string>("carillas");

  const cfg = negocio?.layoutConfig || {};
  const colors = cfg.colors || {};
  const primaryColor = colors.primary || "#0D9488"; // Teal / Menta Spa Premium
  const secondaryColor = colors.secondary || "#D97706"; // Champagne Gold
  const bgColor = colors.background || "#042F2E"; // Deep Emerald Spa Dark
  const textColor = colors.text || "#F0FDFA";

  const defaultTreatments = [
    {
      id: "hs1",
      name: "Diseño de Sonrisa Digital 3D + Mockup en Vivo",
      price: 1800,
      tag: "Evaluación Estética",
      duration: 60,
      description: "Escaneo intraoral tridimensional sin pastas molestas, fotografía clínica y prueba física inmediata en boca para ver cómo lucirá tu sonrisa antes de tocar un diente.",
    },
    {
      id: "hs2",
      name: "Carillas Cerámicas E-Max de Mínima Invasión (Por Pieza)",
      price: 4500,
      tag: "Tratamiento Estrella",
      duration: 90,
      description: "Laminados de porcelana alemana ultrafinos (0.3mm) que corrigen forma, tamaño, textura y color con brillo natural idéntico al esmalte dental.",
    },
    {
      id: "hs3",
      name: "Blanqueamiento Láser Spa Philips Zoom WhiteSpeed",
      price: 2800,
      tag: "Resultados en 1 Sesión",
      duration: 50,
      description: "Aclara hasta 8 tonos en una sola sesión de 45 minutos con tecnología LED de luz fría y desensibilizante mineral post-tratamiento.",
    },
    {
      id: "hs4",
      name: "Armonización Facial & Perfilado Mandibular con Ácido Hialurónico",
      price: 5200,
      tag: "Médico Certificado",
      duration: 45,
      description: "Equilibrio armónico del tercio inferior del rostro, proyección de mentón y ángulo mandibular con producto premium reabsorbible con registro COFEPRIS.",
    },
    {
      id: "hs5",
      name: "Gingivoplastía Láser (Rediseño de Encías)",
      price: 2400,
      tag: "Cirugía Estética Láser",
      duration: 40,
      description: "Contorneo milimétrico de encía con láser de diodo. Cero dolor, cicatrización ultrarrápida en 24h y simetría dental perfecta.",
    },
    {
      id: "hs6",
      name: "Limpieza Profunda Spa con Ultrasonido & AirFlow Pulido",
      price: 950,
      tag: "Higiene Wellness",
      duration: 45,
      description: "Eliminación de sarro supra y subgingival con micro-spray de glicina y bicarbonato sabor menta. Cero raspado agresivo ni dolor.",
    },
  ];

  const beforeAfterCases = [
    {
      title: "Diseño con 8 Carillas E-Max",
      problem: "Dientes con desgaste, manchas por tetraciclina y diastemas.",
      solution: "Alineación visual y brillo natural tono BL2 sin desgastes agresivos.",
      patient: "Mariana S. (32 años)",
    },
    {
      title: "Blanqueamiento Láser + Bordes Incisales",
      problem: "Sonrisa amarillenta por café y bordes fracturados por bruxismo.",
      solution: "6 tonos más claros con protocolo Zoom + micro-resinas de estratificación.",
      patient: "Carlos R. (28 años)",
    },
    {
      title: "Armonización Facial + Gingivoplastía",
      problem: "Sonrisa gingival excesiva y mentón retraído.",
      solution: "Simetría de encías con láser diodo y relleno de mentón de 1.2ml.",
      patient: "Sofía M. (35 años)",
    },
  ];

  const treatments = (cfg.services && cfg.services.length > 0) ? cfg.services : defaultTreatments;
  const phoneClean = (negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "");

  const handleBook = (t: any) => {
    const msg = `Hola *${negocio?.name || "Dental Spa Boutique"}*! 🌿 Me interesa agendar una consulta de valoración para: *${t.name}* ($${t.price} MXN). ¿Tienen disponibilidad esta semana con el Dr. especialista?`;
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleVirtualValuation = () => {
    const msg = `¡Hola *${negocio?.name || "Dental Spa Boutique"}*! 📸 Me gustaría enviar fotos de mi sonrisa para una *Pre-Valoración Digital 3D* por WhatsApp sin costo. ¿Qué ángulos necesitan para evaluarme?`;
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div
      className="min-h-[100dvh] font-sans selection:bg-teal-500/30 transition-colors duration-300 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        "--primary": primaryColor,
        "--secondary": secondaryColor,
      } as React.CSSProperties}
    >
      {/* ─── BARRA CLINIC WELLNESS ─── */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 border-b border-teal-500/30 py-2.5 px-4 text-center text-xs tracking-wider uppercase font-bold text-teal-300 flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
        <span>Clínica Odontológica & Armonización • Escaneo Digital 3D • Especialistas Certificados</span>
      </div>

      {/* ─── HERO DENTAL SPA ─── */}
      <header className="relative py-16 px-6 sm:px-12 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 mb-6 shadow-2xl shadow-teal-500/30">
          <Smile className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-black tracking-widest uppercase mb-3">
          <Award className="w-3.5 h-3.5 text-teal-400" />
          <span>{negocio?.niche || "Dental Spa & Estética Facial Avanzada"}</span>
        </div>

        <h1 className="text-3xl sm:text-6xl font-black tracking-tight mb-4 text-white uppercase">
          {negocio?.name || "Lumina Dental Spa"}
        </h1>

        <p className="text-base sm:text-lg text-teal-100/80 max-w-xl mx-auto mb-6 font-light leading-relaxed">
          {negocio?.description || "Odontología de autor sin dolor en un ambiente spa relajante con aromaterapia y música envolvente. Diseñamos sonrisas naturales que potencian tu confianza."}
        </p>

        {/* Cédula y Acreditación COFEPRIS */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-teal-500/30 text-xs text-teal-200 mb-8">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Cédula Profesional Especialista: <strong>{negocio?.license || "DGP 8492019 / COFEPRIS 2433002"}</strong></span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <button
            onClick={handleVirtualValuation}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-teal-500/25 active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Valoración Digital por WhatsApp (Sin Costo)</span>
          </button>
        </div>
      </header>

      {/* ─── CASOS DE ÉXITO & ANTES / DESPUÉS ─── */}
      <section className="py-8 px-4 sm:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase">Transformaciones Reales de Sonrisa</h2>
          <p className="text-xs text-teal-200/70 mt-1">Resultados clínicos sin dolor documentados por nuestros odontólogos</p>
        </div>

        {/* Tabs de Casos */}
        <div className="flex justify-center gap-2 mb-6">
          {beforeAfterCases.map((c, idx) => (
            <button
              key={idx}
              onClick={() => setActiveBeforeAfter(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeBeforeAfter === idx
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "bg-slate-900/80 text-teal-200/70 hover:text-white"
              }`}
            >
              Caso {idx + 1}
            </button>
          ))}
        </div>

        {/* Case Card */}
        <div className="bg-slate-900/90 border border-teal-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-teal-900/60">
            <h3 className="font-bold text-white text-base">{beforeAfterCases[activeBeforeAfter].title}</h3>
            <span className="text-xs text-teal-400 font-medium">{beforeAfterCases[activeBeforeAfter].patient}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950/80 rounded-xl p-4 border border-rose-500/20">
              <span className="block text-[10px] font-black uppercase text-rose-400 tracking-wider mb-1">
                Estado Inicial del Paciente:
              </span>
              <p className="text-slate-300 leading-relaxed">{beforeAfterCases[activeBeforeAfter].problem}</p>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-teal-500/30">
              <span className="block text-[10px] font-black uppercase text-teal-400 tracking-wider mb-1">
                Protocolo de Diseño y Resultado:
              </span>
              <p className="text-slate-200 leading-relaxed">{beforeAfterCases[activeBeforeAfter].solution}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MENÚ DE TRATAMIENTOS SPA ─── */}
      <section className="py-8 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-wide">Tratamientos Odontológicos & Faciales</h2>
          <p className="text-xs text-teal-200/70 mt-1">Tecnología de mínima invasión y materiales biocompatibles certificados</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {treatments.map((t: any) => (
            <div
              key={t.id}
              className="bg-slate-900/70 border border-teal-500/20 hover:border-teal-500/50 rounded-2xl p-5 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-white text-base leading-snug">{t.name}</h3>
                  <span className="text-teal-400 font-black text-lg whitespace-nowrap">
                    ${t.price} <span className="text-xs font-normal text-teal-200/60">MXN</span>
                  </span>
                </div>

                {t.tag && (
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/30 mb-3">
                    {t.tag}
                  </span>
                )}

                <p className="text-xs text-teal-100/70 leading-relaxed mb-4">{t.description}</p>
              </div>

              <div className="pt-3 border-t border-teal-900/40 flex items-center justify-between">
                <span className="text-[11px] text-teal-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {t.duration || 60} min • Cero dolor
                </span>
                <button
                  onClick={() => handleBook(t)}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar Cita</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── UBICACIÓN Y AVISO LEGAL ─── */}
      <footer className="py-8 px-4 text-center border-t border-teal-900/50 max-w-3xl mx-auto text-xs text-teal-200/60 space-y-2">
        <p className="font-semibold text-teal-100">
          📍 {negocio?.address || "Zona Médica Especializada • Cabinas privadas con aislamiento acústico"}
        </p>
        <p className="text-[11px]">
          Horarios de atención: Lunes a Sábado de 9:00 AM a 7:30 PM. Protocolos de bioseguridad avalados por la Secretaría de Salud y COFEPRIS.
        </p>
      </footer>
    </div>
  );
}
