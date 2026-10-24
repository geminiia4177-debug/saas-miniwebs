"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Libre_Baskerville, Inter, JetBrains_Mono } from "next/font/google";
import BookingModal from "../ui/BookingModal";
import OpenNowBadge from "../ui/OpenNowBadge";
import VideoSection from "../ui/VideoSection";

const fontBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700"],
  variable: "--font-clinica-heading",
  display: "swap",
});

const fontInter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-clinica-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-clinica-mono",
  display: "swap",
});

// ─── STRICT TYPES ───
export interface Especialidad {
  id?: string;
  nombre: string;
  icono?: string;
  descripcion?: string;
}

export interface Profesional {
  nombre: string;
  especialidad: string;
  matricula: string;
  diasDisponibles: string[];
  precioConsulta?: string;
  avatar?: string;
}

export interface Pilar {
  icono: string;
  titulo: string;
  descripcion: string;
}

export interface PrecioItem {
  servicio: string;
  precioParticular: string;
  precioCobertura: string;
}

export default function ClinicaTemplate(props: { negocio?: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, businessId, media = [] } = props;
  const layoutConfig = negocio?.layoutConfig || {};
  
  const accent = negocio?.accentColor || negocio?.primaryColor || "#1B6CA8"; // Teal clínico
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState("");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const galleryImages = Array.isArray(media) ? media.filter((m: any) => m.type === "image") : [];
  
  // Demo Data Fallbacks
  const especialidadesConfig: Especialidad[] = useMemo(() => {
    return layoutConfig.especialidades || [
      { id: "1", nombre: "Cardiología", icono: "❤️", descripcion: "Diagnóstico cardiovascular de alta complejidad, ecocardiograma y prevención." },
      { id: "2", nombre: "Dermatología", icono: "✨", descripcion: "Cuidado clínico dermatológico, biopsias y control de lesiones pigmentadas." },
      { id: "3", nombre: "Traumatología", icono: "🦴", descripcion: "Atención integral de lesiones musculoesqueléticas y rehabilitación deportiva." },
      { id: "4", nombre: "Ginecología & Obstetricia", icono: "🌸", descripcion: "Salud integral de la mujer, control prenatal y chequeos ginecológicos." },
      { id: "5", nombre: "Oftalmología", icono: "👁️", descripcion: "Estudios visuales computarizados, control de retina y campo visual." },
      { id: "6", nombre: "Neurología Clínica", icono: "🧠", descripcion: "Diagnóstico y tratamiento integral de trastornos cognitivos y sistema nervioso." },
    ];
  }, [layoutConfig.especialidades]);

  const profesionalesConfig: Profesional[] = useMemo(() => {
    return layoutConfig.profesionalesConfig || [
      { nombre: "Dra. Valentina Méndez", especialidad: "Cardiología & Arritmias", matricula: "M.N. 98.432", diasDisponibles: ["Lun", "Mié", "Vie"], precioConsulta: "$25.000", avatar: "" },
      { nombre: "Dr. Carlos Rojas", especialidad: "Cardiología Clínica", matricula: "M.N. 76.123", diasDisponibles: ["Mar", "Jue"], precioConsulta: "$22.000", avatar: "" },
      { nombre: "Dr. Martín Olivera", especialidad: "Neurología Clínica", matricula: "M.N. 88.541", diasDisponibles: ["Lun", "Mar", "Vie"], precioConsulta: "$28.000", avatar: "" },
      { nombre: "Dra. Sofía Herrera", especialidad: "Traumatología Ortopédica", matricula: "M.N. 92.333", diasDisponibles: ["Mié", "Jue"], precioConsulta: "$20.000", avatar: "" },
    ];
  }, [layoutConfig.profesionalesConfig]);

  const pilares: Pilar[] = layoutConfig.pilares || [
    { icono: "🔬", titulo: "Tecnología Diagnóstica", descripcion: "Equipamiento de última generación digital para diagnósticos de certeza." },
    { icono: "🤝", titulo: "Atención Humanizada", descripcion: "Acompañamiento médico cercano, empático y dedicado a cada paciente." },
    { icono: "⭐", titulo: "Excelencia y Comité Médico", descripcion: "Cuerpo médico acreditado con formación continua e internacional." },
  ];

  const precios: PrecioItem[] = layoutConfig.precios || [
    { servicio: "Consulta Inicial Especializada", precioParticular: "$25.000", precioCobertura: "100% Cubierto" },
    { servicio: "Control de Seguimiento Clínico", precioParticular: "$18.000", precioCobertura: "100% Cubierto" },
    { servicio: "Estudios Diagnósticos Simples", precioParticular: "Desde $35.000", precioCobertura: "Según Plan / Copago" },
    { servicio: "Prácticas Ambulatorias", precioParticular: "Consultar", precioCobertura: "Requiere Autorización" },
  ];

  const coberturas: string[] = layoutConfig.coberturas || ["OSDE", "Swiss Medical", "Galeno", "Medifé", "Omint", "Sancor Salud", "Prevención Salud"];
  const stats = layoutConfig.stats || { anios: "25", especialidades: especialidadesConfig.length.toString(), pacientes: "+15.000" };
  const serviceNames = especialidadesConfig.map((s) => s.nombre);

  const heroImageUrl = negocio?.bannerUrl || layoutConfig.heroImage || "";
  const aboutImage = layoutConfig.aboutImage || (galleryImages[0] ? galleryImages[0].url : "");

  const handleOpenBooking = (service?: string) => {
    setPreselectedService(service || "");
    setBookingOpen(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div 
      className={`${fontBaskerville.variable} ${fontInter.variable} ${fontMono.variable} min-h-screen bg-[#FDFCFB] text-[#0F1923] font-['Inter'] relative selection:bg-[var(--accent)] selection:text-white pb-28 md:pb-0`} 
      style={{ "--accent": accent, "--borde": "#E8EAEF" } as React.CSSProperties}
    >
      {/* ── HEADER / NAV ── */}
      <nav 
        aria-label="Navegación principal"
        className={`sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-xl px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-300 border-b ${
          isScrolled ? 'border-[var(--borde)] shadow-[0_2px_12px_rgba(0,0,0,0.04)]' : 'border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20"/>
            </svg>
          </div>
          <span className="font-['Libre_Baskerville'] text-xl font-bold text-[#0F2A3C] tracking-tight">
            {negocio?.name ?? "Clínica Privada"}
          </span>
        </div>

        <ul className="hidden md:flex gap-8 list-none text-[13px] font-medium text-[#475569] uppercase tracking-wider">
          <li>
            <button type="button" onClick={() => scrollToSection("clinica")} className="hover:text-[var(--accent)] transition-colors">
              La Institución
            </button>
          </li>
          <li>
            <button type="button" onClick={() => scrollToSection("especialidades")} className="hover:text-[var(--accent)] transition-colors">
              Especialidades
            </button>
          </li>
          <li>
            <button type="button" onClick={() => scrollToSection("equipo")} className="hover:text-[var(--accent)] transition-colors">
              Cuerpo Médico
            </button>
          </li>
          <li>
            <button type="button" onClick={() => scrollToSection("aranceles")} className="hover:text-[var(--accent)] transition-colors">
              Coberturas
            </button>
          </li>
        </ul>

        <button 
          type="button"
          onClick={() => handleOpenBooking()}
          className="bg-[var(--accent)] text-white text-[13px] font-semibold uppercase tracking-wider px-6 py-2.5 rounded-full hover:brightness-110 active:scale-95 transition-all shadow-sm"
        >
          Reservar Turno →
        </button>
      </nav>

      <main>
        {/* ── HERO ── */}
        <section className="min-h-[85dvh] grid grid-cols-1 md:grid-cols-[3fr_2fr] items-center gap-0 bg-[#FDFCFB]">
          <div className="px-8 md:px-16 py-16 md:py-24">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-[11px] uppercase tracking-[0.2em] font-semibold mb-6">
              <span>✦ Centro Médico de Excelencia</span>
            </div>
            
            <h1 className="font-['Libre_Baskerville'] text-4xl sm:text-5xl md:text-[64px] leading-[1.08] mb-6 text-[#0F2A3C] tracking-tight">
              {negocio?.name || "Clínica Privada"}
            </h1>
            
            <p className="font-['Inter'] text-[16px] sm:text-[17px] font-normal text-[#475569] max-w-xl mb-8 leading-relaxed">
              {negocio?.tagline || "Brindamos atención médica de máxima jerarquía con un enfoque ético, humano y multidisciplinario, respaldado por tecnología diagnóstica de avanzada."}
            </p>

            <div className="flex flex-wrap gap-4 sm:gap-6 items-center mb-10 font-['Inter'] text-[13px] text-[#475569] font-medium pt-2 border-t border-[var(--borde)]">
              <span className="font-semibold text-[#0F2A3C]">{stats.anios} años</span> de trayectoria
              <span className="hidden sm:inline text-[var(--accent)] opacity-40">|</span>
              <span className="font-semibold text-[#0F2A3C]">{stats.especialidades} especialidades</span>
              <span className="hidden sm:inline text-[var(--accent)] opacity-40">|</span>
              <span className="font-semibold text-[#0F2A3C]">{stats.pacientes} pacientes</span> atendidos
            </div>

            <div className="flex items-center gap-6">
              <button 
                type="button"
                onClick={() => handleOpenBooking()}
                className="bg-[var(--accent)] text-white text-[14px] font-semibold px-8 py-3.5 rounded-xl hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_4px_16px_rgba(27,108,168,0.25)]"
              >
                Solicitar Turno
              </button>
              <button 
                type="button"
                onClick={() => scrollToSection("clinica")} 
                className="text-[14px] font-medium text-[var(--accent)] hover:underline underline-offset-4 hidden sm:block"
              >
                Conocer la institución →
              </button>
            </div>
          </div>

          <div className="h-full min-h-[420px] w-full bg-[#E8F1F5] relative overflow-hidden flex items-center justify-center">
            {heroImageUrl ? (
              <img src={heroImageUrl} alt="Instalaciones de la clínica" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-8">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-white shadow-xl flex items-center justify-center text-4xl mb-4 text-[var(--accent)]">
                  🏥
                </div>
                <p className="font-['Libre_Baskerville'] text-xl font-bold text-[#0F2A3C]">Excelencia en Salud</p>
                <p className="text-xs text-[#475569] mt-1 font-['Inter']">Atención personalizada y guardias</p>
              </div>
            )}
          </div>
        </section>

        {/* ── LA CLÍNICA (About) ── */}
        <section id="clinica" className="py-24 bg-[#F8FAFB] relative border-y border-[var(--borde)]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="h-[380px] lg:h-[440px] bg-white border border-[var(--borde)] rounded-2xl p-2 shadow-sm overflow-hidden">
              {aboutImage ? (
                <img src={aboutImage} alt="Interior y consultorios" className="w-full h-full object-cover rounded-xl" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-[#E8F1F5] rounded-xl flex items-center justify-center">
                  <span className="text-[#475569] font-['Inter'] text-sm font-medium">Instalaciones Médicas</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col justify-center">
              <p className="text-[11px] font-['Inter'] uppercase tracking-[0.25em] text-[var(--accent)] font-semibold mb-3">
                Institución Médica
              </p>
              <h2 className="font-['Libre_Baskerville'] text-3xl sm:text-4xl text-[#0F2A3C] mb-6">
                Cuidado Médico Integral con Estándares Internacionales
              </h2>
              <p className="font-['Inter'] text-[15px] sm:text-[16px] text-[#475569] leading-relaxed mb-8">
                {layoutConfig.aboutText || "Nuestra misión es cuidar su salud y la de su familia a través de un servicio médico coordinado, ágil y de excelencia. Con tecnología de vanguardia y especialistas reconocidos, ofrecemos un espacio donde la precisión científica convive con la empatía."}
              </p>
              
              <div className="space-y-5">
                {pilares.map((pilar, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[var(--borde)] flex items-center justify-center text-xl shrink-0 shadow-sm">
                      {pilar.icono}
                    </div>
                    <div>
                      <h3 className="font-['Inter'] font-semibold text-[15px] text-[#0F1923] mb-0.5">{pilar.titulo}</h3>
                      <p className="font-['Inter'] text-[13px] text-[#475569] leading-relaxed">{pilar.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── ESPECIALIDADES ── */}
        <section id="especialidades" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-['Inter'] uppercase tracking-[0.25em] text-[var(--accent)] font-semibold mb-2">
              Servicios Clínicos
            </p>
            <h2 className="font-['Libre_Baskerville'] text-3xl sm:text-4xl text-[#0F2A3C] mb-4">
              Especialidades Médicas
            </h2>
            <div className="w-20 h-px bg-[var(--accent)]/40 mx-auto my-5" />
            <p className="font-['Inter'] text-[#475569] max-w-2xl mx-auto text-sm sm:text-base">
              Cobertura en áreas clave de la salud con especialistas altamente calificados y equipamiento de última generación.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {especialidadesConfig.map((esp) => (
              <div 
                key={esp.id || esp.nombre} 
                onClick={() => handleOpenBooking(esp.nombre)}
                className="group flex items-start gap-4 p-6 bg-white border border-[var(--borde)] rounded-2xl hover:border-[var(--accent)]/40 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/5 flex items-center justify-center text-[var(--accent)] text-2xl flex-shrink-0 group-hover:bg-[var(--accent)]/15 transition-colors">
                  {esp.icono || "🩺"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-['Inter'] text-[16px] font-semibold text-[#0F1923] mb-1.5 group-hover:text-[var(--accent)] transition-colors">
                    {esp.nombre}
                  </h3>
                  <p className="font-['Inter'] text-[13px] text-[#475569] line-clamp-2 leading-relaxed">
                    {esp.descripcion}
                  </p>
                </div>
                <div className="text-[#94A3B8] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all self-center text-lg">
                  →
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROFESIONALES ── */}
        <section id="equipo" className="py-24 px-6 md:px-12 max-w-7xl mx-auto bg-[#F8FAFB] border-y border-[var(--borde)]">
          <div className="mb-14 text-center sm:text-left">
            <p className="text-[11px] font-['Inter'] uppercase tracking-[0.25em] text-[var(--accent)] font-semibold mb-2">
              Staff Médico
            </p>
            <h2 className="font-['Libre_Baskerville'] text-3xl sm:text-4xl text-[#0F2A3C] mb-3">
              Nuestro Cuerpo Médico
            </h2>
            <p className="font-['Inter'] text-[#475569] max-w-2xl text-sm sm:text-base">
              Profesionales dedicados a brindar una atención personalizada, rigurosa y comprometida con su bienestar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {profesionalesConfig.map((prof) => (
              <div 
                key={prof.matricula || prof.nombre} 
                className="bg-white p-6 border border-[var(--borde)] rounded-2xl text-center hover:shadow-xl hover:border-[var(--accent)]/30 transition-all flex flex-col h-full"
              >
                <div className="mx-auto w-24 h-24 rounded-full p-1 border-2 border-[var(--accent)]/20 mb-4 bg-white relative">
                  {prof.avatar ? (
                    <img src={prof.avatar} alt={prof.nombre} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center rounded-full font-['Libre_Baskerville'] text-2xl font-bold">
                      {prof.nombre.split(' ').filter((w) => w.length > 3).map((w) => w[0]).slice(0, 2).join('')}
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Activo" />
                </div>
                
                <h3 className="font-['Inter'] text-[15px] font-bold text-[#0F1923] mb-1">{prof.nombre}</h3>
                <p className="font-['Inter'] text-[12px] font-medium text-[var(--accent)] mb-2">{prof.especialidad}</p>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#64748B] mb-4 bg-slate-50 py-0.5 px-2 rounded-md inline-block mx-auto border border-slate-100">
                  {prof.matricula}
                </p>
                
                <div className="flex flex-wrap justify-center gap-1.5 mb-6 mt-auto">
                  {prof.diasDisponibles.map((dia, i) => (
                    <span key={i} className="font-['Inter'] text-[10px] font-semibold px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full">
                      {dia}
                    </span>
                  ))}
                </div>
                
                <button 
                  type="button"
                  onClick={() => handleOpenBooking(prof.especialidad)}
                  className="font-['Inter'] text-[13px] font-semibold text-[var(--accent)] hover:underline underline-offset-4 pt-4 border-t border-[var(--borde)] w-full"
                >
                  Pedir Turno →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── ARANCELES Y COBERTURAS ── */}
        <section id="aranceles" className="py-24 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-['Inter'] uppercase tracking-[0.25em] text-[var(--accent)] font-semibold mb-2">
              Claridad Médica
            </p>
            <h2 className="font-['Libre_Baskerville'] text-3xl sm:text-4xl text-[#0F2A3C] mb-3">
              Aranceles y Convenios
            </h2>
            <div className="w-20 h-px bg-[var(--accent)]/40 mx-auto my-5" />
            <p className="font-['Inter'] text-[#475569] text-sm sm:text-base">
              Transparencia en aranceles de consultas particulares y cobertura con las principales prestadoras del país.
            </p>
          </div>

          <div className="border border-[var(--borde)] rounded-2xl overflow-hidden mb-12 shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-['Inter'] text-[14px]">
                <caption className="sr-only">Tabla de aranceles y cobertura médica</caption>
                <thead className="bg-[#F8FAFB] border-b border-[var(--borde)]">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold text-[#0F1923]">Especialidad / Consulta</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-[#0F1923]">Particular</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-[#0F1923]">Con Cobertura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--borde)]">
                  {precios.map((p, i) => (
                    <tr key={i} className="hover:bg-[#F8FAFB]/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#0F1923]">{p.servicio}</td>
                      <td className="px-6 py-4 text-[#475569] font-['JetBrains_Mono']">{p.precioParticular}</td>
                      <td className="px-6 py-4 text-emerald-600 font-semibold">{p.precioCobertura}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <p className="font-['Inter'] text-[12px] text-[#64748B] italic text-center mb-14">
            * Los valores expresados son referenciales y pueden ajustarse según prácticas asociadas.
          </p>

          <div className="text-center">
            <h3 className="font-['Inter'] text-[15px] font-semibold text-[#0F1923] mb-6 uppercase tracking-wider">
              Obras Sociales y Prepagas con Convenio Directo
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {coberturas.map((cob, i) => (
                <div 
                  key={i} 
                  className="px-5 py-2.5 bg-white border border-[var(--borde)] rounded-xl text-[13px] font-medium text-[#475569] shadow-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  {cob}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VIDEO SECTION ── */}
        <VideoSection
          videoUrl={layoutConfig.videoUrl || (props.sections?.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
          accentColor={accent}
          theme="light"
        />
      </main>

      {/* ── FOOTER / CONTACTO ── */}
      <footer id="contacto" className="bg-[#0F1923] text-white pt-24 pb-28 md:pb-16 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 mb-16">
          <div>
            <h3 className="font-['Libre_Baskerville'] text-2xl mb-6 text-white font-bold">
              Horarios de Atención
            </h3>
            <div className="space-y-3 font-['JetBrains_Mono'] text-[13px] text-white/80 mb-6">
              {layoutConfig.hours ? (
                Object.entries(layoutConfig.hours).map(([day, data]: [string, any]) => {
                  if (!data?.open) return null;
                  return (
                    <div key={day} className="flex justify-between border-b border-white/10 pb-2">
                      <span className="capitalize font-['Inter'] text-slate-300">{day}</span>
                      <span className="text-white font-medium">{data.from} - {data.to}</span>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="font-['Inter'] text-slate-300">Lunes a Viernes</span><span>08:00 - 20:00</span></div>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="font-['Inter'] text-slate-300">Sábados</span><span>08:00 - 14:00</span></div>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="font-['Inter'] text-slate-300">Domingos</span><span className="text-amber-400">Guardia 24h</span></div>
                </>
              )}
            </div>
            <div>
              <OpenNowBadge hours={layoutConfig.hours} />
            </div>
          </div>

          <div>
            <h3 className="font-['Libre_Baskerville'] text-2xl mb-6 text-white font-bold">
              Contacto y Turnos
            </h3>
            <div className="space-y-4 font-['Inter'] font-light text-[14px] text-white/80">
              {negocio?.phone && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Central Telefónica</p>
                  <p className="font-['JetBrains_Mono'] text-lg text-white font-medium">{negocio.phone}</p>
                </div>
              )}
              {negocio?.whatsapp && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Turnos Rápidos WhatsApp</p>
                  <a 
                    href={`https://wa.me/${negocio.whatsapp.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-['JetBrains_Mono'] text-lg text-emerald-400 font-medium hover:underline block"
                  >
                    {negocio.whatsapp}
                  </a>
                </div>
              )}
              {negocio?.address && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Dirección</p>
                  <p className="text-white">{negocio.address}</p>
                </div>
              )}
              {negocio?.email && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Email</p>
                  <p className="text-white">{negocio.email}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 rounded-2xl overflow-hidden border border-white/10 bg-white/5 h-64 lg:h-full min-h-[250px] shadow-lg">
            {layoutConfig.mapUrl ? (
              <iframe 
                src={layoutConfig.mapUrl} 
                title="Ubicación de la clínica"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="opacity-80 hover:opacity-100 transition-opacity" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-['Inter']">
                📍 Mapa de Ubicación
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="font-['Inter'] text-[12px] text-white/50">
            © {new Date().getFullYear()} {negocio?.name || "Clínica Privada"}. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-[12px] text-white/50">
            <span>Atención Médica Calificada</span>
            <span>Seguridad del Paciente</span>
          </div>
        </div>
      </footer>

      {/* ── MOBILE FIXED BAR ── */}
      <div 
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[var(--borde)] p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button 
          type="button"
          onClick={() => handleOpenBooking()}
          className="w-full bg-[var(--accent)] text-white font-['Inter'] font-semibold text-[15px] py-3.5 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md"
        >
          Solicitar Turno Médico
        </button>
      </div>

      {/* ── BOOKING MODAL ── */}
      <BookingModal 
        isOpen={bookingOpen} 
        onClose={() => setBookingOpen(false)} 
        businessId={businessId || negocio?.id || "demo"} 
        services={serviceNames}
        theme="light"
        title="Reservar Turno Médico"
        preselectedService={preselectedService}
        variant="clinica"
        primaryColor={accent}
      />
    </div>
  );
}