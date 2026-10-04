"use client";

import React, { useState } from "react";
import { BusinessDataContract } from "@/lib/templates/contract";
import { ShoppingBag, X, MessageCircle, ArrowRight, Eye, Sparkles } from "lucide-react";

export interface TemplateProps {
  data: BusinessDataContract;
  bookingElement?: React.ReactNode;
}

interface HotspotItem {
  id: string;
  name: string;
  price: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  image?: string;
}

export default function LookbookTemplate({ data }: TemplateProps) {
  const { identity, contact, branding, hero, services, gallery } = data;
  const primary = branding.primaryColor || "#6366F1";
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);

  const cleanPhone = contact.whatsapp ? contact.whatsapp.replace(/\D/g, "") : null;

  // Generate demo/hotspot items from services or gallery
  const editorialItems = services.slice(0, 6).map((s, idx) => ({
    id: s.id,
    name: s.name,
    price: s.price || "18500",
    image: s.image || (gallery[idx] && gallery[idx].image) || hero.image,
    description: s.description || "Confección de alta gama, edición limitada.",
    x: 35 + ((idx * 20) % 40),
    y: 40 + ((idx * 15) % 35),
  }));

  return (
    <div className="min-h-screen bg-[#06080D] text-slate-100 font-serif selection:bg-purple-500/30 selection:text-white pb-20">
      {/* ── TOP EDITORIAL MASTHEAD ── */}
      <header className="border-b border-white/10 px-6 py-6 text-center space-y-2 max-w-7xl mx-auto">
        <span className="text-[11px] font-sans font-bold tracking-[0.3em] uppercase text-slate-400">
          Volumen Editorial • Colección
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase">
          {identity.name}
        </h1>
        <p className="text-xs sm:text-sm font-sans text-slate-400 max-w-md mx-auto">
          {identity.tagline || "Fotografía, estilo y piezas esenciales seleccionadas."}
        </p>
      </header>

      {/* ── HERO COVER STORY ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="relative rounded-3xl overflow-hidden aspect-16/9 sm:aspect-21/9 border border-white/10 shadow-2xl">
          {hero.image ? (
            <img
              src={hero.image}
              alt={hero.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-12">
            <span className="text-xs font-sans font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Lookbook Exclusivo
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white max-w-2xl leading-tight">
              {hero.title}
            </h2>
            <p className="text-xs sm:text-sm font-sans text-slate-300 max-w-xl mt-2 leading-relaxed">
              {hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* ── MASONRY EDITORIAL GALLERY WITH SHOPPABLE HOTSPOTS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-lg font-bold font-sans text-white uppercase tracking-wider">
            Capítulo I — Selecciones Destacadas
          </h3>
          <span className="text-xs font-sans text-slate-400">Toca los puntos para comprar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {editorialItems.map((item, idx) => (
            <div
              key={item.id}
              className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 aspect-4/5 shadow-xl"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}

              {/* Shoppable Hotspot Pin */}
              <button
                type="button"
                onClick={() => setSelectedHotspot(item)}
                className="absolute z-10 w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl transition-transform active:scale-90 hover:scale-110 cursor-pointer"
                style={{
                  top: `${item.y}%`,
                  left: `${item.x}%`,
                  transform: "translate(-50%, -50%)",
                }}
                title={`Ver ${item.name}`}
              >
                <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-70 pointer-events-none" />
                <ShoppingBag className="w-3.5 h-3.5 relative z-10" />
              </button>

              {/* Bottom Card Title Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between font-sans">
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{item.name}</h4>
                  <span className="text-xs text-indigo-300 font-bold tabular-nums">
                    ${item.price}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHotspot(item)}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Shop
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOTSPOT DETAIL DRAWER / MODAL ── */}
      {selectedHotspot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedHotspot(null)}
        >
          <div
            className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-3xl p-6 shadow-2xl relative space-y-4 font-sans animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Shop the Look
                </span>
                <h3 className="text-lg font-black text-white">{selectedHotspot.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHotspot(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedHotspot.image && (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/5">
                <img
                  src={selectedHotspot.image}
                  alt={selectedHotspot.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Precio</span>
                <span className="text-2xl font-black text-white tabular-nums">
                  ${selectedHotspot.price}
                </span>
              </div>

              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola! Quiero comprar ${selectedHotspot.name} del Lookbook.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-xl flex items-center gap-2 transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Comprar por WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="max-w-7xl mx-auto px-6 pt-12 border-t border-white/10 text-center font-sans text-xs text-slate-500">
        <p>© {new Date().getFullYear()} {identity.name}. Publicación Editorial.</p>
      </footer>
    </div>
  );
}
