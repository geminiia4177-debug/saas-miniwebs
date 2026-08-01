"use client";

import { useState, useEffect, useRef } from "react";
import { Business } from "@prisma/client";
import BookingForm from "@/app/[subdomain]/BookingForm";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Court {
  id: number;
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

interface BookingInfo {
  court: Court;
  duration: { label: string; minutes: number; price: number };
  slot: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const DEMO_COURTS: Court[] = [
  {
    id: 1,
    name: "Cancha 1",
    sport: "Fútbol 5",
    icon: "⚽",
    description: "Césped sintético premium, techada con iluminación LED profesional.",
    surface: "Sintético",
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
    name: "Cancha 2",
    sport: "Pádel",
    icon: "🎾",
    description: "Paredes de Blindex, césped sintético azul, medidas reglamentarias.",
    surface: "Sintético azul",
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
    name: "Cancha 3",
    sport: "Básquet",
    icon: "🏀",
    description: "Parqué flotante certificado, aros reglamentarios y tableros acrílicos.",
    surface: "Parqué flotante",
    capacity: "5 vs 5",
    covered: true,
    durations: [
      { label: "1 hora", minutes: 60, price: 13000 },
      { label: "2 h", minutes: 120, price: 22000 },
    ],
    slots: {
      60: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
      120: ["08:00", "10:00", "14:00", "18:00"],
    },
  },
  {
    id: 4,
    name: "Cancha 4",
    sport: "Tenis",
    icon: "🎾",
    description: "Polvo de ladrillo con marcación doble, red reglamentaria y perímetro iluminado.",
    surface: "Polvo de ladrillo",
    capacity: "1 vs 1 / 2 vs 2",
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

function genBookingId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── QR Generator (canvas puro) ────────────────────────────────────────────────
function QRCanvas({ data, size = 160, accent }: { data: string; size?: number; accent: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cells = 21;
    const cell = size / cells;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
    }
    function rng(seed: number) {
      seed = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
      seed = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
      return ((seed ^ (seed >>> 16)) >>> 0) / 0xffffffff;
    }

    const drawCell = (col: number, row: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(col * cell + 1, row * cell + 1, cell - 2, cell - 2, 2)
        : ctx.rect(col * cell + 1, row * cell + 1, cell - 2, cell - 2);
      ctx.fill();
    };

    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const isFinderZone = (r < 8 && c < 8) || (r < 8 && c >= cells - 8) || (r >= cells - 8 && c < 8);
        if (isFinderZone) continue;
        if (rng(hash + r * 100 + c) > 0.45) drawCell(c, r, "#111111");
      }
    }

    const drawFinder = (ox: number, oy: number) => {
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 7; c++) {
          const border = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (border || inner) drawCell(ox + c, oy + r, "#111111");
        }
    };
    
    drawFinder(0, 0);
    drawFinder(cells - 7, 0);
    drawFinder(0, cells - 7);

    ctx.fillStyle = accent;
    const cx = (size / 2) - cell;
    const cy = (size / 2) - cell;
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }, [data, size, accent]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />;
}

