"use client";

import React, { useState, useEffect, useMemo, useId, useCallback } from "react";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import BookingForm from "@/app/[subdomain]/BookingForm";
import OpenNowBadge from "../ui/OpenNowBadge";
import VideoSection from "../ui/VideoSection";
import { formatSocialUrl } from "@/components/landings/biolinks/utils";

const fontSora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-menu-heading",
  display: "swap",
});

const fontJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-menu-body",
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

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// ─── TYPES ───
export interface MenuProduct {
  id: string;
  categoriaId: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string;
  emoji: string;
  tags?: string[];
  disponible: boolean;
  destacado: boolean;
}

export interface MenuCategoria {
  id: string;
  nombre: string;
  emoji: string;
  imagen?: string;
  orden: number;
}

// ─── DEMO DATA ───
const DEMO_CATEGORIES: MenuCategoria[] = [
  { id: "destacados", nombre: "Destacados", emoji: "⭐", orden: 1 },
  { id: "principales", nombre: "Principales", emoji: "🍽️", orden: 2 },
  { id: "bebidas", nombre: "Bebidas", emoji: "🥤", orden: 3 },
  { id: "postres", nombre: "Postres", emoji: "🍰", orden: 4 },
];

const DEMO_PRODUCTS: MenuProduct[] = [
  { id: "1", categoriaId: "destacados", nombre: "Hamburguesa Doble Smash", descripcion: "Doble medallón 100g, cheddar fundido, bacon crocante y salsa emulsionada en pan brioche artesanal.", precio: 6500, emoji: "🍔", tags: ["⭐ Popular"], disponible: true, destacado: true },
  { id: "2", categoriaId: "principales", nombre: "Pizza Margherita DOP", descripcion: "Salsa de pomodoro san marzano, mozzarella fior di latte y albahaca fresca de huerta orgánica.", precio: 7200, emoji: "🍕", tags: ["🌿 Veggie"], disponible: true, destacado: false },
  { id: "3", categoriaId: "bebidas", nombre: "Limonada Menta & Jengibre", descripcion: "Limonada fresca macerada con menta fresca, jengibre y almíbar orgánico (500ml).", precio: 1500, emoji: "🍋", disponible: true, destacado: false },
  { id: "4", categoriaId: "postres", nombre: "Cheesecake Frutos del Bosque", descripcion: "Base crocante de galleta sablée, crema de queso sedosa y coulis casero de moras y arándanos.", precio: 3200, emoji: "🍰", disponible: true, destacado: true },
  { id: "5", categoriaId: "principales", nombre: "Wrap de Pollo Marinado", descripcion: "Pechuga de pollo a la plancha, hojas verdes, parmesano reggiano y suave aderezo caesar artesanal.", precio: 4500, emoji: "🌯", disponible: false, destacado: false },
];

