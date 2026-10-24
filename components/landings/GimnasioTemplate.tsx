"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import { Oswald, Montserrat, JetBrains_Mono } from "next/font/google";
import BookingModal from "../ui/BookingModal";
import OpenNowBadge from "../ui/OpenNowBadge";
import VideoSection from "../ui/VideoSection";
import { formatSocialUrl } from "@/components/landings/biolinks/utils";

const fontOswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-gym-heading",
  display: "swap",
});

const fontMontserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-gym-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gym-mono",
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

// ─── TYPES ───
export interface Business {
  name: string;
  phone?: string;
  whatsapp?: string;
  primaryColor?: string;
}

export interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  periodo: string;
  tag?: string;
  features: string[];
  destacado?: boolean;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  icono: string;
}

export interface CartItem extends Producto {
  qty: number;
}

// ─── DEMO DATA ───
const DEMO_PLANES: Plan[] = [
  {
    id: "basico",
    nombre: "Pase Fuerza",
    descripcion: "Entrenamiento libre en sala de musculación pesada y cardio.",
    precio: 15000,
    periodo: "/ mes",
    features: ["Acceso ilimitado a sala de musculación", "Vestuarios con duchas y lockers", "Horario amplio 06:00 a 23:00 hs"],
  },
  {
    id: "full",
    nombre: "Black Training",
    descripcion: "El plan de máxima intensidad preferido por los atletas.",
    precio: 24000,
    periodo: "/ mes",
    tag: "Más Elegido",
    destacado: true,
    features: ["Todo lo del Pase Fuerza", "Clases de alta intensidad ilimitadas", "Rutina periódica de hipertrofia", "Pase libre a todas las sedes"],
  },
  {
    id: "elite",
    nombre: "Pro Athlete",
    descripcion: "Acompañamiento integral con resultados garantizados.",
    precio: 38000,
    periodo: "/ mes",
    features: ["Todo lo del plan Black Training", "Sesiones con Entrenador Personal (4/mes)", "Plan nutricional deportivo", "Acceso 24/7 sin restricciones"],
  },
];

const DEMO_PRODUCTOS: Producto[] = [
  { id: "p1", nombre: "Proteína Whey Isolate 2kg", descripcion: "100% suero puro microfiltrado, 27g de proteína por scoop. Sabor Doble Chocolate.", precio: 28000, categoria: "Suplementos", icono: "⚡" },
  { id: "p2", nombre: "Creatina Creapure 300g", descripcion: "Monohidrato micronizado alemán. Potencia y recuperación neuromuscular.", precio: 16000, categoria: "Suplementos", icono: "🔋" },
  { id: "p3", nombre: "Shaker Pro Acero Inox", descripcion: "Acero térmico grado alimenticio 750ml, cierre hermético antifuga.", precio: 9500, categoria: "Accesorios", icono: "🍶" },
  { id: "p4", nombre: "Straps de Levantamiento", descripcion: "Algodón reforzado con neopreno para agarre extremo en peso muerto.", precio: 11000, categoria: "Accesorios", icono: "🏋️‍♂️" },
];

const DEMO_ENTRENADORES = [
  { nombre: "Alex Silva", especialidad: "Head Coach · Halterofilia & Powerlifting", imagen: "" },
  { nombre: "Micaela Paz", especialidad: "Preparación Física · Hipertrofia", imagen: "" },
  { nombre: "Diego Torres", especialidad: "Acondicionamiento Físico · CrossFit", imagen: "" },
];

// ─── HELPERS ───
const fmt = (n: number) => {
  return new Intl.NumberFormat("es-AR", { 
    style: "currency", 
    currency: "ARS", 
    maximumFractionDigits: 0 
  }).format(n);
};

