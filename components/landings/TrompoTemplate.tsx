"use client";

import React, { useState } from "react";
import { Lilita_One, Nunito } from "next/font/google";
import { MapPin, Clock, Phone, Flame, ShoppingBag, Utensils, Sparkles } from "lucide-react";
import LoyaltyCard from "@/components/ui/LoyaltyCard";

const lilita = Lilita_One({ weight: "400", subsets: ["latin"], display: "swap" });
const nunito = Nunito({ subsets: ["latin"], display: "swap" });

interface TrompoTemplateProps {
  negocio: any;
  businessId?: string;
  sections?: any[];
  isPreview?: boolean;
}

export default function TrompoTemplate({ negocio, businessId }: TrompoTemplateProps) {
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [orderMode, setOrderMode] = useState<"recoger" | "aqui">("recoger");

  const cfg = negocio?.layoutConfig || {};
  const products =
    (cfg.menuCategorias && cfg.menuCategorias[0]?.products) ||
    cfg.services || [
      { id: "1", name: "Orden Tacos al Pastor (5 pzas)", price: 85, description: "Carne adobada en trompo con piña, cilantro y cebolla recién picada." },
      { id: "2", name: "Gringa Especial con Queso", price: 60, description: "Doble tortilla de harina, pastor doradito y queso Oaxaca derretido." },
      { id: "3", name: "Orden de Suadero Confitado (5 pzas)", price: 90, description: "Suave y jugoso, dorado a la plancha con limón y salsa verde." },
      { id: "4", name: "Quesataco de Birria con Consomé", price: 75, description: "Tortilla doradita en grasa de birria con queso fundido y consomé." },
      { id: "5", name: "Alambre Pastor con Tocino", price: 140, description: "Pastor, tocino, morrones y queso. Incluye 10 tortillas calientes." },
      { id: "6", name: "Agua de Horchata / Jamaica (1L)", price: 40, description: "100% natural, bien fría con canela y hielo." },
    ];

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[id] > 1) updated[id] -= 1;
      else delete updated[id];
      return updated;
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((prod: any) => String(prod.id) === String(id));
    return sum + (p?.price || 0) * qty;
  }, 0);

  const handleOrderWhatsApp = () => {
    const lines = Object.entries(cart).map(([id, qty]) => {
      const p = products.find((prod: any) => String(prod.id) === String(id));
      return `• ${qty}x ${p?.name || "Orden"} ($${(p?.price || 0) * qty} MXN)`;
    });

    const modeText = orderMode === "recoger" ? "Para pasar a recoger" : "Para comer aquí en el local";
    const msg =
      `🌮 *¡Buenas noches ${negocio?.name || "Tacos"}! Quiero hacer un pedido:*\n\n` +
      `${lines.join("\n")}\n\n` +
      `💰 *TOTAL ESTIMADO:* $${totalPrice} MXN\n` +
      `🛵 *Modalidad:* ${modeText}\n\n` +
      `¿En cuánto tiempo queda listo para pasar? ¡Muchas gracias!`;

    const cleanPhone = (negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className={`min-h-[100dvh] bg-[#141212] text-white ${nunito.className} pb-[calc(4rem+env(safe-area-inset-bottom,0px))]`}>
      {/* ─── BARRA SUPERIOR PROMO ─── */}
      <div className="bg-[#D32F2F] text-amber-200 py-2 px-4 text-center text-xs sm:text-sm font-black tracking-wider uppercase flex items-center justify-center gap-2">
        <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
        <span>¡Trompo al Pastor al momento! Salsas artesanales y tortillas calientes</span>
      </div>

      {/* ─── HERO TAQUERO ─── */}
      <header className="relative py-16 sm:py-24 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-extrabold uppercase tracking-widest mb-6">
          <Utensils className="w-4 h-4" />
          <span>Taquería Tradicional de Barrio</span>
        </div>

        <h1 className={`${lilita.className} text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 uppercase leading-none`}>
          {cfg.heroTitle || negocio?.name || "TACOS EL TROMPO"}
        </h1>

        <p className="text-base sm:text-xl text-zinc-300 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
          {cfg.heroSubtitle ||
            "Pastor doradito con piña, suadero suave confitado, gringas bien servidas y las mejores salsas de la zona."}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="#menu"
            className={`${lilita.className} text-lg px-8 py-4 rounded-2xl bg-[#D32F2F] hover:bg-[#b71c1c] text-white shadow-[0_10px_30px_rgba(211,47,47,0.5)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Ver Menú y Ordenar</span>
          </a>
          <a
            href={`https://wa.me/${(negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent("¡Buenas! ¿Tienen servicio hoy?")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${lilita.className} text-lg px-8 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 transition-all flex items-center gap-2`}
          >
            <Phone className="w-5 h-5 text-green-500" />
            <span>WhatsApp Directo</span>
          </a>
        </div>
      </header>

      {/* ─── MENÚ VISUAL DE ÓRDENES ─── */}
      <section id="menu" className="py-16 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto border-t border-zinc-800">
        <div className="text-center mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-[#FFC107]">Recién salidos del comal</span>
          <h2 className={`${lilita.className} text-3xl sm:text-5xl font-bold text-white uppercase mt-1`}>
            Nuestras Especialidades
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p: any) => {
            const count = cart[p.id] || 0;
            return (
              <div
                key={p.id}
                className="bg-[#1C1A1A] border border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all duration-300 shadow-xl group"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className={`${lilita.className} text-xl text-white tracking-wide`}>{p.name}</h3>
                    <span className={`${lilita.className} text-xl text-[#FFC107] font-bold`}>
                      ${p.price} <span className="text-xs font-sans text-zinc-400">MXN</span>
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6">{p.description}</p>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  {count === 0 ? (
                    <button
                      onClick={() => addToCart(p.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#D32F2F]/20 hover:bg-[#D32F2F] text-amber-300 hover:text-white font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                    >
                      <span>+ Agregar a la orden</span>
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-between bg-zinc-900 rounded-xl p-1 border border-zinc-700">
                      <button
                        onClick={() => removeFromCart(p.id)}
                        className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center font-bold text-lg"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-amber-400 text-sm">
                        {count} orden{count > 1 ? "es" : ""}
                      </span>
                      <button
                        onClick={() => addToCart(p.id)}
                        className="w-8 h-8 rounded-lg bg-[#D32F2F] hover:bg-red-700 text-white flex items-center justify-center font-bold text-lg"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── PROGRAMA DE FIDELIZACIÓN (SELLOS) ─── */}
      {cfg.loyaltyEnabled !== false && businessId && (
        <section className="py-16 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto border-t border-zinc-800">
          <LoyaltyCard
            businessId={businessId}
            businessName={negocio?.name || "Tacos El Trompo"}
            accentColor="#FFC107"
            theme="dark"
            initialGoal={cfg.loyaltyGoal || 6}
            initialReward={cfg.loyaltyReward || "¡Gringa o bebida gratis en tu 6ta orden!"}
          />
        </section>
      )}

      {/* ─── HORARIOS Y UBICACIÓN ─── */}
      <footer className="py-16 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto border-t border-zinc-800 text-zinc-400 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <h4 className={`${lilita.className} text-xl text-white mb-4 uppercase`}>Horario Nocturno</h4>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#FFC107] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Miércoles a Domingo</p>
                <p>6:30 PM — 3:00 AM</p>
                <p className="text-xs text-zinc-500 mt-1">Lunes y Martes cerrado para descanso del personal.</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className={`${lilita.className} text-xl text-white mb-4 uppercase`}>Ubicación</h4>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#D32F2F] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">{negocio?.address || "Av. Cuauhtémoc 456, Col. Narvarte, CDMX"}</p>
                <p className="text-xs text-zinc-500 mt-1">Servicio para comer en local o pasar a recoger en coche.</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className={`${lilita.className} text-xl text-white mb-4 uppercase`}>Contacto</h4>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">WhatsApp para pedidos rápidos</p>
                <p>{negocio?.phone || negocio?.whatsapp || "55 1234 5678"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-zinc-900 text-xs text-zinc-600">
          © {new Date().getFullYear()} {negocio?.name || "Taquería El Trompo"}. Sabor tradicional mexicano.
        </div>
      </footer>

      {/* ─── BARRA FLOTANTE DE CHECKOUT (MÓVIL / ESCRITORIO) ─── */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-black via-black/90 to-transparent z-50">
          <div className="max-w-2xl mx-auto bg-[#D32F2F] text-white p-4 rounded-2xl shadow-[0_10px_40px_rgba(211,47,47,0.8)] border border-amber-400/30 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-200">
                {totalItems} platillo{totalItems > 1 ? "s" : ""} en tu orden
              </p>
              <p className={`${lilita.className} text-2xl font-bold`}>
                ${totalPrice} <span className="text-sm font-sans text-amber-100">MXN</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={orderMode}
                onChange={(e) => setOrderMode(e.target.value as any)}
                className="bg-black/40 text-white text-xs font-bold rounded-xl px-2 py-2.5 border border-white/20 focus:outline-none"
                style={{ fontSize: "16px" }}
              >
                <option value="recoger">🛵 Pasar a recoger</option>
                <option value="aqui">🍽️ Comer aquí</option>
              </select>

              <button
                onClick={handleOrderWhatsApp}
                className={`${lilita.className} text-base bg-[#25D366] hover:bg-green-600 text-white py-2.5 px-5 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center gap-1.5`}
              >
                <span>Mandar WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