// ─── PRODUCT CARD COMPONENT ───
function ProductCard({ 
  product, 
  qty, 
  onAdd, 
  onRemove, 
  accent 
}: { 
  product: MenuProduct; 
  qty: number; 
  onAdd: () => void; 
  onRemove: () => void; 
  accent: string;
}) {
  return (
    <div 
      className={`group flex items-start gap-4 p-4 sm:p-5 rounded-3xl border border-[#F1EDE8] bg-white transition-all duration-300 relative overflow-hidden ${
        !product.disponible 
          ? 'opacity-50 grayscale' 
          : 'hover:border-[var(--accent)]/30 hover:shadow-[0_12px_32px_rgba(26,26,26,0.06)] hover:-translate-y-0.5'
      }`} 
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--accent)] opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none" />

      {/* Imagen / Emoji */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0 relative bg-[#FAF6F1] border border-[#F1EDE8]">
        {product.imagen ? (
          <img 
            src={product.imagen} 
            alt={product.nombre} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            loading="lazy" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-500">
            {product.emoji}
          </div>
        )}
        {qty > 0 && (
          <div className="absolute inset-0 ring-2 ring-[var(--accent)] ring-inset rounded-2xl transition-all" />
        )}
        {!product.disponible && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white px-2.5 py-1 rounded-md shadow-sm border border-slate-200">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[96px] justify-between py-0.5">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[#1A1A1A] text-base leading-snug group-hover:text-[var(--accent)] transition-colors">
              {product.nombre}
            </h3>
            {qty > 0 && (
              <span className="bg-[var(--accent)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shrink-0">
                x{qty}
              </span>
            )}
          </div>
          <p className="text-xs text-[#57534E] line-clamp-2 leading-relaxed font-['Plus_Jakarta_Sans'] mb-2.5">
            {product.descripcion}
          </p>
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              {product.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#FAF6F1] border border-[#F1EDE8] text-[#78716C] uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-end mt-auto pt-2">
          <span className="font-['Sora'] font-bold text-lg text-[#1A1A1A] group-hover:text-[var(--accent)] transition-colors">
            ${product.precio}
          </span>
          
          {/* Controles Qty */}
          {product.disponible && (
            <div className="flex items-center gap-2">
              {qty > 0 ? (
                <div className="flex items-center bg-[#FAF6F1] rounded-full border border-[#F1EDE8] p-0.5 relative z-10">
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(); }} 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-sm hover:text-black transition-all font-medium"
                    aria-label={`Quitar una unidad de ${product.nombre}`}
                  >
                    -
                  </button>
                  <span className="font-['Sora'] font-bold text-sm w-6 text-center text-[var(--accent)]">
                    {qty}
                  </span>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onAdd(); }} 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-transform active:scale-95 bg-[var(--accent)] font-medium"
                    aria-label={`Agregar una unidad de ${product.nombre}`}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAdd(); }} 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--accent)] bg-[#FAF6F1] border border-[#F1EDE8] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] shadow-sm transition-all active:scale-95 group/btn relative z-10"
                  aria-label={`Agregar ${product.nombre} al pedido`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform group-hover/btn:rotate-90">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CartFAB({ qty, total, onClick, accent }: { qty: number; total: number; onClick: () => void; accent: string }) {
  const [bouncing, setBouncing] = useState(false);
  
  useEffect(() => {
    if (qty > 0) {
      setBouncing(true);
      const t = setTimeout(() => setBouncing(false), 300);
      return () => clearTimeout(t);
    }
  }, [qty]);

  if (qty === 0) return null;

  return (
    <div 
      className="fixed inset-x-0 px-4 xl:hidden z-40 pointer-events-none flex justify-center"
      style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <button 
        id="cart-fab"
        type="button"
        onClick={onClick}
        aria-label="Ver carrito de compras"
        className={`pointer-events-auto flex items-center shadow-2xl text-white font-['Plus_Jakarta_Sans'] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          bouncing ? 'scale-105' : 'scale-100'
        } ${qty === 1 ? 'rounded-full px-5 py-4 gap-3' : 'rounded-2xl w-full max-w-sm px-5 py-4 justify-between'}`}
        style={{ backgroundColor: accent }}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
            {qty}
          </div>
          {qty > 1 && <span className="font-semibold text-sm">Ver Pedido</span>}
        </div>
        <div className="flex items-center gap-2">
          {qty === 1 && <span className="font-semibold text-sm">Pedido</span>}
          <span className="font-['Sora'] font-bold tracking-tight text-base">${total}</span>
        </div>
      </button>
    </div>
  );
}

// ─── MAIN TEMPLATE ───

export default function MenuTemplate(props: { negocio: any; businessId?: string }) {
  const { negocio, businessId } = props;
  
  // Theme & Colors
  const accent = negocio?.accentColor || negocio?.primaryColor || "#E85D04";
  const name = negocio?.name || "Atelier Culinario";
  const tagline = negocio?.tagline || "Sabores artesanales, ingredientes de temporada";
  const hours = negocio?.layoutConfig?.hours;
  const address = negocio?.address || negocio?.layoutConfig?.address || "";
  
  // Configs
  const menuCats = negocio?.layoutConfig?.menuCategorias;
  const rawCats = menuCats || DEMO_CATEGORIES;
  
  const categoriasRaw: MenuCategoria[] = useMemo(() => {
    return rawCats.map((c: any) => ({
      id: String(c.id),
      nombre: c.nombre || c.name || "Categoría",
      emoji: c.emoji || "🍽️",
      imagen: c.imagen || c.imageUrl,
      orden: c.orden || 1,
    }));
  }, [rawCats]);

  const productosRaw: MenuProduct[] = useMemo(() => {
    if (menuCats) {
      return menuCats.flatMap((c: any) => 
        (c.products || []).map((p: any) => ({
          id: String(p.id),
          categoriaId: String(c.id),
          nombre: p.nombre || p.name || "",
          descripcion: p.descripcion || p.description || "",
          precio: Number(p.precio || p.price || 0),
          imagen: p.imagen || p.imageUrl || "",
          emoji: c.emoji || "🍽️",
          tags: p.tags || [],
          disponible: p.disponible ?? true,
          destacado: p.destacado ?? false,
        }))
      );
    }
    return DEMO_PRODUCTS;
  }, [menuCats]);

  const promosRaw = negocio?.layoutConfig?.menuPromos || [];
  const modosDisponibles: string[] = negocio?.layoutConfig?.modosDisponibles || ['local', 'delivery', 'llevar'];
  const deliveryRadio = negocio?.layoutConfig?.deliveryRadio || "Radio de entrega: 3km";
  const reservaMesaActiva = negocio?.layoutConfig?.reservaMesaActiva ?? true;
  
  // State
  const [activeCategory, setActiveCategory] = useState<string>(categoriasRaw[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [modoPedido, setModoPedido] = useState<'local'|'delivery'|'llevar'|'reserva'>(
    (modosDisponibles[0] as any) || 'local'
  );
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutExtra, setCheckoutExtra] = useState("");
  const [checkoutNotas, setCheckoutNotas] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [completedOrderWaUrl, setCompletedOrderWaUrl] = useState<string | null>(null);
  const formId = useId();

  // Cart LocalStorage persistence (avoiding hydration mismatch)
  useEffect(() => {
    setIsMounted(true);
    if (!negocio?.id) return;
    try {
      const saved = localStorage.getItem(`mw_cart_${negocio.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") setCart(parsed);
      }
    } catch {}
  }, [negocio?.id]);

  useEffect(() => {
    if (!isMounted || !negocio?.id) return;
    try {
      localStorage.setItem(`mw_cart_${negocio.id}`, JSON.stringify(cart));
    } catch {}
  }, [cart, negocio?.id, isMounted]);

  // Close cart drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen]);
  
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    productosRaw.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [productosRaw]);

  const filteredProducts = useMemo(() => {
    return productosRaw.filter((p) => {
      const matchSearch = 
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilters = 
        activeFilters.length === 0 || activeFilters.every((f) => p.tags?.includes(f));
      return matchSearch && matchFilters;
    });
  }, [productosRaw, searchQuery, activeFilters]);

  // Derived cart items
  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, qty]) => {
      let p: any = productosRaw.find((x) => x.id === id);
      if (!p) {
        const promo = promosRaw.find((x: any) => x.id === id);
        if (promo) {
          p = {
            id: promo.id,
            nombre: promo.name,
            precio: Number(promo.price || 0),
            imagen: promo.imageUrl,
            emoji: "🔥",
          };
        }
      }
      return p ? { ...p, qty } : null;
    }).filter(Boolean) as (MenuProduct & { qty: number })[];
  }, [cart, productosRaw, promosRaw]);
  
  const cartTotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.precio * item.qty, 0), [cartItems]);
  const cartQty = useMemo(() => cartItems.reduce((acc, item) => acc + item.qty, 0), [cartItems]);

  const toggleFilter = (tag: string) => {
    setActiveFilters((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const updateCart = useCallback((id: string, delta: number) => {
    setCart((prev) => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  }, []);

  const clearCart = () => {
    if (confirm("¿Deseas vaciar el pedido actual?")) setCart({});
  };

  const handleOrder = async () => {
    if (!negocio?.whatsapp) {
      alert("El establecimiento no tiene un número de WhatsApp configurado.");
      return;
    }
    if (cartItems.length === 0) return;
    if (modoPedido === 'local' && !checkoutExtra) {
      alert("Por favor indicá tu número de mesa.");
      return;
    }
    if (modoPedido === 'delivery' && !checkoutExtra) {
      alert("Por favor ingresá tu dirección para el delivery.");
      return;
    }

    setIsOrdering(true);

    try {
      const orderPayload = {
        businessId: businessId || negocio?.id,
        type: modoPedido === 'local' ? 'MESA' : modoPedido === 'delivery' ? 'DELIVERY' : 'TAKEAWAY',
        items: cartItems.map((i) => ({ id: i.id, nombre: i.nombre, qty: i.qty, precio: i.precio })),
        total: cartTotal,
        address: modoPedido === 'delivery' ? checkoutExtra : "",
        tableId: modoPedido === 'local' ? checkoutExtra : null,
        customerName: modoPedido === 'llevar' ? checkoutExtra : "Cliente",
        customerPhone: "",
      };

      if ((businessId || negocio?.id) && businessId !== "demo") {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        }).catch(() => {});
      }

      let header = "";
      if (modoPedido === 'local') header = `🍽️ *Pedido - Mesa ${checkoutExtra}*`;
      if (modoPedido === 'delivery') header = `🛵 *Pedido Delivery*\n📍 Dirección: ${checkoutExtra}`;
      if (modoPedido === 'llevar') header = `🥡 *Pedido para Retirar*${checkoutExtra ? `\n⏰ Horario aprox: ${checkoutExtra}` : ''}`;

      const itemsStr = cartItems.map((i) => `${i.qty}x ${i.nombre} ($${i.precio * i.qty})`).join("\n");
      const notasStr = checkoutNotas ? `\n📝 *Notas:* ${checkoutNotas}` : "";
      const totalStr = `\n💰 *Total:* $${cartTotal}`;

      const finalMsg = `${header}\n\n${itemsStr}${notasStr}\n${totalStr}`;
      const cleanPhone = negocio.whatsapp.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMsg)}`;

      setCompletedOrderWaUrl(whatsappUrl);

      if (typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        window.location.assign(whatsappUrl);
      } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
      
      setCart({});
      setCheckoutExtra("");
      setCheckoutNotas("");
      setIsCartOpen(false);
    } catch (error) {
      console.error(error);
      alert("Hubo un problema al procesar el pedido.");
    } finally {
      setIsOrdering(false);
    }
  };

  // Intersection Observer for scroll spy
  useEffect(() => {
    if (searchQuery || activeFilters.length > 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const catId = entry.target.id.replace('cat-', '');
            setActiveCategory(catId);
            const btn = document.getElementById(`nav-${catId}`);
            if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    categoriasRaw.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categoriasRaw, searchQuery, activeFilters]);

  const renderCartContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-5 border-b border-[#F1EDE8] flex justify-between items-center bg-[#FAF6F1]/60">
        <h3 className="font-['Sora'] font-bold text-xl text-[#1A1A1A]">Tu Pedido</h3>
        {cartQty > 0 && (
          <button 
            type="button"
            onClick={clearCart} 
            className="text-xs font-semibold text-rose-500 hover:underline"
          >
            Vaciar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32 xl:pb-5">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-12">
            <span className="text-5xl grayscale opacity-40">🍽️</span>
            <p className="font-['Plus_Jakarta_Sans'] font-medium text-sm">Tu pedido está vacío</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Items */}
            <div className="space-y-3.5">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF6F1] border border-[#F1EDE8] flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {item.imagen ? (
                      <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" />
                    ) : (
                      item.emoji
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-['Plus_Jakarta_Sans'] font-semibold text-sm text-[#1A1A1A] truncate">{item.nombre}</h4>
                    <p className="font-['Sora'] font-bold text-sm text-[#57534E] mt-0.5">${item.precio}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      type="button"
                      onClick={() => updateCart(item.id, -1)} 
                      className="w-8 h-8 rounded-full bg-[#FAF6F1] border border-[#F1EDE8] text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                      aria-label="Restar 1"
                    >
                      -
                    </button>
                    <span className="font-['Sora'] font-semibold text-sm w-5 text-center">{item.qty}</span>
                    <button 
                      type="button"
                      onClick={() => updateCart(item.id, 1)} 
                      className="w-8 h-8 rounded-full text-white font-bold transition-transform active:scale-95" 
                      style={{ backgroundColor: accent }}
                      aria-label="Sumar 1"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Extras del pedido */}
            <div className="pt-5 border-t border-[#F1EDE8] space-y-4">
              {modoPedido === 'local' && (
                <div>
                  <label htmlFor={`${formId}-mesa`} className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Número de Mesa *
                  </label>
                  <input 
                    id={`${formId}-mesa`}
                    type="text" 
                    value={checkoutExtra} 
                    onChange={(e) => setCheckoutExtra(e.target.value)} 
                    placeholder="Ej: Mesa 12" 
                    className="w-full border border-[#F1EDE8] rounded-xl px-4 py-3 font-['Plus_Jakarta_Sans'] text-sm focus:border-black outline-none transition-colors bg-[#FAF6F1]/30" 
                  />
                </div>
              )}
              {modoPedido === 'delivery' && (
                <div>
                  <label htmlFor={`${formId}-dir`} className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Dirección de Entrega *
                  </label>
                  <input 
                    id={`${formId}-dir`}
                    type="text" 
                    value={checkoutExtra} 
                    onChange={(e) => setCheckoutExtra(e.target.value)} 
                    placeholder="Ej: Av. San Martín 450, Piso 3B" 
                    className="w-full border border-[#F1EDE8] rounded-xl px-4 py-3 font-['Plus_Jakarta_Sans'] text-sm focus:border-black outline-none transition-colors bg-[#FAF6F1]/30" 
                  />
                  <p className="text-[11px] text-[#A8A29E] mt-1.5">{deliveryRadio}</p>
                </div>
              )}
              {modoPedido === 'llevar' && (
                <div>
                  <label htmlFor={`${formId}-takeaway`} className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                    Nombre o Hora estimada
                  </label>
                  <input 
                    id={`${formId}-takeaway`}
                    type="text" 
                    value={checkoutExtra} 
                    onChange={(e) => setCheckoutExtra(e.target.value)} 
                    placeholder="Ej: Retira Carlos en 25 min" 
                    className="w-full border border-[#F1EDE8] rounded-xl px-4 py-3 font-['Plus_Jakarta_Sans'] text-sm focus:border-black outline-none transition-colors bg-[#FAF6F1]/30" 
                  />
                </div>
              )}
              <div>
                <label htmlFor={`${formId}-notas`} className="block text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
                  Notas para la cocina
                </label>
                <textarea 
                  id={`${formId}-notas`}
                  value={checkoutNotas} 
                  onChange={(e) => setCheckoutNotas(e.target.value)} 
                  placeholder="Ej: Sin cebolla, aderezo aparte, etc..." 
                  rows={2} 
                  className="w-full border border-[#F1EDE8] rounded-xl px-4 py-3 font-['Plus_Jakarta_Sans'] text-sm focus:border-black outline-none transition-colors resize-none bg-[#FAF6F1]/30" 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {cartQty > 0 && (
        <div className="p-5 border-t border-[#F1EDE8] bg-white">
          <div className="flex justify-between items-center mb-4">
            <span className="font-['Plus_Jakarta_Sans'] font-medium text-[#78716C] text-sm">Total a pagar</span>
            <span className="font-['Sora'] font-bold text-2xl text-[#1A1A1A]">${cartTotal}</span>
          </div>
          <button 
            type="button"
            onClick={handleOrder} 
            disabled={isOrdering} 
            className="w-full py-4 rounded-xl text-white font-['Plus_Jakarta_Sans'] font-bold text-base flex justify-center items-center gap-2 hover:brightness-110 active:scale-98 transition-all shadow-xl shadow-[var(--accent)]/20 disabled:opacity-50" 
            style={{ backgroundColor: accent }}
          >
            {isOrdering ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Enviar Pedido por WhatsApp"
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`${fontSora.variable} ${fontJakarta.variable} min-h-screen bg-[#FFFBF5] text-[#1A1A1A] font-['Plus_Jakarta_Sans'] selection:bg-[var(--accent)] selection:text-white`}
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {/* ── HEADER HERO ── */}
      <header className="relative pt-12 pb-24 px-4 sm:px-6 md:px-12 rounded-b-[48px] overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 40%, #1a0800))` }}>
        {negocio?.bannerUrl && (
          <>
            <img 
              src={negocio.bannerUrl} 
              alt="Banner del restaurante" 
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay pointer-events-none" 
            />
            <div 
              className="absolute inset-0 bg-black pointer-events-none" 
              style={{ opacity: (negocio?.layoutConfig?.bannerOpacity !== undefined ? negocio.layoutConfig.bannerOpacity : 50) / 100 }} 
            />
          </>
        )}
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col xl:flex-row justify-between items-start gap-8">
          <div className="w-full max-w-2xl text-center xl:text-left">
            <div className="flex justify-center xl:justify-start mb-6">
              {negocio?.logoUrl ? (
                <div className="w-24 h-24 rounded-3xl bg-white/90 backdrop-blur-xl p-2.5 shadow-2xl border border-white/20 flex items-center justify-center">
                  <img src={negocio.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/20 flex items-center justify-center text-4xl">
                  🍽️
                </div>
              )}
            </div>
            
            <div className="inline-flex xl:flex mb-6 justify-center xl:justify-start">
              <OpenNowBadge hours={hours} />
            </div>

            <h1 className="font-['Sora'] text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
              {name}
            </h1>
            <p className="text-white/85 font-medium text-lg lg:text-xl drop-shadow-sm mb-6 leading-relaxed">
              {tagline}
            </p>
          </div>
        </div>
      </header>

      {/* ── MODO DE PEDIDO SELECTOR ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 -mt-10 relative z-20 mb-8">
        {(modosDisponibles.length > 1 || reservaMesaActiva) && (
          <div className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-xl shadow-black/5 border border-[#F1EDE8] flex flex-wrap sm:flex-nowrap gap-2 justify-center">
            {modosDisponibles.map((m: string) => (
              <button 
                type="button"
                key={m} 
                onClick={() => setModoPedido(m as any)}
                className={`flex-1 min-w-[110px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                  modoPedido === m 
                    ? 'bg-[#1A1A1A] text-white shadow-md' 
                    : 'text-[#57534E] hover:bg-[#FAF6F1]'
                }`}
              >
                <span className="text-xl">{m === 'local' ? '🍽️' : m === 'delivery' ? '🛵' : '🥡'}</span>
                <span className="capitalize">{m === 'local' ? 'En el local' : m === 'delivery' ? 'Delivery' : 'Para llevar'}</span>
              </button>
            ))}
            {reservaMesaActiva && (
              <button 
                type="button"
                onClick={() => setModoPedido('reserva')}
                className={`flex-1 min-w-[110px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                  modoPedido === 'reserva' 
                    ? 'bg-[#1A1A1A] text-white shadow-md' 
                    : 'text-[#57534E] hover:bg-[#FAF6F1]'
                }`}
              >
                <span className="text-xl">📅</span>
                <span className="capitalize">Reservar Mesa</span>
              </button>
            )}
          </div>
        )}
      </div>

      {modoPedido === "reserva" && reservaMesaActiva && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 pb-24">
          <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl shadow-black/5 border border-[#F1EDE8]">
            <div className="text-center mb-8">
              <h2 className="font-['Sora'] text-3xl font-bold text-[#1A1A1A] mb-2">Reservá tu mesa</h2>
              <p className="text-[#57534E] text-sm">Completá tus datos para asegurar tu experiencia gastronómica.</p>
            </div>
            <BookingForm 
              businessId={businessId || "demo"} 
              primaryColor={accent} 
              secondaryColor="#1A1A1A" 
              services={["Mesa para 2", "Mesa para 4", "Mesa para 6+"]} 
              theme="light" 
            />
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT: SIDEBAR + CONTENT + CART PANEL ── */}
      <div className={`max-w-7xl mx-auto gap-8 items-start xl:px-4 ${modoPedido === 'reserva' ? 'hidden' : 'flex'}`}>
        
        {/* DESKTOP SIDEBAR (CATEGORÍAS) */}
        <aside className="hidden md:flex flex-col sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto w-56 py-2 px-2 shrink-0 scrollbar-hide gap-1">
          <h3 className="font-['Sora'] font-bold uppercase tracking-widest text-[11px] text-[#A8A29E] mb-3 px-3">
            Menú de Carta
          </h3>
          {categoriasRaw.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                const el = document.getElementById(`cat-${cat.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all font-semibold text-sm ${
                activeCategory === cat.id 
                  ? 'bg-white shadow-sm border border-[#F1EDE8] text-[#1A1A1A]' 
                  : 'text-[#57534E] hover:bg-white/60 hover:text-[#1A1A1A]'
              }`}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="truncate">{cat.nombre}</span>
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 w-full min-w-0 pb-32 xl:pb-16 px-4 md:px-0">
          
          {/* SEARCH & FILTERS */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#F1EDE8] p-2 mb-8 sticky top-4 z-30">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar platos, ingredientes, bebidas..."
                className="w-full bg-transparent pl-12 pr-4 py-3 rounded-xl font-medium text-[#1A1A1A] placeholder-slate-400 outline-none text-sm"
              />
            </div>
            {availableTags.length > 0 && (
              <div className="flex gap-2 px-2 pb-1.5 mt-2 overflow-x-auto scrollbar-hide">
                {availableTags.map((tag) => (
                  <button 
                    type="button"
                    key={tag}
                    onClick={() => toggleFilter(tag)}
                    className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      activeFilters.includes(tag) 
                        ? 'bg-[#1A1A1A] text-white' 
                        : 'bg-[#FAF6F1] text-[#57534E] hover:bg-[#F1EDE8]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PROMOS CAROUSEL */}
          {!searchQuery && activeFilters.length === 0 && promosRaw.length > 0 && (
            <div className="mb-10 overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔥</span>
                <h3 className="font-['Sora'] font-bold text-xl text-[#1A1A1A]">Destacados y Ofertas</h3>
              </div>
              <div className="relative w-full overflow-hidden rounded-3xl" style={{ isolation: 'isolate' }}>
                <div className="flex gap-4 w-max animate-[scroll_25s_linear_infinite] hover:[animation-play-state:paused] group">
                  {[...promosRaw, ...promosRaw].map((promo: any, idx: number) => (
                    <div key={`${promo.id}-${idx}`} className="w-64 shrink-0 bg-white rounded-3xl shadow-sm border border-[#F1EDE8] overflow-hidden relative">
                      <div className="h-32 bg-[#FAF6F1] w-full relative">
                        {promo.imageUrl ? (
                          <img src={promo.imageUrl} alt={promo.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">⭐</div>
                        )}
                        <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                          Oferta
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-[#1A1A1A] mb-1 text-sm">{promo.name}</h4>
                        <p className="text-xs text-[#57534E] line-clamp-2 mb-3 h-8">{promo.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-['Sora'] font-bold text-base text-[var(--accent)]" style={{ color: accent }}>
                            ${promo.price}
                          </span>
                          <button 
                            type="button"
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base transition-transform active:scale-95" 
                            style={{ backgroundColor: accent }} 
                            onClick={() => updateCart(promo.id, 1)}
                            aria-label={`Agregar oferta ${promo.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Edge gradients */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#FFFBF5] to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#FFFBF5] to-transparent z-10 pointer-events-none" />
              </div>
            </div>
          )}

          {/* MOBILE NAV CATEGORÍAS */}
          <div className="md:hidden sticky top-24 z-30 bg-[#FFFBF5]/95 backdrop-blur-md -mx-4 px-4 py-3 mb-6 shadow-sm border-b border-[#F1EDE8]">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x">
              {categoriasRaw.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  id={`nav-${cat.id}`}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    const el = document.getElementById(`cat-${cat.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`snap-start whitespace-nowrap px-4 py-2 rounded-xl transition-all font-semibold text-xs flex items-center gap-1.5 border ${
                    activeCategory === cat.id 
                      ? 'bg-white shadow-sm border-[#F1EDE8] text-[#1A1A1A] scale-105' 
                      : 'bg-transparent border-transparent text-[#78716C]'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCT LIST */}
          {searchQuery || activeFilters.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-['Sora'] font-bold text-lg mb-6 text-[#78716C]">
                Resultados de búsqueda...
              </h3>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((p) => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      qty={cart[p.id] || 0} 
                      onAdd={() => updateCart(p.id, 1)} 
                      onRemove={() => updateCart(p.id, -1)} 
                      accent={accent} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-3xl border border-[#F1EDE8]">
                  <div className="text-5xl mb-3 opacity-50">🔍</div>
                  <h4 className="font-['Sora'] font-bold text-[#1A1A1A] mb-1">No encontramos platos</h4>
                  <p className="text-xs text-[#57534E] mb-6">Probá buscando con otros ingredientes o restablecé los filtros.</p>
                  <button 
                    type="button"
                    onClick={() => { setSearchQuery(''); setActiveFilters([]); }} 
                    className="px-5 py-2.5 bg-[#FAF6F1] border border-[#F1EDE8] text-[#1A1A1A] font-bold text-xs rounded-xl hover:bg-[#F1EDE8] transition-colors"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-16">
              {categoriasRaw.map((cat) => {
                const prods = productosRaw.filter((p) => p.categoriaId === cat.id);
                if (prods.length === 0) return null;
                return (
                  <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-36">
                    {cat.imagen ? (
                      <div className="relative mb-6 rounded-3xl overflow-hidden bg-gray-900 flex items-end px-6 py-8 min-h-[160px] shadow-sm">
                        <img src={cat.imagen} alt={cat.nombre} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <h2 className="font-['Sora'] text-2xl sm:text-3xl font-bold text-white relative z-10 flex items-center gap-3">
                          <span className="text-3xl drop-shadow-md">{cat.emoji}</span>
                          <span className="drop-shadow-md">{cat.nombre}</span>
                        </h2>
                      </div>
                    ) : (
                      <h2 className="font-['Sora'] text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center gap-3">
                        <span className="text-2xl bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-[#F1EDE8] shrink-0">
                          {cat.emoji}
                        </span>
                        {cat.nombre}
                      </h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prods.map((p) => (
                        <ProductCard 
                          key={p.id} 
                          product={p} 
                          qty={cart[p.id] || 0} 
                          onAdd={() => updateCart(p.id, 1)} 
                          onRemove={() => updateCart(p.id, -1)} 
                          accent={accent} 
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* ── VIDEO SECTION ── */}
          <VideoSection
            videoUrl={negocio?.layoutConfig?.videoUrl}
            accentColor={accent}
            theme="light"
          />

          {/* ── EDITORIAL MINI-FOOTER ── */}
          <footer className="mt-20 pt-10 border-t border-[#F1EDE8] text-center space-y-4">
            <div className="flex justify-center items-center gap-4 text-[#57534E]">
              {negocio?.instagram && (
                <a 
                  href={formatSocialUrl("instagram", negocio.instagram)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border border-[#F1EDE8] flex items-center justify-center hover:text-black hover:border-black transition-colors"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
              )}
              {negocio?.facebook && (
                <a 
                  href={formatSocialUrl("facebook", negocio.facebook)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white border border-[#F1EDE8] flex items-center justify-center hover:text-black hover:border-black transition-colors"
                  aria-label="Facebook"
                >
                  <FacebookIcon />
                </a>
              )}
            </div>

            {address && (
              <p className="text-xs text-[#78716C]">
                📍 {address}
              </p>
            )}

            <p className="text-[11px] text-[#A8A29E] uppercase tracking-widest font-semibold">
              © {new Date().getFullYear()} {name}. Hecho con pasión culinaria.
            </p>
          </footer>

        </main>

        {/* DESKTOP CART PANEL (XL+) */}
        <aside className="hidden xl:block w-[380px] sticky top-6 h-[calc(100vh-3rem)] rounded-3xl overflow-hidden shadow-2xl shadow-black/5 border border-[#F1EDE8] shrink-0 relative z-20">
          {renderCartContent()}
        </aside>
      </div>

      {/* MOBILE CART FAB & DRAWER */}
      <CartFAB qty={cartQty} total={cartTotal} onClick={() => setIsCartOpen(true)} accent={accent} />

      {isCartOpen && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-label="Carrito de compras"
          className="fixed inset-0 z-50 flex xl:hidden justify-end flex-col"
        >
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsCartOpen(false)} 
          />
          <div className="relative bg-white w-full h-[88dvh] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col animate-[slideUp_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div 
              className="w-full flex justify-center py-3 bg-white absolute top-0 z-10 cursor-pointer" 
              onClick={() => setIsCartOpen(false)}
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            <div className="pt-8 h-full">
              {renderCartContent()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pedido Confirmado */}
      {completedOrderWaUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-[#F1EDE8] p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-black border border-emerald-100">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1A1A1A]">¡Pedido Preparado!</h3>
              <p className="text-xs text-[#57534E] mt-1.5 leading-relaxed">
                Confirmá tu pedido enviando los detalles directamente al WhatsApp oficial del local.
              </p>
            </div>
            <a
              href={completedOrderWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-center block transition-all shadow-lg active:scale-95 text-sm"
            >
              📲 Enviar pedido por WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setCompletedOrderWaUrl(null)}
              className="w-full py-2.5 rounded-xl bg-[#FAF6F1] text-xs font-semibold text-[#57534E] hover:text-black transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 8px)); }
        }
      `}</style>
    </div>
  );
}