"use client";

import React, { useState, useEffect } from "react";
import BookingModal from "../ui/BookingModal";
import OpenNowBadge from "../ui/OpenNowBadge";
import VideoSection from "../ui/VideoSection";

export default function ClinicaTemplate(props: { negocio?: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, businessId, media = [] } = props;
  const layoutConfig = negocio?.layoutConfig || {};
  
  const accent = negocio?.accentColor || negocio?.primaryColor || "#1B6CA8"; // Azul institucional
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState("");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const galleryImages = media.filter((m: any) => m.type === "image");
  
  // Demo Data Fallbacks
  const especialidadesConfig = layoutConfig.especialidades || [
    { id: "1", nombre: "Cardiología", icono: "❤️", descripcion: "Diagnóstico, prevención y tratamiento de enfermedades cardiovasculares." },
    { id: "2", nombre: "Dermatología", icono: "✨", descripcion: "Cuidado clínico y estético de la piel, cabello y uñas." },
    { id: "3", nombre: "Traumatología", icono: "🦴", descripcion: "Atención integral de lesiones del sistema musculoesquelético." },
    { id: "4", nombre: "Ginecología", icono: "🌸", descripcion: "Salud integral de la mujer y control prenatal." },
    { id: "5", nombre: "Oftalmología", icono: "👁️", descripcion: "Estudios visuales, control y cirugía oftalmológica." },
    { id: "6", nombre: "Neurología", icono: "🧠", descripcion: "Diagnóstico y tratamiento de trastornos del sistema nervioso." },
  ];

  const profesionalesConfig = layoutConfig.profesionalesConfig || [
    { nombre: "Dra. Valentina Méndez", especialidad: "Cardiología · Electrofisiología", matricula: "M.N. 98.432", diasDisponibles: ["Lun", "Mié", "Vie"], precioConsulta: "$25.000", avatar: "" },
    { nombre: "Dr. Carlos Rojas", especialidad: "Cardiología Clínica", matricula: "M.N. 76.123", diasDisponibles: ["Mar", "Jue"], precioConsulta: "$22.000", avatar: "" },
    { nombre: "Dr. Martín Olivera", especialidad: "Neurología Clínica", matricula: "M.N. 88.541", diasDisponibles: ["Lun", "Mar", "Vie"], precioConsulta: "$28.000", avatar: "" },
    { nombre: "Dra. Sofía Herrera", especialidad: "Traumatología Ortopédica", matricula: "M.N. 92.333", diasDisponibles: ["Mié", "Jue"], precioConsulta: "$20.000", avatar: "" }
  ];

  const pilares = layoutConfig.pilares || [
    { icono: "🔬", titulo: "Tecnología de Punta", descripcion: "Equipamiento de última generación para diagnósticos precisos." },
    { icono: "🤝", titulo: "Atención Cálida", descripcion: "Acompañamiento humano y empático en cada etapa del proceso." },
    { icono: "⭐", titulo: "Excelencia Médica", descripcion: "Cuerpo médico destacado con formación internacional." }
  ];

  const precios = layoutConfig.precios || [
    { servicio: "Consulta Inicial Especializada", precioParticular: "$25.000", precioCobertura: "100% Cubierto" },
    { servicio: "Control de Seguimiento", precioParticular: "$18.000", precioCobertura: "100% Cubierto" },
    { servicio: "Estudios Diagnósticos Simples", precioParticular: "Desde $35.000", precioCobertura: "Según Plan" },
    { servicio: "Prácticas Ambulatorias", precioParticular: "Consultar", precioCobertura: "Requiere Autorización" },
  ];

  const coberturas = layoutConfig.coberturas || ["OSDE", "Swiss Medical", "Galeno", "Medifé", "Omint", "Sancor Salud"];

  const stats = layoutConfig.stats || { anios: "25", especialidades: especialidadesConfig.length.toString(), pacientes: "+15.000" };

  const serviceNames = especialidadesConfig.map((s: any) => s.nombre || s.name);

  const heroImageUrl = negocio?.bannerUrl || layoutConfig.heroImage || "";
  const aboutImage = layoutConfig.aboutImage || (galleryImages[0] ? galleryImages[0].url : "");

  const handleOpenBooking = (service?: string) => {
    setPreselectedService(service || "");
    setBookingOpen(true);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        
        :root {
          --borde: #E5E7EB;
        }

        .font-baskerville { font-family: 'Libre Baskerville', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        .med-grid-bg {
          background-image: radial-gradient(circle, #E5E7EB 1px, transparent 1px);
          background-size: 24px 24px;
        }

        .med-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: var(--accent);
          margin: 2rem 0;
        }
        .med-divider::before, .med-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--accent);
          opacity: 0.2;
        }
        .med-divider::before { margin-right: .5em; }
        .med-divider::after { margin-left: .5em; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.5s ease-out forwards;
        }
      `}</style>

      <div className="min-h-screen bg-white text-[#0F1923] font-inter relative selection:bg-[var(--accent)] selection:text-white" style={{ "--accent": accent } as React.CSSProperties}>
        
        {/* ── NAV ── */}
        <nav className={`sticky top-0 z-40 bg-white px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-300 ${isScrolled ? 'shadow-sm border-b border-[var(--borde)]' : ''}`}>
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20"/>
            </svg>
            <span className="font-baskerville text-xl font-bold text-[#0F1923]">
              {negocio?.name ?? "Clínica Privada"}
            </span>
          </div>

          <ul className="hidden md:flex gap-8 list-none text-[14px] font-medium text-[#6B7280]">
            <li><a href="#clinica" className="hover:text-[var(--accent)] transition-colors">La Clínica</a></li>
            <li><a href="#especialidades" className="hover:text-[var(--accent)] transition-colors">Especialidades</a></li>
            <li><a href="#equipo" className="hover:text-[var(--accent)] transition-colors">Profesionales</a></li>
            <li><a href="#aranceles" className="hover:text-[var(--accent)] transition-colors">Precios</a></li>
          </ul>

          <button 
            onClick={() => handleOpenBooking()}
            className="bg-[var(--accent)] text-white text-[14px] font-semibold px-5 py-2.5 hover:brightness-110 transition-all shadow-sm"
          >
            Reservar turno →
          </button>
        </nav>

        {/* ── HERO ── */}
        <section className="min-h-[80vh] grid grid-cols-1 md:grid-cols-[3fr_2fr] items-center gap-0 bg-white">
          <div className="px-8 md:px-16 py-16 md:py-24 animate-fade-up">
            <p className="font-inter text-[11px] uppercase tracking-[0.25em] text-[var(--accent)] font-semibold mb-6">
              Centro Médico Privado
            </p>
            
            <h1 className="font-baskerville text-5xl md:text-[72px] leading-[1.1] mb-6 text-[#0F1923]">
              {negocio?.name || "Clínica Privada"}
            </h1>
            
            <p className="font-inter text-[17px] font-light text-[#6B7280] max-w-xl mb-8 leading-relaxed">
              {negocio?.tagline || "Brindamos atención médica de excelencia con un enfoque integral y humano, combinando trayectoria con innovación tecnológica."}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mb-10 font-inter text-[14px] text-[#6B7280] font-medium">
              <span>{stats.anios} años de trayectoria</span>
              <span className="hidden sm:block text-[var(--accent)] opacity-50">|</span>
              <span>{stats.especialidades} especialidades</span>
              <span className="hidden sm:block text-[var(--accent)] opacity-50">|</span>
              <span>{stats.pacientes} pacientes</span>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => handleOpenBooking()}
                className="bg-[var(--accent)] text-white text-[15px] font-semibold px-8 py-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Reservar mi turno
              </button>
              <a href="#clinica" className="text-[15px] font-medium text-[var(--accent)] hover:underline underline-offset-4 hidden sm:block">
                Conocer la clínica →
              </a>
            </div>
          </div>

          <div className="h-full min-h-[400px] w-full bg-[#F8FAFB] relative overflow-hidden">
            {heroImageUrl ? (
              <img src={heroImageUrl} alt="Clínica" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1">
                  <path d="M12 2v20M2 12h20"/>
                </svg>
              </div>
            )}
          </div>
        </section>

        {/* ── LA CLÍNICA (About) ── */}
        <section id="clinica" className="py-24 bg-[#F8FAFB] relative">
          <div className="absolute inset-0 med-grid-bg opacity-50" />
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
            <div className="h-[400px] lg:h-auto bg-white border border-[var(--borde)] rounded-sm p-2 shadow-sm">
              {aboutImage ? (
                <img src={aboutImage} alt="Interior de la clínica" className="w-full h-full object-cover rounded-sm" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 font-inter text-sm">Imagen Institucional</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col justify-center">
              <h2 className="font-baskerville text-4xl mb-6">Nuestra Institución</h2>
              <p className="font-inter text-[16px] text-[#6B7280] leading-relaxed mb-10">
                {layoutConfig.aboutText || "Nos dedicamos a cuidar tu salud con los más altos estándares de calidad. Nuestras instalaciones están diseñadas para brindar confort y seguridad, respaldadas por un equipo multidisciplinario comprometido con tu bienestar."}
              </p>
              
              <div className="space-y-6">
                {pilares.map((pilar: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-sm bg-[var(--accent)]/10 flex items-center justify-center text-xl shrink-0">
                      {pilar.icono}
                    </div>
                    <div>
                      <h3 className="font-inter font-semibold text-[16px] text-[#0F1923] mb-1">{pilar.titulo}</h3>
                      <p className="font-inter text-[14px] text-[#6B7280]">{pilar.descripcion}</p>
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
            <h2 className="font-baskerville text-4xl mb-4">Especialidades Médicas</h2>
            <div className="med-divider w-24 mx-auto text-[10px]">◆</div>
            <p className="font-inter text-[#6B7280] max-w-2xl mx-auto">
              Cobertura integral en diversas áreas de la medicina con profesionales referentes en cada disciplina.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {especialidadesConfig.map((esp: any, idx: number) => (
              <div 
                key={idx} 
                onClick={() => handleOpenBooking(esp.nombre)}
                className="group flex items-start gap-4 p-5 bg-white border border-[var(--borde)] rounded-lg hover:border-[var(--accent)]/30 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-[var(--accent)]/5 flex items-center justify-center text-[var(--accent)] text-xl flex-shrink-0 group-hover:bg-[var(--accent)]/10 transition-colors">
                  {esp.icono}
                </div>
                <div className="flex-1">
                  <h3 className="font-inter text-[15px] font-semibold text-[#0F1923] mb-1 group-hover:text-[var(--accent)] transition-colors">{esp.nombre}</h3>
                  <p className="font-inter text-[13px] text-[#6B7280] line-clamp-2">{esp.descripcion}</p>
                </div>
                <div className="text-[#6B7280] group-hover:text-[var(--accent)] group-hover:translate-x-1 transition-all self-center">
                  →
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROFESIONALES ── */}
        <section id="equipo" className="py-24 px-6 md:px-12 max-w-7xl mx-auto bg-[#F8FAFB] border-y border-[var(--borde)]">
          <div className="mb-16">
            <h2 className="font-baskerville text-4xl mb-4">Nuestro Equipo Médico</h2>
            <p className="font-inter text-[#6B7280] max-w-2xl">
              Conoce a nuestros especialistas, profesionales destacados por su calidez humana y trayectoria.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {profesionalesConfig.map((prof: any, idx: number) => (
              <div key={idx} className="bg-white p-6 border border-[var(--borde)] rounded-sm text-center hover:shadow-lg hover:border-[var(--accent)]/20 transition-all flex flex-col h-full">
                <div className="mx-auto w-24 h-24 rounded-full p-1 border border-[var(--accent)]/30 mb-4 bg-white">
                  {prof.avatar ? (
                    <img src={prof.avatar} alt={prof.nombre} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center rounded-full font-baskerville text-2xl font-bold">
                      {prof.nombre.split(' ').filter((w:string) => w.length > 3).map((w:string)=>w[0]).slice(0,2).join('')}
                    </div>
                  )}
                </div>
                
                <h3 className="font-inter text-[16px] font-semibold mb-1">{prof.nombre}</h3>
                <p className="font-inter text-[13px] text-[var(--accent)] mb-2">{prof.especialidad}</p>
                <p className="font-mono text-[11px] text-[#6B7280] mb-4">{prof.matricula}</p>
                
                <div className="flex flex-wrap justify-center gap-1.5 mb-6 mt-auto">
                  {prof.diasDisponibles.map((dia: string, i: number) => (
                    <span key={i} className="font-inter text-[11px] font-medium px-2 py-1 bg-[var(--accent)]/5 text-[var(--accent)] rounded-sm">
                      {dia}
                    </span>
                  ))}
                </div>
                
                <button 
                  onClick={() => handleOpenBooking()}
                  className="font-inter text-[13px] font-medium text-[var(--accent)] hover:underline underline-offset-4 pt-4 border-t border-[var(--borde)] w-full"
                >
                  Pedir turno →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRECIOS Y COBERTURA ── */}
        <section id="aranceles" className="py-24 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-baskerville text-4xl mb-4">Aranceles y Cobertura</h2>
            <div className="med-divider w-24 mx-auto text-[10px]">◆</div>
            <p className="font-inter text-[#6B7280]">
              Transparencia en nuestros valores y convenios vigentes.
            </p>
          </div>

          <div className="border border-[var(--borde)] rounded-sm overflow-hidden mb-12">
            <table className="w-full text-left font-inter text-[14px]">
              <thead className="bg-[#F8FAFB] border-b border-[var(--borde)]">
                <tr>
                  <th className="px-6 py-4 font-semibold text-[#0F1923]">Especialidad / Consulta</th>
                  <th className="px-6 py-4 font-semibold text-[#0F1923]">Particular</th>
                  <th className="px-6 py-4 font-semibold text-[#0F1923]">Con Cobertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--borde)]">
                {precios.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-[#F8FAFB]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#0F1923]">{p.servicio}</td>
                    <td className="px-6 py-4 text-[#6B7280] font-mono">{p.precioParticular}</td>
                    <td className="px-6 py-4 text-[#10B981] font-medium">{p.precioCobertura}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="font-inter text-[12px] text-[#6B7280] italic text-center mb-16">
            * Los valores expresados son referenciales y pueden sufrir modificaciones. Consulte telefónicamente.
          </p>

          <div className="text-center">
            <h3 className="font-inter text-[15px] font-semibold mb-6">Obras Sociales y Prepagas</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {coberturas.map((cob: string, i: number) => (
                <div key={i} className="px-4 py-2 border border-[var(--borde)] rounded-full text-[13px] font-medium text-[#6B7280] hover:border-[var(--accent)]/50 hover:text-[var(--accent)] transition-colors">
                  {cob}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VIDEO ── */}
        <VideoSection
          videoUrl={layoutConfig.videoUrl || (props.sections?.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
          accentColor={accent}
          theme="light"
        />

        {/* ── HORARIOS Y CONTACTO (Footer Oscuro) ── */}
        <section id="contacto" className="bg-[#0F1923] text-white py-20 px-6 md:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
            
            <div>
              <h3 className="font-baskerville text-2xl mb-8">Horarios de Atención</h3>
              <div className="space-y-3 font-mono text-[13px] text-white/80">
                {layoutConfig.hours ? (
                  Object.entries(layoutConfig.hours).map(([day, data]: [string, any]) => (
                    <div key={day} className="flex justify-between border-b border-white/10 pb-2">
                      <span className="capitalize font-inter">{day}</span>
                      <span>{data.open ? `${data.from} - ${data.to}` : 'Cerrado'}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between border-b border-white/10 pb-2"><span className="font-inter">Lunes a Viernes</span><span>08:00 - 20:00</span></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><span className="font-inter">Sábados</span><span>08:00 - 14:00</span></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><span className="font-inter">Domingos</span><span className="text-red-400">Guardia Pasiva</span></div>
                  </>
                )}
              </div>
              <div className="mt-6">
                 <OpenNowBadge hours={layoutConfig.hours} />
              </div>
            </div>

            <div>
              <h3 className="font-baskerville text-2xl mb-8">Contacto</h3>
              <div className="space-y-6 font-inter font-light text-[15px] text-white/80">
                {negocio?.phone && (
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1 font-semibold">Teléfono / Turnos</p>
                    <p className="font-mono text-lg text-white">{negocio.phone}</p>
                  </div>
                )}
                {negocio?.whatsapp && (
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1 font-semibold">WhatsApp</p>
                    <p className="font-mono text-lg text-[#10B981]">{negocio.whatsapp}</p>
                  </div>
                )}
                {negocio?.address && (
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1 font-semibold">Dirección</p>
                    <p className="text-white">{negocio.address}</p>
                  </div>
                )}
                {negocio?.email && (
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1 font-semibold">Email Institucional</p>
                    <p className="text-white">{negocio.email}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1 border border-white/10 bg-white/5 p-2 h-64 lg:h-full min-h-[250px] flex items-center justify-center text-white/30 font-inter text-sm">
              {layoutConfig.mapUrl ? (
                <iframe src={layoutConfig.mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" className="opacity-80 hover:opacity-100 transition-opacity" />
              ) : (
                "Mapa de ubicación"
              )}
            </div>

          </div>

          <div className="max-w-7xl mx-auto pt-10 mt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
            <p className="font-inter text-[12px] text-white/40">
              © {new Date().getFullYear()} {negocio?.name || "Clínica Privada"}. Todos los derechos reservados.
            </p>
            <div className="flex gap-4">
              <a href="#" className="font-inter text-[12px] text-white/40 hover:text-white transition-colors">Términos y Condiciones</a>
              <a href="#" className="font-inter text-[12px] text-white/40 hover:text-white transition-colors">Política de Privacidad</a>
            </div>
          </div>
        </section>

        {/* ── MOBILE FAB ── */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[var(--borde)] p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => handleOpenBooking()}
            className="w-full bg-[var(--accent)] text-white font-inter font-semibold text-[15px] py-3.5 rounded-sm hover:brightness-110 active:scale-95 transition-all"
          >
            Reservar turno
          </button>
        </div>

        {/* ── MODALS ── */}
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
    </>
  );
}