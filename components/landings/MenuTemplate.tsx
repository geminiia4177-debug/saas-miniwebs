"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import BookingForm from "@/app/[subdomain]/BookingForm";
import OpenNowBadge from "../ui/OpenNowBadge";
import VideoSection from "../ui/VideoSection";

// ─── TYPES ───
interface MenuProduct {
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

interface MenuCategoria {
  id: string;
  nombre: string;
  emoji: string;
  imagen?: string;
  orden: number;
}

// ─── DEMO DATA (Fallback) ───
const DEMO_CATEGORIES: MenuCategoria[] = [
  { id: "destacados", nombre: "Destacados", emoji: "⭐", orden: 1 },
  { id: "principales", nombre: "Principales", emoji: "🍽", orden: 2 },
  { id: "bebidas", nombre: "Bebidas", emoji: "🥤", orden: 3 },
  { id: "postres", nombre: "Postres", emoji: "🍰", orden: 4 }
];

const DEMO_PRODUCTS: MenuProduct[] = [
  { id: "1", categoriaId: "destacados", nombre: "Hamburguesa Doble", descripcion: "Doble carne, cheddar, bacon y salsa secreta.", precio: 6500, emoji: "🍔", tags: ["⭐ Popular"], disponible: true, destacado: true },
  { id: "2", categoriaId: "principales", nombre: "Pizza Margarita", descripcion: "Salsa de tomate casera, mozzarella fior di latte y albahaca fresca.", precio: 7200, emoji: "🍕", tags: ["🌿 Vegano"], disponible: true, destacado: false },
  { id: "3", categoriaId: "bebidas", nombre: "Limonada Menta Jengibre", descripcion: "Refrescante limonada casera de 500ml.", precio: 1500, emoji: "🍋", disponible: true, destacado: false },
  { id: "4", categoriaId: "postres", nombre: "Cheesecake Frutos Rojos", descripcion: "Con base de galleta y coulis de frutos.", precio: 3200, emoji: "🍰", disponible: true, destacado: true },
  { id: "5", categoriaId: "principales", nombre: "Wrap de Pollo", descripcion: "Pollo grillado, lechuga, parmesano y aderezo caesar.", precio: 4500, emoji: "🌯", disponible: false, destacado: false },
];

// ─── COMPONENTS ───

function ProductCard({ product, qty, onAdd, onRemove, accent }: { product: MenuProduct, qty: number, onAdd: (e?: React.MouseEvent) => void, onRemove: () => void, accent: string }) {
  return (
    <div className={`group flex items-start gap-4 p-4 rounded-3xl border border-gray-100 bg-white hover:border-[var(--accent)] transition-all duration-300 relative overflow-hidden ${!product.disponible ? 'opacity-50 grayscale' : 'hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1'}`} style={{ "--accent": accent } as any}>
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--accent)] opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none"></div>

