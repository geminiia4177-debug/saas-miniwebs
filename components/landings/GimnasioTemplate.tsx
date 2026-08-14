"use client";

import React, { useState, useEffect } from "react";
import BookingModal from "../ui/BookingModal";
import OpenNowBadge from "../ui/OpenNowBadge";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Business {
  name: string;
  phone?: string;
  primaryColor?: string;
}

interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  periodo: string;
  tag?: string;
  features: string[];
  destacado?: boolean;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  icono: string;
}

interface CartItem extends Producto {
  qty: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const DEMO_PLANES: Plan[] = [
  {
    id: "basico",
    nombre: "Básico",
    descripcion: "Para arrancar con todo.",
    precio: 15000,
    periodo: "/ mes",
    features: ["Pase libre sala musculación", "Duchas y lockers", "Horario 06 a 23 hs"],
  },
  {
    id: "full",
    nombre: "Full Training",
    descripcion: "El más elegido por los socios.",
    precio: 24000,
    periodo: "/ mes",
    tag: "Recomendado",
    destacado: true,
    features: ["Todo lo del plan Básico", "Clases grupales ilimitadas", "Rutina armada mensual", "Pase a sede central"],
  },
  {
    id: "elite",
    nombre: "Elite",
    descripcion: "Resultados asegurados.",
    precio: 38000,
    periodo: "/ mes",
    features: ["Todo lo del plan Full", "Entrenador personal (4/mes)", "Asesoría nutricional", "Acceso 24/7 sin límite"],
  },
];

const DEMO_PRODUCTOS: Producto[] = [
  { id: "p1", nombre: "Proteína Whey 2kg", descripcion: "100% suero de leche, 24g de proteína. Sabor chocolate.", precio: 28000, categoria: "Suplementos", icono: "🥛" },
  { id: "p2", nombre: "Creatina Monohidrato", descripcion: "5g por porción, máxima pureza. Mejora explosiva.", precio: 16000, categoria: "Suplementos", icono: "⚡" },
  { id: "p3", nombre: "Shaker Acero", descripcion: "Acero inoxidable, no junta olores. 750ml.", precio: 9500, categoria: "Accesorios", icono: "🍶" },
  { id: "p4", nombre: "Straps Agarre", descripcion: "Soporte para levantamiento pesado.", precio: 11000, categoria: "Accesorios", icono: "🏋️‍♂️" },
];

const DEMO_ENTRENADORES = [
  { nombre: "Alex Silva", especialidad: "Head Coach · CrossFit", imagen: "" },
  { nombre: "Micaela Paz", especialidad: "Funcional · Hipertrofia", imagen: "" },
  { nombre: "Diego Torres", especialidad: "Fuerza y Potencia", imagen: "" }
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

function buildWhatsAppMessage(cart: CartItem[], negocio: Business, msgGral?: string): string {
  const parts = [`🏋️‍♂️ *Hola ${negocio.name}*`, ""];
  if (msgGral) {
    parts.push(msgGral);
  } else if (cart.length > 0) {
    parts.push("🛒 *Quiero comprar:*");
    cart.forEach(i => parts.push(`• ${i.qty} x ${i.nombre} — ${fmt(i.precio * i.qty)}`));
    const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);
    parts.push(`*Total: ${fmt(total)}*`, "");
    parts.push("¿Cómo coordinamos el pago y entrega?");
  }
  return `https://wa.me/${negocio.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(parts.join("\n"))}`;
}

// ─── Drawer Component ────────────────────────────────────────────────────────
function CheckoutDrawer({
  cart, negocio, onClose, onRemoveCart
}: {
  cart: CartItem[]; negocio: Business; onClose: () => void;
  onRemoveCart: (id: string) => void;
}) {
  const total = cart.reduce((s, i) => s + i.precio * i.qty, 0);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#09090B] border-t-2 border-[var(--accent)] rounded-t-2xl shadow-[0_-10px_50px_rgba(225,255,1,0.1)] flex flex-col max-h-[85vh]">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>
        <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
          <h2 className="font-['Oswald',sans-serif] text-2xl uppercase tracking-widest text-white">Tu Suplementación</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-3xl bg-black/50 p-2 rounded-lg">{item.icono}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white uppercase tracking-wider truncate">{item.nombre}</p>
                <p className="text-xs text-[var(--accent)]">{fmt(item.precio)} c/u</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-white font-bold">x{item.qty}</span>
                <button onClick={() => onRemoveCart(item.id)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pt-4 pb-8 bg-[#000000]">
          {cart.length > 0 && (
            <div className="flex justify-between items-center mb-6">
              <span className="text-white/60 text-sm font-bold uppercase tracking-wider">Total Final</span>
              <span className="text-3xl font-black text-[var(--accent)]">{fmt(total)}</span>
            </div>
          )}
          <a
            href={buildWhatsAppMessage(cart, negocio)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-center w-full py-4 rounded-lg font-bold text-black text-[15px] uppercase tracking-widest bg-[var(--accent)] hover:brightness-110 active:scale-95 transition-all"
          >
            Confirmar pedido
          </a>
        </div>
      </div>
    </>
  );
}

// ─── Main Template ────────────────────────────────────────────────────────────
export default function GimnasioTemplate(props: { negocio?: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, businessId, media = [] } = props;
  const layoutConfig = negocio?.layoutConfig || {};
  
  const accent = negocio?.primaryColor ?? "#E1FF01"; // Amarillo neón
  
  const defaultNegocio: Business = { name: negocio?.name || "Iron Gym", phone: negocio?.phone || "5491100000000", primaryColor: accent };
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const galleryImages = media.filter((m: any) => m.type === "image");
  const heroImageUrl = negocio?.bannerUrl || layoutConfig.heroImage || (galleryImages[0] ? galleryImages[0].url : "");
  
  const PLANES: Plan[] = layoutConfig.planes || DEMO_PLANES;
  const PRODUCTOS: Producto[] = layoutConfig.productos || DEMO_PRODUCTOS;
  const CLASES: string[] = layoutConfig.clases || ["CrossFit", "Funcional", "Halterofilia", "Spinning", "Boxeo", "GAP"];
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

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&family=Montserrat:ital,wght@0,300;0,400;0,600;0,800;1,900&display=swap');
        
        :root {
          --borde-dark: #27272A;
        }

        .font-oswald { font-family: 'Oswald', sans-serif; }
        .font-montserrat { font-family: 'Montserrat', sans-serif; }
        
        .diagonal-stripes {
          background: repeating-linear-gradient(
            45deg,
            #000000 0px,
            #000000 10px,
            #09090B 10px,
            #09090B 20px
          );
        }

        .grunge-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.25;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }

        /* Hover neon effect */
        .hover-neon:hover {
          box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3);
          border-color: var(--accent);
        }
      `}</style>

      <div className="min-h-screen bg-[#09090B] text-white font-montserrat relative overflow-x-hidden selection:bg-[var(--accent)] selection:text-black" style={{ "--accent": accent } as React.CSSProperties}>
        <div className="grunge-overlay" />

        {/* ── NAV ── */}
        <nav className={`fixed top-0 inset-x-0 z-40 px-6 md:px-12 py-5 flex justify-between items-center transition-all duration-300 ${isScrolled ? 'bg-[#000000]/95 backdrop-blur-md border-b border-[var(--borde-dark)]' : 'bg-transparent'}`}>
          <span className="font-oswald text-2xl md:text-3xl font-black uppercase tracking-widest text-[var(--accent)] italic">
            {negocio?.name ?? "IRON GYM"}
          </span>

          <ul className="hidden md:flex gap-10 list-none text-[13px] font-bold uppercase tracking-widest text-white/60">
            <li><a href="#clases" className="hover:text-white transition-colors">Clases</a></li>
            <li><a href="#entrenadores" className="hover:text-white transition-colors">Coaches</a></li>
            <li><a href="#planes" className="hover:text-white transition-colors">Planes</a></li>
            <li><a href="#tienda" className="hover:text-white transition-colors">Tienda</a></li>
          </ul>

          <button 
            onClick={() => handleOpenBooking()}
            className="bg-[var(--accent)] text-black text-[12px] font-black uppercase tracking-widest px-6 py-2.5 rounded-sm hover:brightness-110 active:scale-95 transition-all skew-x-[-10deg]"
          >
            <span className="inline-block skew-x-[10deg]">Entrenar hoy</span>
          </button>
        </nav>

        {/* ── HERO ── */}
        <header className="relative min-h-[90vh] flex items-center pt-20">
          <div className="absolute inset-0 z-0 bg-black">
            {heroImageUrl ? (
              <img src={heroImageUrl} alt="Gym Hero" className="w-full h-full object-cover opacity-50 grayscale contrast-125" />
            ) : (
              <div className="w-full h-full diagonal-stripes" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090B] via-[#09090B]/30 to-transparent" />
          </div>

          <div className="relative z-10 px-8 md:px-16 w-full max-w-6xl mx-auto">
            <div className="inline-block border border-[var(--accent)] px-4 py-1.5 mb-8 skew-x-[-10deg] bg-[var(--accent)]/10">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] inline-block skew-x-[10deg]">
                No pain, no gain
              </span>
            </div>
            
            <h1 className="font-oswald text-[clamp(4.5rem,10vw,8rem)] font-black leading-[0.9] uppercase italic text-white mb-6 drop-shadow-2xl">
              SIN EXCUSAS.<br/>
              <span className="text-transparent" style={{ WebkitTextStroke: `2px ${accent}` }}>SOLO</span> <span className="text-[var(--accent)]">RESULTADOS.</span>
            </h1>
            
            <p className="font-montserrat font-medium text-white/60 text-base md:text-lg max-w-xl mb-12">
              {negocio?.tagline || "Tu cuerpo puede con todo, es tu mente a la que tenés que convencer. Sumate al centro de entrenamiento más hardcore de la ciudad."}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <button 
                onClick={() => handleOpenBooking()}
                className="bg-[var(--accent)] text-black text-[15px] font-black uppercase tracking-widest px-10 py-5 hover:brightness-110 active:scale-95 transition-all skew-x-[-10deg] shadow-[8px_8px_0_rgba(255,255,255,0.1)]"
              >
                <span className="inline-block skew-x-[10deg]">Agendar Clase Libre</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── CLASES (Disciplinas) ── */}
        <section id="clases" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Disciplinas</p>
              <h2 className="font-oswald text-5xl md:text-6xl font-black uppercase italic">Nuestras Clases</h2>
            </div>
            <button 
               onClick={() => handleOpenBooking()}
               className="text-[12px] font-bold uppercase tracking-widest text-white/50 hover:text-[var(--accent)] flex items-center gap-2 transition-colors"
            >
              Ver grilla de horarios <span className="text-xl">→</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {CLASES.map((clase, i) => (
              <div 
                key={i} 
                onClick={() => handleOpenBooking(clase)}
                className="group relative bg-[#18181B] border border-[var(--borde-dark)] p-6 md:p-10 cursor-pointer overflow-hidden transition-all duration-300 hover:border-[var(--accent)]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/5 rounded-bl-full -z-0 group-hover:scale-150 transition-transform duration-500" />
                <h3 className="font-oswald text-2xl md:text-3xl font-black uppercase italic mb-2 relative z-10 group-hover:text-[var(--accent)] transition-colors">{clase}</h3>
                <p className="text-xs text-white/40 font-semibold uppercase tracking-widest relative z-10 group-hover:text-white/80 transition-colors mt-auto pt-8">
                  Reservar →
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PLANES (Membresías) ── */}
        <section id="planes" className="py-24 bg-[#000000] border-y border-[var(--borde-dark)]">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-20">
              <h2 className="font-oswald text-5xl md:text-6xl font-black uppercase italic mb-4">Elegí tu pase</h2>
              <p className="text-white/50 max-w-2xl mx-auto font-medium">Invertí en vos mismo. Pagás menos de lo que te sale una salida el finde.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {PLANES.map((plan, i) => (
                <div 
                  key={plan.id} 
                  className={`bg-[#09090B] border p-8 md:p-10 flex flex-col h-full relative transition-transform duration-300 hover:-translate-y-2 ${
                    plan.destacado ? 'border-[var(--accent)] shadow-[0_0_40px_rgba(225,255,1,0.05)] scale-105 z-10' : 'border-[var(--borde-dark)]'
                  }`}
                >
                  {plan.tag && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--accent)] text-black text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1 skew-x-[-10deg]">
                      <span className="inline-block skew-x-[10deg]">{plan.tag}</span>
                    </div>
                  )}
                  
                  <h3 className="font-oswald text-3xl font-black uppercase italic mb-2">{plan.nombre}</h3>
                  <p className="text-xs text-white/50 mb-8 h-8">{plan.descripcion}</p>
                  
                  <div className="mb-8">
                    <span className={`text-5xl font-black font-oswald italic ${plan.destacado ? 'text-[var(--accent)]' : 'text-white'}`}>{fmt(plan.precio)}</span>
                    <span className="text-sm text-white/40 ml-2 font-bold uppercase">{plan.periodo}</span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm font-medium text-white/70">
                        <svg className="w-5 h-5 text-[var(--accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => {
                      const msg = `Hola! Quiero inscribirme al plan *${plan.nombre}* (${fmt(plan.precio)}). ¿Qué medios de pago manejan?`;
                      window.open(buildWhatsAppMessage([], defaultNegocio, msg), '_blank');
                    }}
                    className={`w-full py-4 uppercase font-black tracking-widest text-[13px] skew-x-[-10deg] transition-all ${
                      plan.destacado ? 'bg-[var(--accent)] text-black hover:brightness-110' : 'bg-white/10 text-white hover:bg-[var(--accent)] hover:text-black'
                    }`}
                  >
                    <span className="inline-block skew-x-[10deg]">Unite Hoy</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── INSTALACIONES (Galería) ── */}
        {galleryImages.length > 0 && (
          <section id="instalaciones" className="py-24 bg-[#09090B] border-y border-[var(--borde-dark)]">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
              <div className="mb-16">
                <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] mb-2">El Espacio</p>
                <h2 className="font-oswald text-5xl md:text-6xl font-black uppercase italic">Nuestras Instalaciones</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages.map((img: any, i: number) => (
                  <div key={i} className={`group overflow-hidden border border-[var(--borde-dark)] hover:border-[var(--accent)] transition-colors relative ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                    <img src={img.url} alt={`Instalación ${i}`} className="w-full h-full object-cover aspect-square grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute inset-0 border-4 border-transparent group-hover:border-[var(--accent)] transition-colors duration-300 pointer-events-none" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── ENTRENADORES ── */}
        <section id="entrenadores" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="mb-16">
            <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Staff</p>
            <h2 className="font-oswald text-5xl md:text-6xl font-black uppercase italic">Tus Mentores</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ENTRENADORES.map((coach: any, i: number) => (
              <div key={i} className="group bg-[#18181B] border border-[var(--borde-dark)] overflow-hidden">
                <div className="aspect-[4/5] bg-[#27272A] relative overflow-hidden">
                  {coach.imagen ? (
                    <img src={coach.imagen} alt={coach.nombre} className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full diagonal-stripes opacity-30 group-hover:scale-110 transition-transform duration-700" />
                  )}
                  <div className="absolute inset-0 border-4 border-transparent group-hover:border-[var(--accent)] transition-colors duration-300 z-10 pointer-events-none" />
                </div>
                <div className="p-6 relative">
                  <h3 className="font-oswald text-3xl font-black uppercase italic mb-1">{coach.nombre}</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">{coach.especialidad}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TIENDA / PRODUCTOS ── */}
        <section id="tienda" className="py-24 bg-[#000000] border-t border-[var(--borde-dark)]">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Suplementación & Accesorios</p>
                <h2 className="font-oswald text-5xl md:text-6xl font-black uppercase italic">Pro Shop</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PRODUCTOS.map((prod) => (
                <div key={prod.id} className="bg-[#09090B] border border-[var(--borde-dark)] p-6 hover:border-[var(--accent)] transition-colors flex flex-col group">
                  <div className="text-5xl mb-6 bg-[#18181B] w-16 h-16 flex items-center justify-center rounded-lg group-hover:bg-[var(--accent)]/10 transition-colors">
                    {prod.icono}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">{prod.categoria}</span>
                  <h3 className="font-oswald text-xl font-bold uppercase mb-2 leading-tight">{prod.nombre}</h3>
                  <p className="text-xs text-white/50 mb-6 flex-1">{prod.descripcion}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--borde-dark)] mt-auto">
                    <span className="font-oswald text-2xl font-black text-[var(--accent)]">{fmt(prod.precio)}</span>
                    <button 
                      onClick={() => handleAddProduct(prod)}
                      className="w-10 h-10 bg-white/5 flex items-center justify-center hover:bg-[var(--accent)] hover:text-black transition-colors"
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER / CONTACTO ── */}
        <footer className="bg-[#09090B] py-20 px-6 md:px-12 border-t border-[var(--accent)] relative overflow-hidden">
          <div className="absolute inset-0 diagonal-stripes opacity-20 pointer-events-none" />
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
            
            <div>
              <span className="font-oswald text-4xl font-black uppercase tracking-widest text-white italic block mb-6">
                {negocio?.name ?? "IRON GYM"}
              </span>
              <p className="font-medium text-white/50 text-sm max-w-sm mb-8">
                El entorno que te obliga a mejorar. No somos un gimnasio comercial, somos un centro de alto rendimiento para todos.
              </p>
              <div className="flex gap-4">
                {layoutConfig.instagram && (
                  <a href={`https://instagram.com/${layoutConfig.instagram.replace('@','')}`} className="w-12 h-12 bg-white/5 flex items-center justify-center hover:bg-[var(--accent)] hover:text-black transition-colors">
                    IG
                  </a>
                )}
                {negocio?.whatsapp && (
                  <a href={`https://wa.me/${negocio.whatsapp.replace(/\D/g,'')}`} className="w-12 h-12 bg-white/5 flex items-center justify-center hover:bg-[var(--accent)] hover:text-black transition-colors">
                    WA
                  </a>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-oswald text-2xl font-black uppercase italic mb-6">Horarios</h4>
              <div className="space-y-4 text-sm font-medium">
                {layoutConfig.hours ? (
                  Object.entries(layoutConfig.hours).map(([day, data]: [string, any]) => (
                    <div key={day} className="flex justify-between border-b border-white/10 pb-2">
                      <span className="capitalize text-white/60">{day}</span>
                      <span className="text-[var(--accent)]">{data.open ? `${data.from} - ${data.to}` : 'Cerrado'}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/60">Lunes a Viernes</span><span className="text-[var(--accent)] font-bold">06:00 - 23:00</span></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/60">Sábados</span><span className="text-[var(--accent)] font-bold">08:00 - 18:00</span></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-white/60">Domingos</span><span className="text-white/30 font-bold">Cerrado</span></div>
                  </>
                )}
              </div>
              <div className="mt-8">
                 <OpenNowBadge hours={layoutConfig.hours} />
              </div>
            </div>

            <div>
              <h4 className="font-oswald text-2xl font-black uppercase italic mb-6">Ubicación</h4>
              <div className="space-y-4 text-sm font-medium text-white/60">
                {negocio?.address && <p>{negocio.address}</p>}
                {negocio?.phone && <p>Tel: {negocio.phone}</p>}
                {negocio?.email && <p>Email: {negocio.email}</p>}
              </div>
              {layoutConfig.mapUrl && (
                <div className="mt-8 h-32 w-full border border-white/10 grayscale hover:grayscale-0 transition-all">
                  <iframe src={layoutConfig.mapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" />
                </div>
              )}
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto pt-10 mt-16 border-t border-white/10 text-center relative z-10">
            <p className="font-bold text-[10px] uppercase tracking-widest text-white/30">
              © {new Date().getFullYear()} {negocio?.name || "IRON GYM"}. POTENCIADO POR ANTIGRAVITY.
            </p>
          </div>
        </footer>

        {/* ── FLOATING CART BUTTON ── */}
        {totalItems > 0 && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setCartOpen(true)}
              className="bg-[var(--accent)] text-black px-6 py-4 flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_40px_rgba(225,255,1,0.2)] skew-x-[-10deg]"
            >
              <div className="bg-black text-white w-8 h-8 flex items-center justify-center font-black skew-x-[10deg]">
                {totalItems}
              </div>
              <span className="font-oswald uppercase font-black text-lg skew-x-[10deg]">Ver Pedido</span>
            </button>
          </div>
        )}

        {/* ── MODALS ── */}
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
    </>
  );
}