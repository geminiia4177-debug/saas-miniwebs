"use client";

import React, { useState, useEffect, useRef, useMemo, useId } from "react";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";
import BookingForm from "@/app/[subdomain]/BookingForm";
import VideoSection from "@/components/ui/VideoSection";
import OpenNowBadge from "@/components/ui/OpenNowBadge";
import { formatSocialUrl } from "@/components/landings/biolinks/utils";

const fontSpace = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cancha-heading",
  display: "swap",
});

const fontDMSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-cancha-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cancha-mono",
  display: "swap",
});

// ─── SVG ICONS ───
function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// ─── Types ───
export interface Court {
  id: number | string;
  name: string;
  sport: string;
  icon: string;
  description: string;
  surface: string;
  capacity: string;
  covered: boolean;
  durations: { label: string; minutes: number; price: number }[];
  slots: { [duration: number]: string[] };
}

export interface BookingInfo {
  court: Court;
  duration: { label: string; minutes: number; price: number };
  slot: string;
}

// ─── Mock data ───
const DEMO_COURTS: Court[] = [
  {
    id: 1,
    name: "Cancha Central",
    sport: "Fútbol 5",
    icon: "⚽",
    description: "Césped sintético monofilamento 50mm, techada con iluminación LED stadium de alta potencia.",
    surface: "Sintético Premium",
    capacity: "5 vs 5",
    covered: true,
    durations: [
      { label: "1 hora", minutes: 60, price: 15000 },
      { label: "1.5 h", minutes: 90, price: 21000 },
    ],
    slots: {
      60: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "18:00", "19:00", "20:00", "21:00"],
      90: ["09:00", "10:30", "14:00", "16:00", "18:30", "20:00"],
    },
  },
  {
    id: 2,
    name: "Pádel Crystal",
    sport: "Pádel Panorámico",
    icon: "🎾",
    description: "Vidrio templado panorámico 12mm, césped texturado azul World Padel Tour, iluminación sin sombras.",
    surface: "Sintético WPT",
    capacity: "2 vs 2",
    covered: false,
    durations: [
      { label: "1 hora", minutes: 60, price: 12000 },
      { label: "1.5 h", minutes: 90, price: 17000 },
    ],
    slots: {
      60: ["08:00", "09:00", "10:00", "13:00", "15:00", "17:00", "19:00", "20:00"],
      90: ["08:00", "10:30", "13:00", "15:00", "18:00"],
    },
  },
  {
    id: 3,
    name: "Estadio Techado",
    sport: "Básquet / Vóley",
    icon: "🏀",
    description: "Parqué flotante certificado FIBA, aros hidráulicos rebatibles y tableros de cristal acrílico.",
    surface: "Parqué Flotante",
    capacity: "5 vs 5",
    covered: true,
    durations: [
      { label: "1 hora", minutes: 60, price: 13000 },
      { label: "2 horas", minutes: 120, price: 22000 },
    ],
    slots: {
      60: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
      120: ["08:00", "10:00", "14:00", "18:00"],
    },
  },
  {
    id: 4,
    name: "Cancha Ladrillo",
    sport: "Tenis",
    icon: "🎾",
    description: "Polvo de ladrillo compactado con riego automático, red profesional y cerco perimetral iluminado.",
    surface: "Polvo de ladrillo",
    capacity: "Singles / Dobles",
    covered: false,
    durations: [
      { label: "1 hora", minutes: 60, price: 10000 },
      { label: "1.5 h", minutes: 90, price: 14000 },
    ],
    slots: {
      60: ["07:00", "08:00", "09:00", "10:00", "16:00", "17:00", "18:00", "19:00"],
      90: ["07:00", "09:00", "16:00", "18:00"],
    },
  },
];

// ─── Helpers ───
const fmt = (n: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
};