      {/* Imagen */}
      <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative bg-gray-50/50 border border-gray-100">
        {product.imagen ? (
          <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:scale-110 transition-transform duration-500">{product.emoji}</div>
        )}
        {qty > 0 && (
          <div className="absolute inset-0 ring-2 ring-[var(--accent)] ring-inset rounded-2xl transition-all"></div>
        )}
        {!product.disponible && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
             <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200">Agotado</span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[96px] justify-between py-1">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-gray-900 text-base leading-tight group-hover:text-[var(--accent)] transition-colors">{product.nombre}</h3>
            {qty > 0 && (
              <span className="bg-[var(--accent)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shrink-0">x{qty}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-['Plus_Jakarta_Sans'] mb-2">{product.descripcion}</p>
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              {product.tags.map(tag => (
                <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-gray-500 uppercase tracking-widest">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-end mt-auto pt-2">
          <span className="font-['Sora'] font-bold text-lg text-gray-900 group-hover:text-[var(--accent)] transition-colors">${product.precio}</span>
          
          {/* Controles Qty */}
          {product.disponible && (
            <div className="flex items-center gap-2">
              {qty > 0 ? (
                <div className="flex items-center bg-gray-50 rounded-full border border-gray-100 p-0.5 relative z-10">
                  <button onClick={(e) => {e.stopPropagation(); onRemove()}} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm hover:text-gray-900 transition-all font-medium">-</button>
                  <span className="font-['Sora'] font-bold text-sm w-6 text-center text-[var(--accent)]">{qty}</span>
                  <button onClick={(e) => {e.stopPropagation(); onAdd(e)}} className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-transform active:scale-95 bg-[var(--accent)] font-medium">+</button>
                </div>
              ) : (
                <button onClick={(e) => {e.stopPropagation(); onAdd(e)}} className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--accent)] bg-gray-50 border border-gray-100 hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] shadow-sm transition-all active:scale-95 group/btn relative z-10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform group-hover/btn:rotate-90"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CartFAB({ qty, total, onClick, accent }: { qty: number, total: number, onClick: () => void, accent: string }) {
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
    <div className="fixed bottom-6 inset-x-0 px-4 xl:hidden z-40 pointer-events-none flex justify-center">
      <button 
        id="cart-fab"
        onClick={onClick}
        aria-label="Ver carrito de compras"
        className={`pointer-events-auto flex items-center shadow-2xl text-white font-['Plus_Jakarta_Sans'] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${bouncing ? 'scale-105' : 'scale-100'} ${qty === 1 ? 'rounded-full px-5 py-4 gap-3' : 'rounded-2xl w-full max-w-sm px-5 py-4 justify-between'}`}
        style={{ backgroundColor: accent }}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">{qty}</div>
          {qty > 1 && <span className="font-semibold">Ver Pedido</span>}
        </div>
        <div className="flex items-center gap-2">
          {qty === 1 && <span className="font-semibold">Pedido</span>}
          <span className="font-['Sora'] font-bold tracking-tight">${total}</span>
        </div>
      </button>
    </div>
  );
}

// ─── MAIN TEMPLATE ───

export default function MenuTemplate(props: { negocio: any; businessId?: string }) {
  const { negocio, businessId } = props;
  
  // Theme
  const accent = negocio?.accentColor || negocio?.primaryColor || "#E85D04";
  const name = negocio?.name || "Tu Restaurante";
  const tagline = negocio?.tagline || "Sabores que enamoran";
  const hours = negocio?.layoutConfig?.hours;
  
  // Configs
  const rawCats = negocio?.layoutConfig?.menuCategorias || DEMO_CATEGORIES;
  
  const categoriasRaw = rawCats.map((c: any) => ({
    id: c.id,
    nombre: c.nombre || c.name || "Categoría",
    emoji: c.emoji || "🍽",
    imagen: c.imagen || c.imageUrl,
    orden: c.orden || 1
  }));

  const productosRaw = negocio?.layoutConfig?.menuCategorias
    ? negocio.layoutConfig.menuCategorias.flatMap((c: any) => 
        (c.products || []).map((p: any) => ({
          id: p.id,
          categoriaId: c.id,
          nombre: p.nombre || p.name || "",
          descripcion: p.descripcion || p.description || "",
          precio: Number(p.precio || p.price || 0),
          imagen: p.imagen || p.imageUrl || "",
          emoji: c.emoji || "🍽",
          tags: p.tags || [],
          disponible: p.disponible ?? true,
          destacado: p.destacado ?? false
        }))
      )
    : DEMO_PRODUCTS;

  const promosRaw = negocio?.layoutConfig?.menuPromos || [];
  const modosDisponibles = negocio?.layoutConfig?.modosDisponibles || ['local', 'delivery', 'llevar'];
  const deliveryRadio = negocio?.layoutConfig?.deliveryRadio || "Radio de entrega: 3km";
  const reservaMesaActiva = negocio?.layoutConfig?.reservaMesaActiva ?? true;
  
  // State
  const [activeCategory, setActiveCategory] = useState<string>(categoriasRaw[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [modoPedido, setModoPedido] = useState<'local'|'delivery'|'llevar'|'reserva'>(modosDisponibles[0] as any || 'local');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutExtra, setCheckoutExtra] = useState("");
  const [checkoutNotas, setCheckoutNotas] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    productosRaw.forEach((p: MenuProduct) => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [productosRaw]);

  const filteredProducts = useMemo(() => {
    return productosRaw.filter((p: MenuProduct) => {
      const matchSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || p.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilters = activeFilters.length === 0 || activeFilters.every(f => p.tags?.includes(f));
      return matchSearch && matchFilters;
    });
  }, [productosRaw, searchQuery, activeFilters]);

  // Derived
  const cartItems = Object.entries(cart).map(([id, qty]) => {
    let p: any = productosRaw.find((x: any) => x.id === id);
    if (!p) {
      const promo = promosRaw.find((x: any) => x.id === id);
      if (promo) {
        p = {
          id: promo.id,
          nombre: promo.name,
          precio: Number(promo.price || 0),
          imagen: promo.imageUrl,
          emoji: "🔥"
        };
      }
    }
    return p ? { ...p, qty } : null;
  }).filter(Boolean) as (MenuProduct & {qty: number})[];
  
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.precio * item.qty), 0);
  const cartQty = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const toggleFilter = (tag: string) => {
    setActiveFilters(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const updateCart = (id: string, delta: number, event?: React.MouseEvent) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });

    if (delta > 0 && event && window.innerWidth < 1280) {
      flyToCartAnimation(event);
    }
  };

  const flyToCartAnimation = (e: React.MouseEvent) => {
    const btn = e.currentTarget as HTMLElement;
    const target = document.getElementById("cart-fab");
    if (!target || !btn) return;

    const btnRect = btn.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const flyEl = document.createElement("div");
    flyEl.className = "fixed z-[9999] rounded-full pointer-events-none shadow-2xl";
    flyEl.style.width = "20px";
    flyEl.style.height = "20px";
    flyEl.style.backgroundColor = accent;
    flyEl.style.left = `${btnRect.left + btnRect.width / 2 - 10}px`;
    flyEl.style.top = `${btnRect.top + btnRect.height / 2 - 10}px`;
    flyEl.style.transition = "all 0.6s cubic-bezier(0.2, 1, 0.3, 1)";
    document.body.appendChild(flyEl);

    requestAnimationFrame(() => {
      flyEl.style.left = `${targetRect.left + targetRect.width / 2 - 10}px`;
      flyEl.style.top = `${targetRect.top + targetRect.height / 2 - 10}px`;
      flyEl.style.transform = "scale(0.5)";
      flyEl.style.opacity = "0.2";
    });

    setTimeout(() => {
      flyEl.remove();
    }, 600);
  };

  const clearCart = () => {
    if(confirm("¿Seguro que querés vaciar el carrito?")) setCart({});
  };

  const handleOrder = async () => {
    if (!negocio?.whatsapp) return alert("El negocio no tiene un WhatsApp configurado.");
    if (cartItems.length === 0) return;
    if (modoPedido === 'local' && !checkoutExtra) return alert("Por favor indicá tu número de mesa.");
    if (modoPedido === 'delivery' && !checkoutExtra) return alert("Por favor ingresá tu dirección para el delivery.");

    setIsOrdering(true);

    try {
      // 1. Guardar el pedido en Prisma (Dashboard Orders)
      const orderPayload = {
        businessId: businessId || negocio?.id,
        type: modoPedido === 'local' ? 'MESA' : modoPedido === 'delivery' ? 'DELIVERY' : 'TAKEAWAY',
        items: cartItems.map(i => ({ id: i.id, nombre: i.nombre, qty: i.qty, precio: i.precio })),
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
        });
      }

      // 2. Enviar a WhatsApp
      let header = "";
      if (modoPedido === 'local') header = `🍽 *Pedido - Mesa ${checkoutExtra}*`;
      if (modoPedido === 'delivery') header = `🛵 *Pedido Delivery*\n📍 Dirección: ${checkoutExtra}`;
      if (modoPedido === 'llevar') header = `🥡 *Pedido para Retirar*${checkoutExtra ? `\n⏰ Horario aprox: ${checkoutExtra}` : ''}`;

      let itemsStr = cartItems.map(i => `${i.qty}x ${i.nombre} ($${i.precio * i.qty})`).join("\n");
      let notasStr = checkoutNotas ? `\n📝 *Notas:* ${checkoutNotas}` : "";
      let totalStr = `\n💰 *Total:* $${cartTotal}`;

      const finalMsg = `${header}\n\n${itemsStr}${notasStr}\n${totalStr}`;
      window.open(`https://wa.me/${negocio.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(finalMsg)}`, '_blank');
      
      // Clear cart
      setCart({});
      setCheckoutExtra("");
      setCheckoutNotas("");
      setIsCartOpen(false);

    } catch (error) {
      console.error(error);
      alert("Hubo un problema al registrar el pedido.");
    } finally {
      setIsOrdering(false);
    }
  };

  // Intersection Observer for scroll spy
  useEffect(() => {
    if (searchQuery || activeFilters.length > 0) return; // Disable scroll spy while filtering
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id.replace('cat-', ''));
            // Scroll nav into view
            const btn = document.getElementById(`nav-${entry.target.id.replace('cat-', '')}`);
            if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    categoriasRaw.forEach((c: MenuCategoria) => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categoriasRaw, searchQuery, activeFilters]);

  const renderCartContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-['Sora'] font-bold text-xl text-gray-900">Tu Pedido</h3>
        {cartQty > 0 && (
          <button onClick={clearCart} className="text-xs font-semibold text-red-500 hover:underline">Vaciar</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32 xl:pb-5">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
             <span className="text-6xl grayscale opacity-50">🍽</span>
             <p className="font-['Plus_Jakarta_Sans'] font-medium">No agregaste nada aún</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Items */}
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {item.imagen ? <img src={item.imagen} className="w-full h-full object-cover" /> : item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-['Plus_Jakarta_Sans'] font-semibold text-sm text-gray-900 truncate">{item.nombre}</h4>
                    <p className="font-['Sora'] font-bold text-sm text-gray-600 mt-1">${item.precio}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => updateCart(item.id, -1)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors">-</button>
                    <span className="font-['Sora'] font-semibold text-sm w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateCart(item.id, 1)} className="w-8 h-8 rounded-full text-white font-bold transition-colors" style={{ backgroundColor: accent }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Extras del pedido */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              {modoPedido === 'local' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Número de Mesa</label>
                  <input type="text" value={checkoutExtra} onChange={e=>setCheckoutExtra(e.target.value)} placeholder="Ej: 4" className="w-full border border-gray-200 rounded-xl px-4 py-3 font-['Plus_Jakarta_Sans'] text-sm focus:border-black outline-none transition-colors" />
                </div>
              )}
              {modoPedido === 'delivery' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Dirección de Entrega</label>
                  <input type="text" value={checkoutExtra} onChange={e=>setCheckoutExtra(e.target.value)} placeholder="Ej: San Martín 123, Depto 4B" className="w-full border border-gray-200 rounded-xl px-4 py-3 font-['Plus_Jakarta_Sans'] text-sm focus:border-black outline-none transition-colors" />
                  <p className="text-[10px] text-gray-400 mt-1">{deliveryRadio}</p>
                </div>
              )}
              {modoPedido === 'llevar' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Hora de retiro estimada</label>
                  <input type="text" value={checkoutExtra} onChange={e=>setCheckoutExtra(e.target.value)} placeholder="Ej: En 30 min, 21:00hs" className="w-full border border-gray-200 rounded-xl px-4 py-3 font-['Plus_Jakarta_Sans'] text-sm focus:border-black outline-none transition-colors" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Notas para la cocina</label>
                <textarea value={checkoutNotas} onChange={e=>setCheckoutNotas(e.target.value)} placeholder="Ej: Sin cebolla, extra mayonesa..." rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 font-['Plus_Jakarta_Sans'] text-sm focus:border-black outline-none transition-colors resize-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {cartQty > 0 && (
        <div className="p-5 border-t border-gray-100 bg-white">
          <div className="flex justify-between items-center mb-4">
            <span className="font-['Plus_Jakarta_Sans'] font-medium text-gray-500">Total a pagar</span>
            <span className="font-['Sora'] font-bold text-2xl text-gray-900">${cartTotal}</span>
          </div>
          <button onClick={handleOrder} disabled={isOrdering} className="w-full py-4 rounded-xl text-white font-['Plus_Jakarta_Sans'] font-bold text-lg flex justify-center items-center gap-2 hover:brightness-110 transition-all shadow-xl shadow-[var(--accent)]/20 disabled:opacity-50" style={{ backgroundColor: accent }}>
             {isOrdering ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               "Enviar Pedido por WhatsApp"
             )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sora:wght@400;600;700;800&display=swap');
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-['Plus_Jakarta_Sans'] selection:bg-[var(--accent)] selection:text-white">
        {/* HEADER HERO */}
        <header className="relative pt-12 pb-24 px-4 sm:px-6 md:px-12 rounded-b-[40px] overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 40%, #220000))` }}>
          {negocio?.bannerUrl && (
            <>
              <img src={negocio.bannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay pointer-events-none" />
              <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: (negocio?.layoutConfig?.bannerOpacity !== undefined ? negocio.layoutConfig.bannerOpacity : 50) / 100 }}></div>
            </>
          )}
          
          <div className="max-w-7xl mx-auto relative z-10 flex flex-col xl:flex-row justify-between items-start gap-8">
            <div className="w-full max-w-2xl text-center xl:text-left">
              <div className="flex justify-center xl:justify-start mb-6">
                 {negocio?.logoUrl && <img src={negocio.logoUrl} alt="Logo" className="w-24 h-24 object-contain drop-shadow-lg" />}
              </div>
              <div className="inline-flex xl:flex mb-6 justify-center xl:justify-start">
                 <OpenNowBadge hours={hours} />
              </div>
              <h1 className="font-['Sora'] text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-md">
                {name}
              </h1>
              <p className="text-white/80 font-medium text-lg lg:text-xl drop-shadow-sm mb-8">{tagline}</p>
            </div>
          </div>
        </header>

        {/* MODO DE PEDIDO SELECTOR */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 -mt-10 relative z-20 mb-8">
          {(modosDisponibles.length > 1 || reservaMesaActiva) && (
             <div className="bg-white p-2 rounded-2xl shadow-xl shadow-black/5 flex flex-wrap sm:flex-nowrap gap-2 justify-center">
                {modosDisponibles.map((m: string) => (
                  <button 
                    key={m as string} 
                    onClick={() => setModoPedido(m as any)}
                    className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${modoPedido === m ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="text-xl">{m === 'local' ? '🍽' : m === 'delivery' ? '🛵' : '🥡'}</span>
                    <span className="capitalize">{m === 'local' ? 'En el local' : m === 'delivery' ? 'Delivery' : 'Para llevar'}</span>
                  </button>
                ))}
                {reservaMesaActiva && (
                  <button 
                    onClick={() => setModoPedido('reserva' as any)}
                    className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${modoPedido === 'reserva' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
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
             <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-black/5 border border-gray-100">
               <div className="text-center mb-8">
                 <h2 className="font-['Sora'] text-3xl font-bold text-gray-900 mb-2">Reservá tu mesa</h2>
                 <p className="text-gray-500">Completá tus datos para asegurar tu lugar.</p>
               </div>
               <BookingForm businessId={businessId || "demo"} primaryColor={accent} secondaryColor="#1A1A1A" services={["Mesa para 2", "Mesa para 4", "Mesa para 6+"]} theme="light" />
             </div>
          </div>
        )}

        {/* MAIN LAYOUT: SIDEBAR + CONTENT + CART PANEL */}
        <div className={`max-w-7xl mx-auto gap-8 items-start xl:px-4 ${modoPedido === 'reserva' ? 'hidden' : 'flex'}`}>
          
          {/* DESKTOP SIDEBAR (CATEGORÍAS) */}
          <aside className="hidden md:flex flex-col sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto w-56 py-2 px-2 shrink-0 scrollbar-hide gap-1">
            <h3 className="font-['Sora'] font-bold uppercase tracking-widest text-xs text-gray-400 mb-4 px-3">Menú</h3>
            {categoriasRaw.map((cat: MenuCategoria) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const el = document.getElementById(`cat-${cat.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-semibold text-sm ${activeCategory === cat.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <span className="text-xl">{cat.emoji}</span>
                {cat.nombre}
              </button>
            ))}
          </aside>

          {/* MAIN CONTENT (SEARCH + MENU) */}
          <main className="flex-1 w-full min-w-0 pb-32 xl:pb-16 px-4 md:px-0">
            
            {/* SEARCH & FILTERS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 sticky top-4 z-30">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar platos, ingredientes..."
                  className="w-full bg-transparent pl-12 pr-4 py-3 rounded-xl font-medium text-gray-900 placeholder-gray-400 outline-none"
                />
              </div>
              {availableTags.length > 0 && (
                <div className="flex gap-2 px-2 pb-2 mt-2 overflow-x-auto scrollbar-hide">
                  {availableTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => toggleFilter(tag)}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeFilters.includes(tag) ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
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
                  <h3 className="font-['Sora'] font-bold text-xl text-gray-900">Destacados y Ofertas</h3>
                </div>
                <div className="relative w-full overflow-hidden rounded-2xl" style={{ isolation: 'isolate' }}>
                  <div className="flex gap-4 w-max animate-[scroll_20s_linear_infinite] hover:[animation-play-state:paused] group">
                    {/* Double the list to make infinite scroll smooth */}
                    {[...promosRaw, ...promosRaw].map((promo: any, idx: number) => (
                      <div key={`${promo.id}-${idx}`} className="w-64 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                        <div className="h-32 bg-gray-100 w-full">
                          {promo.imageUrl ? (
                            <img src={promo.imageUrl} alt={promo.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">⭐</div>
                          )}
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">Oferta</div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-gray-900 mb-1">{promo.name}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">{promo.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-['Sora'] font-bold text-lg text-[var(--accent)]" style={{ color: accent }}>${promo.price}</span>
                            {/* It's an isolated promo, clicking it could ideally add to cart if it matched a product, but since it's custom text, we can just show it. */}
                            <button className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg transition-transform active:scale-95" style={{ backgroundColor: accent }} onClick={() => {
                               // Si la promo matcheaba con un producto por id, lo agregamos. 
                               // Pero como menuPromos son genéricos, lo agregamos como un producto artificial al carrito:
                               updateCart(promo.id, 1);
                            }}>+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Fades para los bordes */}
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#FAFAF8] to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#FAFAF8] to-transparent z-10 pointer-events-none"></div>
                </div>
              </div>
            )}

            {/* MOBILE NAV CATEGORÍAS (Sticky) */}
            <div className="md:hidden sticky top-24 z-30 bg-[#FAFAF8]/95 backdrop-blur-md -mx-4 px-4 py-3 mb-6 shadow-sm border-b border-gray-100">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x">
                {categoriasRaw.map((cat: MenuCategoria) => (
                  <button
                    key={cat.id}
                    id={`nav-${cat.id}`}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      const el = document.getElementById(`cat-${cat.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`snap-start whitespace-nowrap px-4 py-2 rounded-xl transition-all font-semibold text-sm flex items-center gap-2 border ${activeCategory === cat.id ? 'bg-white shadow-sm border-gray-200 text-gray-900 scale-105' : 'bg-transparent border-transparent text-gray-500'}`}
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
                <h3 className="font-['Sora'] font-bold text-xl mb-6 text-gray-400">Resultados de búsqueda...</h3>
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProducts.map((p: MenuProduct) => (
                       <ProductCard key={p.id} product={p} qty={cart[p.id] || 0} onAdd={(e)=>updateCart(p.id, 1, e)} onRemove={()=>updateCart(p.id, -1)} accent={accent} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 opacity-50">🔍</div>
                    <h4 className="font-['Sora'] font-bold text-gray-900 mb-2">No encontramos nada</h4>
                    <p className="text-gray-500 mb-6">Probá buscando con otras palabras o quitá los filtros.</p>
                    <button onClick={()=>{setSearchQuery(''); setActiveFilters([])}} className="px-6 py-2 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200">Limpiar búsqueda</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-16">
                {categoriasRaw.map((cat: MenuCategoria) => {
                  const prods = productosRaw.filter((p: MenuProduct) => p.categoriaId === cat.id);
                  if (prods.length === 0) return null;
                  return (
                    <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-36">
                      {cat.imagen ? (
                        <div className="relative mb-6 rounded-3xl overflow-hidden bg-gray-900 flex items-end px-6 py-8 min-h-[160px] shadow-sm">
                          <img src={cat.imagen} alt={cat.nombre} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                          <h2 className="font-['Sora'] text-3xl font-bold text-white relative z-10 flex items-center gap-3">
                            <span className="text-3xl drop-shadow-md">{cat.emoji}</span>
                            <span className="drop-shadow-md">{cat.nombre}</span>
                          </h2>
                        </div>
                      ) : (
                        <h2 className="font-['Sora'] text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <span className="text-3xl bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 shrink-0">{cat.emoji}</span>
                          {cat.nombre}
                        </h2>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prods.map((p: MenuProduct) => (
                          <ProductCard key={p.id} product={p} qty={cart[p.id] || 0} onAdd={(e)=>updateCart(p.id, 1, e)} onRemove={()=>updateCart(p.id, -1)} accent={accent} />
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}

            {/* ── VIDEO ── */}
            <VideoSection
              videoUrl={negocio?.layoutConfig?.videoUrl}
              accentColor={accent}
              theme="light"
            />

          </main>

          {/* DESKTOP CART PANEL (XL+) */}
          <aside className="hidden xl:block w-[380px] sticky top-6 h-[calc(100vh-3rem)] rounded-3xl overflow-hidden shadow-2xl shadow-black/10 border border-gray-100 shrink-0 relative z-20">
             {renderCartContent()}
          </aside>
        </div>

        {/* MOBILE CART FAB & DRAWER */}
        <CartFAB qty={cartQty} total={cartTotal} onClick={() => setIsCartOpen(true)} accent={accent} />

        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex xl:hidden justify-end flex-col">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
            <div className="relative bg-white w-full h-[85vh] rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-[slideUp_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
              {/* Handle */}
              <div className="w-full flex justify-center py-3 bg-white absolute top-0 z-10" onClick={() => setIsCartOpen(false)}>
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>
              <div className="pt-8 h-full">
                {renderCartContent()}
              </div>
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
            100% { transform: translateX(calc(-50% - 8px)); } /* 8px is half the gap */
          }
        `}</style>
      </div>
    </>
  );
}