function buildWhatsAppMessage(cart: CartItem[], negocio: Business, msgGral?: string): string {
  const parts = [`🏋️‍♂️ *Hola ${negocio.name}*`, ""];
  if (msgGral) {
    parts.push(msgGral);
  } else if (cart.length > 0) {
    parts.push("🛒 *Quiero solicitar los siguientes suplementos/accesorios:*");
    cart.forEach((i) => parts.push(`• ${i.qty} x ${i.nombre} — ${fmt(i.precio * i.qty)}`));
    const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);
    parts.push(`*Total: ${fmt(total)}*`, "");
    parts.push("¿Cómo coordinamos el pago y retiro en el gimnasio?");
  }
  const phone = negocio.whatsapp || negocio.phone || "";
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(parts.join("\n"))}`;
}

// ─── DRAWER COMPONENT ───
function CheckoutDrawer({
  cart, 
  negocio, 
  onClose, 
  onRemoveCart
}: {
  cart: CartItem[]; 
  negocio: Business; 
  onClose: () => void;
  onRemoveCart: (id: string) => void;
}) {
  const total = useMemo(() => cart.reduce((s, i) => s + i.precio * i.qty, 0), [cart]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-label="Carrito de suplementación"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div 
        className="relative z-10 bg-[#09090B] border-t-2 sm:border-2 border-[var(--accent)] rounded-t-3xl sm:rounded-2xl shadow-[0_0_50px_rgba(225,255,1,0.15)] flex flex-col w-full max-w-lg max-h-[85vh] overflow-hidden"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>
        
        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
          <h2 className="font-['Oswald'] text-2xl uppercase tracking-widest text-white italic">
            Tu Suplementación
          </h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-white/50 hover:text-white text-2xl p-1"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-3xl bg-black/60 p-2.5 rounded-lg border border-white/5">{item.icono}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white uppercase tracking-wider truncate font-['Montserrat']">{item.nombre}</p>
                <p className="text-xs text-[var(--accent)] font-['JetBrains_Mono'] mt-0.5">{fmt(item.precio)} c/u</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-white font-bold font-['JetBrains_Mono']">x{item.qty}</span>
                <button 
                  type="button"
                  onClick={() => onRemoveCart(item.id)} 
                  className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors text-sm font-bold"
                  aria-label={`Eliminar ${item.nombre}`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pt-4 bg-[#050507] border-t border-white/10">
          {cart.length > 0 && (
            <div className="flex justify-between items-center mb-6">
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest font-['Montserrat']">Total Estimado</span>
              <span className="text-3xl font-black text-[var(--accent)] font-['JetBrains_Mono']">{fmt(total)}</span>
            </div>
          )}
          <a
            href={buildWhatsAppMessage(cart, negocio)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-center w-full py-4 rounded-xl font-black text-black text-[14px] uppercase tracking-widest bg-[var(--accent)] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(225,255,1,0.25)] font-['Montserrat']"
          >
            Confirmar por WhatsApp →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN TEMPLATE ───
export default function GimnasioTemplate(props: { negocio?: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, businessId, media = [] } = props;
  const layoutConfig = negocio?.layoutConfig || {};
  
  const accent = negocio?.accentColor || negocio?.primaryColor || "#E1FF01"; // Neón ácido
  
  const defaultNegocio: Business = useMemo(() => ({
    name: negocio?.name || "Iron Gym", 
    phone: negocio?.phone || negocio?.whatsapp || "5491100000000", 
    whatsapp: negocio?.whatsapp || negocio?.phone,
    primaryColor: accent,
  }), [negocio, accent]);
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const galleryImages = Array.isArray(media) ? media.filter((m: any) => m.type === "image") : [];
  const heroImageUrl = negocio?.bannerUrl || layoutConfig.heroImage || (galleryImages[0] ? galleryImages[0].url : "");
  
  const PLANES: Plan[] = layoutConfig.planes || DEMO_PLANES;
  const PRODUCTOS: Producto[] = layoutConfig.productos || DEMO_PRODUCTOS;
  const CLASES: string[] = layoutConfig.clases || ["CrossFit", "Funcional", "Powerlifting", "Spinning Pro", "Boxeo Técnico", "Hipertrofia"];
  const ENTRENADORES = layoutConfig.entrenadores || DEMO_ENTRENADORES;

  const handleAddProduct = (producto: Producto) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === producto.id);
      if (ex) return prev.map((i) => i.id === producto.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...producto, qty: 1 }];
    });
  };

  const handleRemoveProduct = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

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

  const totalItems = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  return (
    <div 
      className={`${fontOswald.variable} ${fontMontserrat.variable} ${fontMono.variable} min-h-screen bg-[#050507] text-white font-['Montserrat'] relative overflow-x-hidden selection:bg-[var(--accent)] selection:text-black pb-28 md:pb-0`} 
      style={{ "--accent": accent, "--border": "#27272A" } as React.CSSProperties}
    >
      {/* ── TEXTURA DE FONDO INDUSTRIAL ── */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── NAV ── */}
      <nav 
        aria-label="Navegación principal"
        className={`fixed top-0 inset-x-0 z-40 px-6 md:px-12 py-5 flex justify-between items-center transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#050507]/95 backdrop-blur-xl border-b border-[#27272A] shadow-2xl' 
            : 'bg-transparent'
        }`}
      >
        <span className="font-['Oswald'] text-2xl md:text-3xl font-black uppercase tracking-widest text-[var(--accent)] italic">
          {negocio?.name ?? "IRON GYM"}
        </span>

        <ul className="hidden md:flex gap-10 list-none text-[12px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">
          <li>
            <button type="button" onClick={() => scrollToSection("clases")} className="hover:text-white transition-colors">
              Clases
            </button>
          </li>
          <li>
            <button type="button" onClick={() => scrollToSection("planes")} className="hover:text-white transition-colors">
              Planes
            </button>
          </li>
          <li>
            <button type="button" onClick={() => scrollToSection("entrenadores")} className="hover:text-white transition-colors">
              Staff
            </button>
          </li>
          <li>
            <button type="button" onClick={() => scrollToSection("tienda")} className="hover:text-white transition-colors">
              Pro Shop
            </button>
          </li>
        </ul>

        <button 
          type="button"
          onClick={() => handleOpenBooking()}
          className="bg-[var(--accent)] text-black text-[12px] font-black uppercase tracking-widest px-6 py-2.5 rounded-sm hover:brightness-110 active:scale-95 transition-all skew-x-[-10deg] shadow-[0_0_15px_rgba(225,255,1,0.2)]"
        >
          <span className="inline-block skew-x-[10deg]">Entrenar Hoy</span>
        </button>
      </nav>

      {/* ── HERO ── */}
      <header className="relative min-h-[92dvh] flex items-center pt-24 px-6 md:px-16">
        <div className="absolute inset-0 z-0 bg-[#050507] overflow-hidden">
          {heroImageUrl ? (
            <img 
              src={heroImageUrl} 
              alt="Instalaciones del gimnasio" 
              className="w-full h-full object-cover opacity-40 grayscale contrast-125" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#09090B] via-[#050507] to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="inline-block border border-[var(--accent)] px-4 py-1.5 mb-8 skew-x-[-10deg] bg-[var(--accent)]/10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)] inline-block skew-x-[10deg]">
              ALTO RENDIMIENTO • DISCIPLINA PURA
            </span>
          </div>
          
          <h1 className="font-['Oswald'] text-[clamp(3.8rem,9vw,8.5rem)] font-black leading-[0.88] uppercase italic text-white mb-6 drop-shadow-2xl">
            SIN EXCUSAS.<br/>
            <span className="text-transparent" style={{ WebkitTextStroke: `2px ${accent}` }}>SOLO</span> <span className="text-[var(--accent)]">RESULTADOS.</span>
          </h1>
          
          <p className="font-['Montserrat'] font-medium text-zinc-400 text-base md:text-lg max-w-xl mb-12 leading-relaxed">
            {negocio?.tagline || "Tu cuerpo puede con todo, es a tu mente a la que tenés que convencer. Sumate al centro de entrenamiento más enfocado y exigente de la ciudad."}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <button 
              type="button"
              onClick={() => handleOpenBooking()}
              className="bg-[var(--accent)] text-black text-[14px] font-black uppercase tracking-widest px-10 py-4 hover:brightness-110 active:scale-95 transition-all skew-x-[-10deg] shadow-[6px_6px_0_rgba(255,255,255,0.15)]"
            >
              <span className="inline-block skew-x-[10deg]">Agendar Clase Libre</span>
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection("planes")} 
              className="text-white uppercase font-bold text-sm tracking-wider hover:text-[var(--accent)] transition-colors flex items-center gap-2"
            >
              Ver Membresías <span>→</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── CLASES / DISCIPLINAS ── */}
      <section id="clases" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Disciplinas Oficiales</p>
            <h2 className="font-['Oswald'] text-5xl md:text-6xl font-black uppercase italic">Nuestras Clases</h2>
          </div>
          <button 
            type="button"
            onClick={() => handleOpenBooking()}
            className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 hover:text-[var(--accent)] flex items-center gap-2 transition-colors"
          >
            Ver grilla horaria semanal <span className="text-xl">→</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {CLASES.map((clase, i) => (
            <div 
              key={i} 
              onClick={() => handleOpenBooking(clase)}
              className="group relative bg-[#111113] border border-[#27272A] p-6 md:p-10 cursor-pointer overflow-hidden transition-all duration-300 hover:border-[var(--accent)] hover:-translate-y-1 shadow-lg"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/5 rounded-bl-full group-hover:scale-150 transition-transform duration-500" />
              <h3 className="font-['Oswald'] text-2xl md:text-3xl font-black uppercase italic mb-2 relative z-10 group-hover:text-[var(--accent)] transition-colors">
                {clase}
              </h3>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-widest relative z-10 group-hover:text-zinc-200 transition-colors mt-auto pt-8">
                Reservar Cupo →
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLANES / MEMBRESÍAS ── */}
      <section id="planes" className="py-24 bg-[#09090B] border-y border-[#27272A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Membresías</p>
            <h2 className="font-['Oswald'] text-5xl md:text-6xl font-black uppercase italic mb-4">Elegí tu pase</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto font-medium text-sm sm:text-base">
              Invertí en tu salud y potencia física con planes flexibles adaptados a tu ritmo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {PLANES.map((plan) => (
              <div 
                key={plan.id} 
                className={`bg-[#111113] border p-8 md:p-10 flex flex-col h-full relative transition-all duration-300 hover:-translate-y-2 ${
                  plan.destacado 
                    ? 'border-[var(--accent)] shadow-[0_0_40px_rgba(225,255,1,0.08)] scale-105 z-10' 
                    : 'border-[#27272A]'
                }`}
              >
                {plan.tag && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--accent)] text-black text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1 skew-x-[-10deg] shadow-md">
                    <span className="inline-block skew-x-[10deg]">{plan.tag}</span>
                  </div>
                )}
                
                <h3 className="font-['Oswald'] text-3xl font-black uppercase italic mb-2 text-white">{plan.nombre}</h3>
                <p className="text-xs text-zinc-400 mb-8 h-8 leading-relaxed">{plan.descripcion}</p>
                
                <div className="mb-8">
                  <span className={`text-4xl sm:text-5xl font-black font-['Oswald'] italic ${plan.destacado ? 'text-[var(--accent)]' : 'text-white'}`}>
                    {fmt(plan.precio)}
                  </span>
                  <span className="text-xs text-zinc-400 ml-2 font-bold uppercase font-['JetBrains_Mono']">{plan.periodo}</span>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-xs sm:text-sm font-medium text-zinc-300">
                      <svg className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button 
                  type="button"
                  onClick={() => {
                    const msg = `Hola! Quiero inscribirme al plan *${plan.nombre}* (${fmt(plan.precio)}). ¿Qué promociones y medios de pago tienen vigentes?`;
                    window.open(buildWhatsAppMessage([], defaultNegocio, msg), '_blank', 'noopener,noreferrer');
                  }}
                  className={`w-full py-4 uppercase font-black tracking-widest text-[13px] skew-x-[-10deg] transition-all shadow-md ${
                    plan.destacado 
                      ? 'bg-[var(--accent)] text-black hover:brightness-110' 
                      : 'bg-white/10 text-white hover:bg-[var(--accent)] hover:text-black'
                  }`}
                >
                  <span className="inline-block skew-x-[10deg]">Comenzar Plan</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENTRENADORES ── */}
      <section id="entrenadores" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Staff Técnico</p>
          <h2 className="font-['Oswald'] text-5xl md:text-6xl font-black uppercase italic">Tus Coaches</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ENTRENADORES.map((coach: any, i: number) => (
            <div key={i} className="group bg-[#111113] border border-[#27272A] overflow-hidden hover:border-[var(--accent)] transition-colors">
              <div className="aspect-[4/5] bg-[#18181B] relative overflow-hidden flex items-center justify-center">
                {coach.imagen ? (
                  <img src={coach.imagen} alt={coach.nombre} className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-700 font-bold font-['Oswald']">
                    COACH
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="font-['Oswald'] text-2xl font-black uppercase italic mb-1 text-white">{coach.nombre}</h3>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">{coach.especialidad}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIENDA PRO SHOP ── */}
      <section id="tienda" className="py-24 bg-[#09090B] border-t border-[#27272A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Suplementación & Indumentaria</p>
              <h2 className="font-['Oswald'] text-5xl md:text-6xl font-black uppercase italic">Pro Shop</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRODUCTOS.map((prod) => (
              <div key={prod.id} className="bg-[#111113] border border-[#27272A] p-6 hover:border-[var(--accent)] transition-all flex flex-col group rounded-xl">
                <div className="text-4xl mb-6 bg-[#18181B] w-14 h-14 flex items-center justify-center rounded-xl group-hover:bg-[var(--accent)]/10 transition-colors border border-white/5">
                  {prod.icono}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1.5">{prod.categoria}</span>
                <h3 className="font-['Oswald'] text-lg font-bold uppercase mb-2 leading-tight text-white">{prod.nombre}</h3>
                <p className="text-xs text-zinc-400 mb-6 flex-1 leading-relaxed">{prod.descripcion}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-[#27272A] mt-auto">
                  <span className="font-['JetBrains_Mono'] text-xl font-black text-[var(--accent)]">{fmt(prod.precio)}</span>
                  <button 
                    type="button"
                    onClick={() => handleAddProduct(prod)}
                    className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[var(--accent)] hover:text-black transition-colors"
                    aria-label={`Agregar ${prod.nombre} al pedido`}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIDEO SECTION ── */}
      <VideoSection
        videoUrl={layoutConfig.videoUrl || (props.sections?.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
        accentColor={accent}
        theme="dark"
      />

      {/* ── FOOTER / CONTACTO ── */}
      <footer className="bg-[#050507] py-24 px-6 md:px-12 border-t-2 border-[var(--accent)] relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10 mb-16">
          <div>
            <span className="font-['Oswald'] text-4xl font-black uppercase tracking-widest text-white italic block mb-6">
              {negocio?.name ?? "IRON GYM"}
            </span>
            <p className="font-medium text-zinc-400 text-sm max-w-sm mb-8 leading-relaxed">
              El entorno diseñado para superar tus límites. Infraestructura de potencia, coaches comprometidos y mentalidad inquebrantable.
            </p>
            <div className="flex gap-3">
              {layoutConfig.instagram && (
                <a 
                  href={formatSocialUrl("instagram", layoutConfig.instagram)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-11 h-11 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)] transition-all"
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
                  className="w-11 h-11 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-['Oswald'] text-2xl font-black uppercase italic mb-6 text-white">Horarios</h4>
            <div className="space-y-3.5 text-sm font-medium mb-6">
              {layoutConfig.hours ? (
                Object.entries(layoutConfig.hours).map(([day, data]: [string, any]) => {
                  if (!data?.open) return null;
                  return (
                    <div key={day} className="flex justify-between border-b border-white/10 pb-2 font-['JetBrains_Mono']">
                      <span className="capitalize text-zinc-400 font-['Montserrat']">{day}</span>
                      <span className="text-[var(--accent)] font-bold">{data.from} - {data.to}</span>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-zinc-400">Lunes a Viernes</span><span className="text-[var(--accent)] font-bold font-['JetBrains_Mono']">06:00 - 23:00</span></div>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-zinc-400">Sábados</span><span className="text-[var(--accent)] font-bold font-['JetBrains_Mono']">08:00 - 18:00</span></div>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-zinc-400">Domingos</span><span className="text-zinc-600 font-bold font-['JetBrains_Mono']">Cerrado</span></div>
                </>
              )}
            </div>
            <div>
              <OpenNowBadge hours={layoutConfig.hours} />
            </div>
          </div>

          <div>
            <h4 className="font-['Oswald'] text-2xl font-black uppercase italic mb-6 text-white">Ubicación</h4>
            <div className="space-y-3.5 text-sm font-medium text-zinc-400">
              {negocio?.address && <p>📍 {negocio.address}</p>}
              {negocio?.phone && <p>📞 {negocio.phone}</p>}
              {negocio?.email && <p>✉️ {negocio.email}</p>}
            </div>
            {layoutConfig.mapUrl && (
              <div className="mt-6 h-36 w-full rounded-xl overflow-hidden border border-white/10 grayscale hover:grayscale-0 transition-all">
                <iframe 
                  src={layoutConfig.mapUrl} 
                  title="Ubicación del gimnasio"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center">
          <p className="font-bold text-[10px] uppercase tracking-widest text-zinc-500 font-['JetBrains_Mono']">
            © {new Date().getFullYear()} {negocio?.name || "IRON GYM"}. TODOS LOS DERECHOS RESERVADOS.
          </p>
        </div>
      </footer>

      {/* ── FLOATING CART BUTTON ── */}
      {totalItems > 0 && (
        <div 
          className="fixed z-40 right-6"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="bg-[var(--accent)] text-black px-6 py-4 flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(225,255,1,0.25)] skew-x-[-10deg] rounded-xl"
            aria-label="Ver pedido de suplementos"
          >
            <div className="bg-black text-white w-7 h-7 flex items-center justify-center font-black skew-x-[10deg] rounded-md text-xs">
              {totalItems}
            </div>
            <span className="font-['Oswald'] uppercase font-black text-lg skew-x-[10deg]">Ver Pedido</span>
          </button>
        </div>
      )}

      {/* ── BOOKING MODAL ── */}
      <BookingModal 
        isOpen={bookingOpen} 
        onClose={() => setBookingOpen(false)} 
        businessId={businessId || negocio?.id || "demo"} 
        services={CLASES}
        theme="dark"
        title="Reservar Clase"
        preselectedService={preselectedService}
        variant="gimnasio"
        primaryColor={accent}
      />

      {cartOpen && (
        <CheckoutDrawer 
          cart={cart} 
          negocio={defaultNegocio}
          onClose={() => setCartOpen(false)}
          onRemoveCart={handleRemoveProduct}
        />
      )}
    </div>
  );
}