// ─── Booking Modal ────────────────────────────────────────────────────────────
function BookingModal({ booking, accent, onClose }: { booking: BookingInfo; accent: string; onClose: () => void }) {
  const [step, setStep] = useState<"form" | "confirmed">("form");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errors, setErrors] = useState<{ nombre?: string; telefono?: string }>({});
  const [bookingId] = useState(genBookingId);

  const qrData = `RESERVA:${bookingId}|${booking.court.name}|${booking.slot}|${booking.duration.label}|${nombre}|${telefono}`;

  function validate() {
    const e: typeof errors = {};
    if (!nombre.trim()) e.nombre = "Ingresá tu nombre";
    if (!/^\+?\d{8,15}$/.test(telefono.replace(/\s/g, ""))) e.telefono = "Teléfono inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div 
        className="w-full max-w-md rounded-2xl overflow-hidden bg-[#111] shadow-2xl relative"
        style={{ border: `1px solid color-mix(in srgb, var(--accent) 20%, transparent)`, boxShadow: `0 0 60px color-mix(in srgb, var(--accent) 15%, transparent)` }}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
              {step === "form" ? "Confirmá tu reserva" : "¡Reserva confirmada!"}
            </p>
            <h2 className="text-white font-black text-xl mt-0.5">{booking.court.name} · {booking.slot}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors">✕</button>
        </div>

        {step === "form" ? (
          <div className="p-6 space-y-5">
            <div className="rounded-xl p-4 flex items-center gap-3 bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] border border-[color-mix(in_srgb,var(--accent)_15%,transparent)]">
              <span className="text-2xl">{booking.court.icon}</span>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{booking.court.sport} · {booking.duration.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{booking.slot} hs · {booking.court.surface}</p>
              </div>
              <span className="font-black text-lg text-[var(--accent)]">{fmt(booking.duration.price)}</span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => { setNombre(e.target.value); setErrors((p) => ({ ...p, nombre: undefined })); }}
                placeholder="Ej: Juan Pérez"
                className={`w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all bg-white/5 border-[1.5px] ${errors.nombre ? 'border-red-500' : nombre ? 'border-[var(--accent)]/50' : 'border-white/10 focus:border-white/20'}`}
              />
              {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Teléfono / WhatsApp</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => { setTelefono(e.target.value); setErrors((p) => ({ ...p, telefono: undefined })); }}
                placeholder="Ej: +54 9 11 1234 5678"
                className={`w-full rounded-xl px-4 py-3 text-white text-sm outline-none transition-all bg-white/5 border-[1.5px] ${errors.telefono ? 'border-red-500' : telefono ? 'border-[var(--accent)]/50' : 'border-white/10 focus:border-white/20'}`}
              />
              {errors.telefono && <p className="text-red-400 text-xs mt-1">{errors.telefono}</p>}
            </div>

            <button
              onClick={() => validate() && setStep("confirmed")}
              className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-150 hover:opacity-90 active:scale-95 bg-[var(--accent)] text-black"
            >
              Confirmar y obtener QR →
            </button>
            <p className="text-center text-gray-500 text-xs">Al confirmar aceptás los términos del establecimiento.</p>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center text-center space-y-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border-2 border-[var(--accent)]">
              ✓
            </div>
            <div>
              <p className="text-white font-black text-xl">¡Todo listo, {nombre.split(" ")[0]}!</p>
              <p className="text-gray-400 text-sm mt-1">Mostrá este QR en la entrada para acceder.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
              <QRCanvas data={qrData} size={180} accent={accent} />
            </div>
            <div className="rounded-xl px-6 py-3 w-full bg-white/5 border border-white/10">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Código de reserva</p>
              <p className="text-white font-black text-2xl tracking-[0.3em]">{bookingId}</p>
            </div>
            <div className="w-full space-y-2">
              {[
                { label: "Cancha", value: `${booking.court.name} · ${booking.court.sport}` },
                { label: "Horario", value: `${booking.slot} hs · ${booking.duration.label}` },
                { label: "Total", value: fmt(booking.duration.price) },
                { label: "Titular", value: nombre },
                { label: "Teléfono", value: telefono },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="text-white font-semibold">{r.value}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose} className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Court Card ───────────────────────────────────────────────────────────────
function CourtCard({ court, accent, isExpanded, onToggle, onBook }: { court: Court; accent: string; isExpanded: boolean; onToggle: () => void; onBook: (info: BookingInfo) => void }) {
  const [selectedDuration, setSelectedDuration] = useState(court.durations[0].minutes);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const activeDur = court.durations.find((d) => d.minutes === selectedDuration)!;
  const availableSlots = court.slots[selectedDuration] ?? [];

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-all duration-300 border ${isExpanded ? 'bg-gradient-to-br from-white/5 to-white/[0.02]' : 'bg-white/5 border-white/10'}`}
      style={{
        borderColor: isExpanded ? `color-mix(in srgb, var(--accent) 33%, transparent)` : undefined,
        boxShadow: isExpanded ? `0 4px 40px color-mix(in srgb, var(--accent) 10%, transparent)` : "none",
      }}
    >
      <button className="w-full text-left p-5 flex items-center gap-4 group" onClick={onToggle}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all border ${isExpanded ? 'border-[var(--accent)]/40 bg-[var(--accent)]/20' : 'bg-white/5 border-transparent group-hover:bg-white/10'}`}>
          {court.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-black text-white uppercase tracking-wide leading-none">{court.name}</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
              {court.sport}
            </span>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {[court.surface, court.capacity, court.covered ? "🏠 Techada" : "🌤 Al aire"].map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-white/5 text-gray-400">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-black text-[var(--accent)]">{fmt(court.durations[0].price)}</div>
          <div className="text-xs text-gray-500">desde</div>
        </div>
        <svg className={`w-5 h-5 text-gray-500 shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="overflow-hidden transition-all duration-500 ease-in-out" style={{ maxHeight: isExpanded ? "900px" : "0px" }}>
        <div className="mx-4 mb-4 rounded-xl p-5 space-y-5 bg-black/30 border border-white/5">
          <p className="text-gray-400 text-sm leading-relaxed">{court.description}</p>
          
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-3">Duración</p>
            <div className="flex gap-2 flex-wrap">
              {court.durations.map((d) => {
                const active = d.minutes === selectedDuration;
                return (
                  <button
                    key={d.minutes}
                    onClick={() => { setSelectedDuration(d.minutes); setSelectedSlot(null); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${active ? 'bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)] border-[var(--accent)]/60' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
                    </svg>
                    {d.label}
                    <span className="font-black ml-1">{fmt(d.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-3">Horarios disponibles · {availableSlots.length} turnos</p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {availableSlots.map((s) => {
                const sel = s === selectedSlot;
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedSlot(s)}
                    className={`rounded-lg py-2 text-sm font-bold transition-all border ${sel ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            disabled={!selectedSlot}
            onClick={() => selectedSlot && onBook({ court, duration: activeDur, slot: selectedSlot })}
            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200 border ${selectedSlot ? 'bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_80%,transparent)] text-black shadow-[0_4px_20px_color-mix(in_srgb,var(--accent)_30%,transparent)] border-transparent hover:scale-[1.02]' : 'bg-white/5 text-white/20 border-white/5 cursor-not-allowed'}`}
          >
            {selectedSlot ? `Reservar ${selectedSlot} · ${activeDur.label} · ${fmt(activeDur.price)}` : "Seleccioná un horario"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CanchaTemplate(props: { negocio?: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, businessId } = props;
  const courtsConfig = negocio?.layoutConfig?.canchas || [];
  const COURTS: Court[] = courtsConfig.length > 0 ? courtsConfig : DEMO_COURTS;
  const accent = negocio?.primaryColor || "#00E676"; // Usamos el color de la base de datos
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeBooking, setActiveBooking] = useState<BookingInfo | null>(null);
  const [preselectedService, setPreselectedService] = useState("");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Space+Grotesk:wght@700;800&display=swap');
        .font-space { font-family: 'Space Grotesk', sans-serif; }
        .font-dm { font-family: 'DM Sans', sans-serif; }
      `}</style>
      
      <div className="min-h-screen bg-[#080808] text-gray-100 font-dm selection:bg-[var(--accent)] selection:text-black overflow-x-hidden" style={{ "--accent": accent } as React.CSSProperties}>
        
        {/* ── HEADER ── */}
        <header className="relative pb-2">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.07] blur-[80px] pointer-events-none bg-[var(--accent)]" />
          <div className="absolute top-10 left-[10%] w-48 h-48 rounded-full opacity-[0.04] blur-[60px] pointer-events-none bg-[var(--accent)]" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className="relative max-w-2xl mx-auto px-5 pt-16 pb-12 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full mb-6 bg-[var(--accent)] text-[#080808] shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_40%,transparent)]">
              <span className="w-2 h-2 rounded-full animate-pulse bg-[#080808]" />
              Canchas Disponibles
            </div>

            <h1 className="font-space text-5xl sm:text-7xl font-black text-white leading-[0.95] tracking-tighter mb-4">
              {negocio?.name || "ESTADIO NORTE"}
            </h1>
            <p className="text-gray-400 text-base sm:text-lg font-medium max-w-sm mx-auto">
              Elegí tu cancha, la duración y el horario.
            </p>

            <div className="mt-10 inline-flex items-center rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-sm">
              {[
                { label: "Canchas", value: `${COURTS.length}` },
                { label: "Horario", value: "7–23 h" },
                { label: "Confirmación", value: "Instante" },
              ].map((s, i) => (
                <div key={s.label} className={`px-5 sm:px-8 py-4 text-center ${i > 0 ? 'border-l border-white/10' : ''}`}>
                  <div className="text-lg sm:text-xl font-black text-[var(--accent)]">{s.value}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
        </header>

        {/* ── COURTS (Visual Preview) ── */}
        <main className="max-w-2xl mx-auto px-4 pb-12 space-y-3 relative z-10">
          <div className="text-center mb-6">
             <h2 className="text-2xl font-black text-white">Nuestras Canchas</h2>
             <p className="text-gray-400 text-sm">Conocé nuestras instalaciones premium</p>
          </div>
          {COURTS.map((court) => (
            <CourtCard
              key={court.id}
              court={court}
              accent={accent}
              isExpanded={expandedId === court.id}
              onToggle={() => setExpandedId((p) => (p === court.id ? null : court.id))}
              onBook={(info) => {
                 setPreselectedService(info.court.name);
                 document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          ))}
          <p className="text-center text-gray-600 text-[11px] uppercase tracking-widest pt-8 font-bold">
            Precios en ARS · Las reservas se confirman con seña del 50%
          </p>
        </main>

        {/* ── REAL BOOKING SYSTEM ── */}
        <section id="booking-section" className="max-w-2xl mx-auto px-4 pb-24 relative z-10">
           <div className="p-6 rounded-3xl border bg-black/40 backdrop-blur-md" style={{ borderColor: `color-mix(in srgb, ${accent} 20%, transparent)` }}>
              <BookingForm 
                businessId={businessId || negocio?.id || ""} 
                services={COURTS.map(c => c.name)} 
                theme="dark" 
                preselectedService={preselectedService}
                variant="cancha"
              />
           </div>
        </section>
        
        {/* FOOTER */}
        <footer className="max-w-2xl mx-auto px-4 pb-12 text-center text-sm text-gray-500">
           <p>© {new Date().getFullYear()} {negocio?.name || "Canchas"}. Todos los derechos reservados.</p>
        </footer>
      </div>
    </>
  );
}