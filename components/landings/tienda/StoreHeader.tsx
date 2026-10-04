import React from "react";
import { StoreShipping } from "@/lib/types";
import { Search, ShoppingBag, X, PhoneCall, Truck, Sparkles } from "lucide-react";

export interface StoreHeaderProps {
  storeName: string;
  storeTagline: string;
  logoUrl?: string | null;
  primaryColor: string;
  enviosConfig: StoreShipping;
  merchantPhone: string;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  cartTotalQty: number;
  onOpenCart: () => void;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  storeName,
  storeTagline,
  logoUrl,
  primaryColor,
  enviosConfig,
  merchantPhone,
  searchQuery,
  onSearchChange,
  cartTotalQty,
  onOpenCart,
}) => {
  const cleanPhone = merchantPhone.replace(/\D/g, "");

  return (
    <>
      {/* ── Top Notification / Free Shipping Promo Bar ── */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-indigo-950/60 border-b border-white/5 py-2 px-4 text-center text-xs font-medium text-indigo-200">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{enviosConfig.textoEnvio || "Envíos a todo el país • Compra 100% segura por WhatsApp"}</span>
          {enviosConfig.envioGratisDesde ? (
            <span className="hidden sm:inline-block font-bold text-emerald-300">
              • ¡Envío gratis desde ${Number(enviosConfig.envioGratisDesde).toLocaleString("es-AR")}!
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Main Sticky Header ── */}
      <header className="sticky top-0 z-40 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo & Store Identity */}
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border border-white/10 shadow-lg shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shrink-0"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, #8B5CF6)` }}
              >
                {storeName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black text-white tracking-tight truncate">
                  {storeName}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Tienda Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                {storeTagline}
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar productos, talles, categorías..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions: WhatsApp Consultas & Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-semibold text-xs transition-all"
                title="Consultas por WhatsApp"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                <span>Consultas</span>
              </a>
            )}

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 cursor-pointer"
              style={{
                background: cartTotalQty > 0 ? `linear-gradient(135deg, ${primaryColor}, #8B5CF6)` : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              aria-label="Ver carrito"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              {cartTotalQty > 0 && (
                <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-white text-slate-900 text-xs font-black shadow-md">
                  {cartTotalQty}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </header>
    </>
  );
};
