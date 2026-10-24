"use client";

import React, { useState } from "react";
import { Utensils, Flame, Clock, MapPin, ShoppingBag, Beer, Sparkles, Plus, Minus } from "lucide-react";
import LoyaltyCard from "@/components/ui/LoyaltyCard";

interface CantinaGourmetTemplateProps {
  negocio: any;
  businessId?: string;
  sections?: any[];
  isPreview?: boolean;
}

export default function CantinaGourmetTemplate({ negocio, businessId }: CantinaGourmetTemplateProps) {
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [spiceLevel, setSpiceLevel] = useState<"suave" | "medio" | "fuego">("medio");
  const [orderType, setOrderType] = useState<"delivery" | "pickup" | "mesa">("delivery");

  const cfg = negocio?.layoutConfig || {};
  const colors = cfg.colors || {};
  const primaryColor = colors.primary || "#F59E0B"; // Ámbar dorado artesanal
  const secondaryColor = colors.secondary || "#EF4444"; // Rojo brasa / fuego
  const bgColor = colors.background || "#0D1117"; // Dark industrial gastrobar
  const textColor = colors.text || "#F3F4F6";

  const defaultDishes = [
    {
      id: "cg1",
      name: "Smash Burger Trufada Doble Carne",
      price: 235,
      category: "burgers",
      tag: "Best Seller",
      description: "Doble carne angus de 120g smash con costra caramelizada, queso cheddar añejo, mermelada de tocino al mezcal y mayonesa de trufa negra.",
    },
    {
      id: "cg2",
      name: "Tacos de Rib Eye con Tuétano Rostizado (3 pzas)",
      price: 285,
      category: "tacos_gourmet",
      tag: "Especialidad de la Casa",
      description: "Rib Eye sellado a las brasas, montado en tortilla de maíz azul nixtamalizada con tuétano horneado, cebollitas cambray y chimichurri tatemado.",
    },
    {
      id: "cg3",
      name: "Boneless Crujientes Mango-Habanero Glaseado",
      price: 195,
      category: "entradas",
      tag: "Para Compartir",
      description: "Pechuga de pollo marinada 24h, empanizado extra crujiente, bañadas en reducción de mango ataulfo con habanero tatemado y aderezo blue cheese.",
    },
    {
      id: "cg4",
      name: "Papas Rústicas con Queso de Cabra & Jamón Serrano",
      price: 175,
      category: "entradas",
      tag: "Gourmet Snack",
      description: "Gajos de papa horneados y fritos con aceite de romero, coronados con crumble de queso de cabra cenizo y lajas de jamón serrano.",
    },
    {
      id: "cg5",
      name: "Cerveza Artesanal IPA Local (355ml)",
      price: 95,
      category: "bebidas",
      tag: "Tap List",
      description: "Cerveza de barril estilo West Coast IPA con notas cítricas, maracuyá y amargor balanceado. 6.5% ABV.",
    },
    {
      id: "cg6",
      name: "Cóctel Ahumado Mezcal Oaxaqueño & Romero",
      price: 160,
      category: "mixologia",
      tag: "Firma Nocturna",
      description: "Mezcal espadín artesanal infusionado con infusión de toronja rosa, jarabe de agave orgánico, escarchado de sal de gusano y romero flameado.",
    },
  ];

  const dishes = (cfg.services && cfg.services.length > 0) ? cfg.services : defaultDishes;
  const phoneClean = (negocio?.whatsapp || negocio?.phone || "").replace(/\D/g, "");

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const copy = { ...prev };
      if (copy[id] > 1) copy[id] -= 1;
      else delete copy[id];
      return copy;
    });
  };

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const dish = dishes.find((d: any) => String(d.id) === String(id));
    return sum + (dish?.price || 0) * qty;
  }, 0);

  const handleSendOrder = () => {
    const lines = Object.entries(cart).map(([id, qty]) => {
      const d = dishes.find((item: any) => String(item.id) === String(id));
      return `• ${qty}x ${d?.name || "Platillo"} ($${(d?.price || 0) * qty} MXN)`;
    });

    const spiceLabel = spiceLevel === "fuego" ? "🔥 FUEGO SANTO (Muy picante)" : spiceLevel === "medio" ? "🌶️ MEDIO (Sabor bravito)" : "🟢 SUAVE (Sin chile)";
    const modeLabel = orderType === "delivery" ? "🛵 Delivery a Domicilio" : orderType === "pickup" ? "🛍️ Para recoger en local" : "🍽️ Mesa / Consumo en local";

    const msg = `¡Buenas noches *${negocio?.name || "Cantina Gourmet"}*! 🍔🍻 Quisiera hacer el siguiente pedido:\n\n${lines.join("\n")}\n\n*Modalidad:* ${modeLabel}\n*Nivel de picante salsas:* ${spiceLabel}\n*Total estimado:* $${totalPrice} MXN\n\n¿Me confirman tiempo de preparación y cuenta para transferir/efectivo?`;

    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div
      className="min-h-[100dvh] font-sans selection:bg-amber-500/30 transition-colors duration-300 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        "--primary": primaryColor,
        "--secondary": secondaryColor,
      } as React.CSSProperties}
    >
      {/* ─── ANNOUNCEMENT BAR GOURMET ─── */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-red-950 border-b border-amber-500/30 py-2.5 px-4 text-center text-xs tracking-wider uppercase font-bold text-amber-300 flex items-center justify-center gap-2">
        <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>Gastrobar & Dark Kitchen • Brasas, Mixología y Smash Burgers • Envíos Rápidos</span>
      </div>

      {/* ─── HERO GASTROBAR NOCTURNO ─── */}
      <header className="relative py-14 px-6 sm:px-12 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-slate-950 mb-6 shadow-2xl shadow-amber-500/30">
          <Utensils className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black tracking-widest uppercase mb-3">
          <Sparkles className="w-3 h-3" />
          <span>{negocio?.niche || "Gastrobar & Dark Kitchen Artesanal"}</span>
        </div>

        <h1 className="text-3xl sm:text-6xl font-black tracking-tight mb-4 text-white uppercase">
          {negocio?.name || "La Cantina Smash & Brasas"}
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto mb-6 font-light leading-relaxed">
          {negocio?.description || "Ingredientes de origen, carne selecta sellada a fuego vivo, mezcales de autor y cervezas bien frías para disfrutar en mesa o recibir caliente en tu puerta."}
        </p>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mb-8 text-xs font-bold text-slate-300">
          <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center gap-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>30-45 Min Preparación</span>
          </div>
          <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center gap-1">
            <Beer className="w-4 h-4 text-amber-400" />
            <span>Mixología & Cervezas</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center gap-1">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>{negocio?.address || "Zona Gastronómica"}</span>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl mb-8">
          {(["delivery", "pickup", "mesa"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setOrderType(m)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                orderType === m
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {m === "delivery" ? "🛵 Para Domicilio" : m === "pickup" ? "🛍️ Para Recoger" : "🍽️ En el Local"}
            </button>
          ))}
        </div>
      </header>

      {/* ─── MENÚ GOURMET / PLATILLOS ─── */}
      <section className="py-8 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wide">Platillos de Autor & Brasas</h2>
            <p className="text-xs text-slate-400 mt-1">Selecciona tus favoritos para armar tu comanda directa por WhatsApp</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400">Salsas:</span>
            <select
              value={spiceLevel}
              onChange={(e) => setSpiceLevel(e.target.value as any)}
              className="bg-transparent text-amber-400 font-bold focus:outline-none"
              style={{ fontSize: "16px" }}
            >
              <option value="suave" className="bg-slate-900 text-white">Suave</option>
              <option value="medio" className="bg-slate-900 text-white">Medio</option>
              <option value="fuego" className="bg-slate-900 text-white">Fuego Santo 🔥</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dishes.map((dish: any) => {
            const count = cart[dish.id] || 0;
            return (
              <div
                key={dish.id}
                className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-white text-base leading-snug">{dish.name}</h3>
                    <span className="text-amber-400 font-black text-lg whitespace-nowrap">
                      ${dish.price} <span className="text-xs font-normal text-slate-400">MXN</span>
                    </span>
                  </div>

                  {dish.tag && (
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
                      {dish.tag}
                    </span>
                  )}

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{dish.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500 font-mono">Preparación al instante</span>
                  <div className="flex items-center gap-2">
                    {count > 0 ? (
                      <div className="flex items-center gap-2 bg-slate-800/80 rounded-xl p-1 border border-slate-700">
                        <button
                          onClick={() => removeFromCart(dish.id)}
                          className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white active:scale-90"
                          aria-label="Restar platillo"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-white text-sm">{count}</span>
                        <button
                          onClick={() => addToCart(dish.id)}
                          className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center active:scale-90"
                          aria-label="Sumar platillo"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(dish.id)}
                        className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 hover:border-transparent font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── PROGRAMA DE LEALTAD GOURMET ─── */}
      <section className="py-8 px-4 sm:px-8 max-w-xl mx-auto">
        <LoyaltyCard
          businessId={businessId || negocio?.id || "cantina-demo"}
          businessName={negocio?.name || "Cantina Gourmet"}
          accentColor={primaryColor}
          initialGoal={6}
          initialReward="Smash Burger de Cortesía o Cóctel Ahumado"
        />
      </section>

      {/* ─── POLÍTICA DE SERVICIO & HORARIOS ─── */}
      <footer className="py-8 px-4 text-center border-t border-slate-800/60 max-w-3xl mx-auto text-xs text-slate-400 space-y-2">
        <p className="font-semibold text-slate-300">
          📍 {negocio?.address || "Atención directa en barra y entregas por mensajero privado"}
        </p>
        <p className="text-[11px]">
          Horarios de cocina: Miércoles a Domingo de 1:00 PM a 11:30 PM • Pagos en efectivo, transferencia SPEI o tarjeta al repartidor.
        </p>
      </footer>

      {/* ─── STICKY ORDER BAR PARA MÓVILES (WHATSAPP COMANDA) ─── */}
      {totalItems > 0 && (
        <div className="fixed bottom-3 inset-x-3 sm:max-w-md sm:mx-auto z-50">
          <button
            onClick={handleSendOrder}
            className="w-full bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-black p-4 rounded-2xl shadow-2xl shadow-amber-500/40 flex items-center justify-between transition-all transform active:scale-95"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center text-sm font-black">
                {totalItems}
              </span>
              <div className="text-left">
                <span className="block text-xs uppercase tracking-wider font-extrabold text-slate-900">Pedir por WhatsApp</span>
                <span className="text-[11px] text-slate-950 font-medium">{orderType === "delivery" ? "Para Domicilio" : "Para Recoger"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black">${totalPrice} MXN</span>
              <ShoppingBag className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