// ─── Court Card ───
function CourtCard({ 
  court, 
  accent, 
  isExpanded, 
  onToggle, 
  onBook 
}: { 
  court: Court; 
  accent: string; 
  isExpanded: boolean; 
  onToggle: () => void; 
  onBook: (info: BookingInfo) => void;
}) {
  const [selectedDuration, setSelectedDuration] = useState(court.durations[0]?.minutes || 60);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const activeDur = court.durations.find((d) => d.minutes === selectedDuration) || court.durations[0];
  const availableSlots = court.slots[selectedDuration] ?? [];
  const cardId = useId();

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-300 border ${
        isExpanded ? 'bg-[#141716] border-[var(--accent)]/40 shadow-[0_4px_30px_rgba(0,255,136,0.08)]' : 'bg-[#101211] border-white/10 hover:border-white/20'
      }`}
    >
      <button 
        type="button"
        id={`header-${cardId}`}
        aria-expanded={isExpanded}
        aria-controls={`panel-${cardId}`}
        className="w-full text-left p-5 flex items-center gap-4 group" 
        onClick={onToggle}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-all border ${
          isExpanded ? 'border-[var(--accent)]/40 bg-[var(--accent)]/20' : 'bg-white/5 border-transparent group-hover:bg-white/10'
        }`}>
          {court.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-black text-white uppercase tracking-wider leading-none font-['Space_Grotesk']">
              {court.name}
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-[var(--accent)] bg-[var(--accent)]/10 font-['DM_Sans']">
              {court.sport}
            </span>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {[court.surface, court.capacity, court.covered ? "🏠 Techada" : "🌤 Al aire libre"].map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-white/5 text-zinc-400 font-['DM_Sans']">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-black text-[var(--accent)] font-['JetBrains_Mono']">
            {fmt(court.durations[0]?.price || 0)}
          </div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">desde</div>
        </div>
        <svg 
          className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180 text-[var(--accent)]" : ""}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div 
          id={`panel-${cardId}`}
          role="region"
          aria-labelledby={`header-${cardId}`}
          className="px-4 pb-4 animate-in fade-in duration-200"
        >
          <div className="rounded-xl p-5 space-y-5 bg-[#090B0A] border border-white/5">
            <p className="text-zinc-400 text-sm leading-relaxed font-['DM_Sans']">{court.description}</p>
            
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-3 font-['DM_Sans']">Duración de Turno</p>
              <div className="flex gap-2 flex-wrap">
                {court.durations.map((d) => {
                  const active = d.minutes === selectedDuration;
                  return (
                    <button
                      key={d.minutes}
                      type="button"
                      onClick={() => { setSelectedDuration(d.minutes); setSelectedSlot(null); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        active 
                          ? 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]' 
                          : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span>⏱</span>
                      {d.label}
                      <span className="font-['JetBrains_Mono'] ml-1 font-black">{fmt(d.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-3 font-['DM_Sans']">
                Horarios Disponibles · {availableSlots.length} turnos
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {availableSlots.map((s) => {
                  const sel = s === selectedSlot;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSlot(s)}
                      className={`rounded-xl py-2.5 text-xs font-bold transition-all border font-['JetBrains_Mono'] ${
                        sel 
                          ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-black shadow-[0_0_15px_rgba(0,255,136,0.3)]' 
                          : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => selectedSlot && onBook({ court, duration: activeDur, slot: selectedSlot })}
              className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 border font-['DM_Sans'] ${
                selectedSlot 
                  ? 'bg-[var(--accent)] text-black shadow-[0_4px_25px_rgba(0,255,136,0.3)] border-transparent hover:brightness-110 active:scale-98' 
                  : 'bg-white/5 text-zinc-600 border-white/5 cursor-not-allowed'
              }`}
            >
              {selectedSlot ? `Reservar ${selectedSlot} hs · ${activeDur.label} · ${fmt(activeDur.price)}` : "Seleccioná un horario para reservar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Template ───
export default function CanchaTemplate(props: { negocio?: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, businessId } = props;
  const courtsConfig = negocio?.layoutConfig?.canchas || [];
  const COURTS: Court[] = courtsConfig.length > 0 ? courtsConfig : DEMO_COURTS;
  const accent = negocio?.accentColor || negocio?.primaryColor || "#00FF88"; // Neón Stadium
  const [expandedId, setExpandedId] = useState<number | string | null>(COURTS[0]?.id || null);
  const [preselectedService, setPreselectedService] = useState("");
  const hours = negocio?.layoutConfig?.hours;
  const address = negocio?.address || negocio?.layoutConfig?.address || "";
  const mapUrl = negocio?.mapUrl || negocio?.layoutConfig?.mapUrl || "";

  const scrollToBooking = (courtName: string) => {
    setPreselectedService(courtName);
    const el = document.getElementById("booking-section");
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div 
      className={`${fontSpace.variable} ${fontDMSans.variable} ${fontMono.variable} min-h-screen bg-[#080808] text-zinc-100 font-['DM_Sans'] selection:bg-[var(--accent)] selection:text-black overflow-x-hidden pb-12`} 
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {/* ── HEADER HERO ── */}
      <header className="relative pb-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.08] blur-[80px] pointer-events-none bg-[var(--accent)]" />
        <div className="absolute top-10 left-[10%] w-48 h-48 rounded-full opacity-[0.05] blur-[60px] pointer-events-none bg-[var(--accent)]" />
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative max-w-3xl mx-auto px-5 pt-20 pb-12 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full mb-6 bg-[var(--accent)] text-[#080808] shadow-[0_0_20px_rgba(0,255,136,0.3)]">
            <span className="w-2 h-2 rounded-full animate-ping bg-[#080808]" />
            Canchas Disponibles Hoy
          </div>

          <h1 className="font-['Space_Grotesk'] text-5xl sm:text-7xl font-extrabold text-white leading-[0.92] tracking-tighter mb-4 uppercase">
            {negocio?.name || "ESTADIO NORTE"}
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg font-medium max-w-md mx-auto leading-relaxed">
            {negocio?.tagline || "Instalaciones deportivas de nivel profesional. Elegí tu cancha, duración y confirmá tu turno al instante."}
          </p>

          <div className="mt-10 inline-flex items-center rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-md shadow-2xl">
            {[
              { label: "Canchas", value: `${COURTS.length}` },
              { label: "Horario", value: "07:00 – 23:00" },
              { label: "Confirmación", value: "Instantánea" },
            ].map((s, i) => (
              <div key={s.label} className={`px-5 sm:px-8 py-4 text-center ${i > 0 ? 'border-l border-white/10' : ''}`}>
                <div className="text-base sm:text-lg font-black text-[var(--accent)] font-['JetBrains_Mono']">{s.value}</div>
                <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-bold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── COURTS LIST ── */}
      <main className="max-w-2xl mx-auto px-4 pb-12 space-y-3.5 relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white font-['Space_Grotesk'] uppercase tracking-wider">
            Nuestras Canchas
          </h2>
          <p className="text-zinc-400 text-sm">Tocá una cancha para ver horarios disponibles</p>
        </div>

        {COURTS.map((court) => (
          <CourtCard
            key={court.id}
            court={court}
            accent={accent}
            isExpanded={expandedId === court.id}
            onToggle={() => setExpandedId((p) => (p === court.id ? null : court.id))}
            onBook={(info) => scrollToBooking(info.court.name)}
          />
        ))}

        <p className="text-center text-zinc-500 text-[11px] uppercase tracking-widest pt-6 font-bold">
          Precios oficiales en ARS · Turnos confirmados con reserva
        </p>
      </main>

      {/* ── VIDEO SECTION ── */}
      <VideoSection
        videoUrl={negocio?.layoutConfig?.videoUrl || (props.sections?.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
        accentColor={accent}
        theme="dark"
        className="pb-12"
      />

      {/* ── REAL BOOKING SYSTEM ── */}
      <section id="booking-section" className="max-w-2xl mx-auto px-4 pb-24 relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white font-['Space_Grotesk'] uppercase tracking-wider">
            Formulario de Reserva
          </h2>
          <p className="text-zinc-400 text-sm">Completá tus datos para asegurar tu turno en el sistema</p>
        </div>
        
        <div className="p-6 sm:p-8 rounded-3xl border border-[var(--accent)]/20 bg-[#0F1110] backdrop-blur-xl shadow-2xl">
          <BookingForm 
            businessId={businessId || negocio?.id || ""} 
            services={COURTS.map((c) => c.name)} 
            theme="dark" 
            preselectedService={preselectedService}
            variant="cancha"
          />
        </div>
      </section>
      
      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 bg-[#050605] pt-16 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <span className="font-['Space_Grotesk'] text-2xl font-black uppercase tracking-wider text-white block mb-4">
              {negocio?.name || "ESTADIO NORTE"}
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              El complejo deportivo líder en equipamiento, iluminación y comodidad para tus partidos semanales.
            </p>
            <div className="flex gap-3">
              {negocio?.instagram && (
                <a 
                  href={formatSocialUrl("instagram", negocio.instagram)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[var(--accent)] hover:text-black transition-all"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
              )}
              {negocio?.whatsapp && (
                <a 
                  href={`https://wa.me/${negocio.whatsapp.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-wider text-white mb-4">Horarios</h4>
            <div className="mb-4">
              <OpenNowBadge hours={hours} />
            </div>
            <div className="space-y-2 text-xs font-['JetBrains_Mono'] text-zinc-400">
              {hours ? (
                Object.entries(hours).map(([day, data]: [string, any]) => {
                  if (!data?.open) return null;
                  return (
                    <div key={day} className="flex justify-between border-b border-white/5 pb-1">
                      <span className="capitalize">{day}</span>
                      <span className="text-white">{data.from} - {data.to}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Lunes a Domingos</span>
                  <span className="text-white">07:00 - 23:00</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-['Space_Grotesk'] text-sm font-bold uppercase tracking-wider text-white mb-4">Ubicación</h4>
            {address && (
              <p className="text-xs text-zinc-400 mb-4 flex items-start gap-2">
                <span className="text-[var(--accent)]">📍</span> {address}
              </p>
            )}
            {mapUrl && (
              <div className="w-full h-28 rounded-xl overflow-hidden border border-white/10 shadow-md">
                <iframe 
                  src={mapUrl} 
                  title="Ubicación del complejo deportivo"
                  className="w-full h-full border-none" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto pt-6 border-t border-white/5 text-center text-xs text-zinc-500 font-['DM_Sans']">
          <p>© {new Date().getFullYear()} {negocio?.name || "Complejo Deportivo"}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}