"use client";

import React, { useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { Ico } from "@/lib/constants";
import { StoreProduct, StoreShipping, StorePayment } from "@/lib/types";

// ─── DEMO FALLBACK DATA ───
const DEMO_PRODUCTS: StoreProduct[] = [
  {
    id: "demo-1",
    nombre: "Remera Oversize Heavyweight",
    precio: 18500,
    descripcion: "Algodón peinado 24/1 premium, corte relajado y costuras reforzadas para máxima durabilidad.",
    categoria: "Remeras",
    imagen: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    talles: ["S", "M", "L", "XL", "XXL"],
    colores: ["Negro", "Blanco", "Beige", "Verde Militar"],
    stock: 25,
    destacado: true,
    disponible: true,
  },
  {
    id: "demo-2",
    nombre: "Hoodie Streetwear Hoodie",
    precio: 36000,
    descripcion: "Frisa invisible de primera calidad, capucha doble forrada y bolsillo canguro espacioso.",
    categoria: "Buzos",
    imagen: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    talles: ["S", "M", "L", "XL"],
    colores: ["Negro", "Gris", "Azul Marino"],
    stock: 14,
    destacado: true,
    disponible: true,
  },
  {
    id: "demo-3",
    nombre: "Pantalón Cargo Ripstop",
    precio: 32000,
    descripcion: "Tela técnica antidesgarro con 6 bolsillos funcionales y ajuste elástico en cintura y botamanga.",
    categoria: "Pantalones",
    imagen: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
    talles: ["38", "40", "42", "44"],
    colores: ["Negro", "Verde Oliva", "Beige"],
    stock: 8,
    destacado: false,
    disponible: true,
  },
  {
    id: "demo-4",
    nombre: "Gorra Trucker Vintage",
    precio: 12500,
    descripcion: "Frente estructurado con bordado de alta definición y malla respirable con broche snapback regulable.",
    categoria: "Accesorios",
    imagen: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80",
    colores: ["Negro", "Azul", "Marrón"],
    stock: 20,
    destacado: true,
    disponible: true,
  },
  {
    id: "demo-5",
    nombre: "Zapatillas Urban Canvas",
    precio: 52000,
    descripcion: "Lona reforzada de algodón, plantilla ergonómica de alto impacto y suela vulcanizada antideslizante.",
    categoria: "Calzado",
    imagen: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80",
    talles: ["39", "40", "41", "42", "43", "44"],
    colores: ["Negro / Blanco", "Blanco"],
    stock: 6,
    destacado: false,
    disponible: true,
  },
  {
    id: "demo-6",
    nombre: "Mochila Rolltop Waterproof",
    precio: 38900,
    descripcion: "Diseño enrollable impermeable con compartimento acolchado para laptop de hasta 16 pulgadas.",
    categoria: "Accesorios",
    imagen: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
    colores: ["Negro", "Gris Plomo"],
    stock: 12,
    destacado: false,
    disponible: true,
  }
];

// Color swatches mapping helper
const COLOR_HEX_MAP: Record<string, string> = {
  negro: "#111111",
  black: "#111111",
  blanco: "#FFFFFF",
  white: "#FFFFFF",
  gris: "#888888",
  gray: "#888888",
  "gris plomo": "#4A4A4A",
  azul: "#2563EB",
  blue: "#2563EB",
  "azul marino": "#1E3A8A",
  navy: "#1E3A8A",
  rojo: "#DC2626",
  red: "#DC2626",
  verde: "#16A34A",
  green: "#16A34A",
  "verde militar": "#4D533C",
  "verde oliva": "#556B2F",
  beige: "#D4C5B9",
  marron: "#78350F",
  brown: "#78350F",
  rosa: "#F472B6",
  pink: "#F472B6",
  amarillo: "#EAB308",
  yellow: "#EAB308",
  naranja: "#F97316",
  orange: "#F97316",
  violeta: "#8B5CF6",
  purple: "#8B5CF6",
};

export interface CartItem {
  id: string;
  cartKey: string;
  nombre: string;
  precio: number;
  imagen?: string | null;
  talle?: string | null;
  color?: string | null;
  qty: number;
}

export default function TiendaTemplate({
  negocio,
  businessId,
}: {
  negocio: any;
  businessId?: string;
}) {
  // Theme styling
  const primary = negocio?.primaryColor || "#6366F1";
  const accent = negocio?.accentColor || "#10B981";
  const storeName = negocio?.name || "Tienda Virtual";
  const storeTagline = negocio?.description || negocio?.tagline || "Tu tienda online de confianza";
  const logoUrl = negocio?.logoUrl;
  const bannerUrl = negocio?.bannerUrl;
  const merchantPhone = negocio?.whatsapp || negocio?.phone || "";

  // Configurations
  const layoutConfig = negocio?.layoutConfig || {};
  const rawProducts: StoreProduct[] = useMemo(() => {
    const list = layoutConfig.tiendaProductos || layoutConfig.products || [];
    return list.length > 0 ? list : DEMO_PRODUCTS;
  }, [layoutConfig.tiendaProductos, layoutConfig.products]);

  const enviosConfig: StoreShipping = layoutConfig.tiendaEnvios || {
    permitirEnvio: true,
    costoEnvio: 0,
    envioGratisDesde: null,
    textoEnvio: "Envíos a todo el país y retiros en tienda",
    permitirRetiro: true,
    direccionRetiro: negocio?.address || "Retiro por nuestro showroom",
  };

  const pagosConfig: StorePayment = layoutConfig.tiendaPagos || {
    acordarVendedor: true,
    instruccionesAcordar: "Coordinamos el pago (efectivo o transferencia) y entrega directamente por WhatsApp.",
  };

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"ENVIO" | "RETIRO">(
    enviosConfig.permitirEnvio !== false ? "ENVIO" : "RETIRO"
  );

  // Product detail modal state
  const [detailProduct, setDetailProduct] = useState<StoreProduct | null>(null);
  const [selectedTalle, setSelectedTalle] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [detailQty, setDetailQty] = useState(1);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressNotes, setAddressNotes] = useState("");
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("acordar");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    rawProducts.forEach((p) => {
      const cat = p.categoria || p.category;
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [rawProducts]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let list = rawProducts.filter((p) => {
      const isAvailable = p.disponible !== false && p.active !== false;
      const cat = p.categoria || p.category || "";
      const matchesCat = selectedCategory === "all" || cat.toLowerCase() === selectedCategory.toLowerCase();
      const name = (p.nombre || p.name || "").toLowerCase();
      const desc = (p.descripcion || p.description || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || name.includes(q) || desc.includes(q) || cat.toLowerCase().includes(q);
      return isAvailable && matchesCat && matchesSearch;
    });

    if (sortBy === "price-asc") {
      list.sort((a, b) => Number(a.precio || a.price || 0) - Number(b.precio || b.price || 0));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => Number(b.precio || b.price || 0) - Number(a.precio || a.price || 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => (a.nombre || a.name || "").localeCompare(b.nombre || b.name || ""));
    } else {
      // featured first
      list.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
    }

    return list;
  }, [rawProducts, selectedCategory, searchQuery, sortBy]);

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.precio * item.qty, 0);
  }, [cart]);

  const cartTotalQty = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }, [cart]);

  const shippingCost = useMemo(() => {
    if (deliveryType === "RETIRO") return 0;
    if (!enviosConfig.permitirEnvio) return 0;
    const freeFrom = Number(enviosConfig.envioGratisDesde);
    if (freeFrom > 0 && cartSubtotal >= freeFrom) {
      return 0;
    }
    return Number(enviosConfig.costoEnvio || 0);
  }, [deliveryType, enviosConfig, cartSubtotal]);

  const cartGrandTotal = cartSubtotal + shippingCost;

  // Free shipping progress
  const freeShippingNeeded = useMemo(() => {
    const freeFrom = Number(enviosConfig.envioGratisDesde);
    if (freeFrom > 0 && cartSubtotal < freeFrom) {
      return freeFrom - cartSubtotal;
    }
    return 0;
  }, [enviosConfig.envioGratisDesde, cartSubtotal]);

  // Open product detail
  const handleOpenDetail = (product: StoreProduct) => {
    setDetailProduct(product);
    const availableSizes = product.talles || product.sizes || [];
    const availableColors = product.colores || product.colors || [];
    setSelectedTalle(availableSizes.length > 0 ? availableSizes[0] : null);
    setSelectedColor(availableColors.length > 0 ? availableColors[0] : null);
    setDetailQty(1);
  };

  // Add to cart from detail modal or quick add
  const addToCart = (
    product: StoreProduct,
    talle?: string | null,
    color?: string | null,
    qty = 1
  ) => {
    const chosenTalle = talle || (product.talles && product.talles[0]) || null;
    const chosenColor = color || (product.colores && product.colores[0]) || null;
    const key = `${product.id}_${chosenTalle || "none"}_${chosenColor || "none"}`;

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.cartKey === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [
        ...prev,
        {
          id: String(product.id),
          cartKey: key,
          nombre: product.nombre || product.name || "Producto",
          precio: Number(product.precio || product.price || 0),
          imagen: product.imagen || product.imageUrl || (product.imagenes && product.imagenes[0]),
          talle: chosenTalle,
          color: chosenColor,
          qty,
        },
      ];
    });

    // Close detail modal if open
    setDetailProduct(null);
    setIsCartOpen(true);
  };

  // Modify cart quantity
  const updateCartItemQty = (cartKey: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove from cart
  const removeCartItem = (cartKey: string) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  // Submit Order
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      alert("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!customerPhone.trim()) {
      alert("Por favor ingresa tu número de WhatsApp para poder coordinar el pedido.");
      return;
    }
    if (deliveryType === "ENVIO" && !addressStreet.trim()) {
      alert("Por favor ingresa la dirección para el envío.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullAddress = deliveryType === "ENVIO"
        ? `${addressStreet.trim()}${addressCity ? `, ${addressCity.trim()}` : ""}${addressNotes ? ` (${addressNotes.trim()})` : ""}`
        : "Retiro en local / Showroom";

      const orderPayload = {
        businessId: businessId || negocio?.id,
        type: deliveryType,
        deliveryType,
        items: cart.map((item) => ({
          id: item.id,
          nombre: item.nombre,
          precio: item.precio,
          qty: item.qty,
          talle: item.talle || null,
          color: item.color || null,
        })),
        total: cartGrandTotal,
        shippingCost,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || null,
        address: fullAddress,
        notes: checkoutNotes.trim() || null,
        paymentMethod,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "No se pudo procesar el pedido.");
      }

      // Success
      setOrderSuccess(resData);
      setCart([]);
      setIsCheckoutOpen(false);

      // Trigger celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: any) {
      console.error("Error creating store order:", err);
      alert(err.message || "Ocurrió un error al registrar el pedido. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#070B14] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-white"
      style={
        {
          "--store-primary": primary,
          "--store-accent": accent,
        } as React.CSSProperties
      }
    >
      {/* ─── TOP NOTIFICATION / PROMO BAR ─── */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-900/40 border-b border-white/5 py-2 px-4 text-center text-xs sm:text-sm font-medium text-indigo-200">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
          <Ico n="truck" s={14} c="text-emerald-400" />
          <span>{enviosConfig.textoEnvio || "Envíos a todo el país • Compra 100% segura por WhatsApp"}</span>
          {enviosConfig.envioGratisDesde ? (
            <span className="hidden sm:inline-block font-bold text-emerald-300">
              • ¡Envío gratis a partir de ${enviosConfig.envioGratisDesde}!
            </span>
          ) : null}
        </div>
      </div>

      {/* ─── MAIN NAVBAR ─── */}
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
                style={{ background: `linear-gradient(135deg, ${primary}, #8B5CF6)` }}
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

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos, marcas, categorías..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Ico n="search" s={16} />
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <Ico n="x" s={14} />
                </button>
              )}
            </div>
          </div>

          {/* Actions: WhatsApp Direct & Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {merchantPhone && (
              <a
                href={`https://wa.me/${merchantPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-semibold text-xs transition-all"
                title="Contactar por WhatsApp"
              >
                <Ico n="whatsapp" s={16} c="text-emerald-400" />
                <span>Consultas</span>
              </a>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95"
              style={{
                background: cartTotalQty > 0 ? `linear-gradient(135deg, ${primary}, #8B5CF6)` : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              aria-label="Ver carrito"
            >
              <Ico n="shopping-bag" s={18} />
              <span className="hidden sm:inline">Carrito</span>
              {cartTotalQty > 0 && (
                <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-white text-slate-900 text-xs font-black shadow-md">
                  {cartTotalQty}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Ico n="search" s={14} />
            </span>
          </div>
        </div>
      </header>

      {/* ─── HERO PROMO BANNER ─── */}
      <section className="relative overflow-hidden py-10 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-[#070B14] to-purple-950/20 pointer-events-none" />
        {bannerUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
            style={{ backgroundImage: `url(${bannerUrl})` }}
          />
        )}
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
              <Ico n="star" s={12} c="text-indigo-400" /> Catálogo Actualizado
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {layoutConfig.heroTitle || "Encuentra tus productos favoritos"}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              {layoutConfig.heroSubtitle ||
                "Explora nuestras colecciones exclusivas con entrega directa y atención personalizada."}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <Ico n="truck" s={14} c="text-emerald-400" />
                <span>Envíos rápidos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <Ico n="check" s={14} c="text-indigo-400" />
                <span>Stock asegurado</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <Ico n="whatsapp" s={14} c="text-emerald-400" />
                <span>Pedido directo a WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Quick Stats or Promo Card */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-3 sm:min-w-[280px]">
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Compra 100% Segura
            </p>
            <div className="text-2xl font-black text-white">
              {rawProducts.length}+ Productos
            </div>
            <p className="text-xs text-slate-400">
              Elige tu talle, color y forma de pago. Recibimos tu pedido al instante.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CATALOG SECTION ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Category Filter Pills & Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/5">
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                selectedCategory === "all"
                  ? "bg-white text-slate-900 shadow-lg scale-105"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              Todos ({rawProducts.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 capitalize ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-white text-slate-900 shadow-lg scale-105"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#111827] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Menor Precio</option>
              <option value="price-desc">Mayor Precio</option>
              <option value="name">Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between py-4 text-xs text-slate-400">
          <span>
            Mostrando <b>{filteredProducts.length}</b> productos
            {selectedCategory !== "all" && ` en ${selectedCategory}`}
            {searchQuery && ` para "${searchQuery}"`}
          </span>
          {(selectedCategory !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="text-indigo-400 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* ─── PRODUCT GRID ─── */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/5 p-8">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Ico n="box" s={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No se encontraron productos</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Intenta cambiar tu búsqueda o selecciona otra categoría para ver los productos disponibles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const hasTalles = (product.talles || product.sizes || []).length > 0;
              const hasColores = (product.colores || product.colors || []).length > 0;
              const priceNum = Number(product.precio || product.price || 0);
              const img = product.imagen || product.imageUrl || (product.imagenes && product.imagenes[0]);

              return (
                <div
                  key={product.id}
                  onClick={() => handleOpenDetail(product)}
                  className="group relative bg-[#0E1526] hover:bg-[#121B30] rounded-3xl border border-white/5 hover:border-indigo-500/40 p-3.5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                >
                  {/* Image Container */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 mb-3 border border-white/5">
                    {img ? (
                      <img
                        src={img}
                        alt={product.nombre || product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-white/5">
                        <Ico n="image" s={36} />
                        <span className="text-[10px] mt-2 font-medium">Sin imagen</span>
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      {product.destacado && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/90 text-slate-950 shadow-md backdrop-blur-md">
                          ⭐ Destacado
                        </span>
                      )}
                      {product.stock !== undefined && product.stock !== null && product.stock <= 5 && product.stock > 0 && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-red-500/80 text-white shadow-md">
                          ¡Últimos {product.stock}!
                        </span>
                      )}
                    </div>

                    {/* Quick view hint */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                        Ver opciones
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {product.categoria && (
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1 block">
                          {product.categoria}
                        </span>
                      )}
                      <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
                        {product.nombre || product.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {product.descripcion || product.description || "Producto de alta calidad."}
                      </p>
                    </div>

                    {/* Talles & Colores Previews */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      {hasTalles && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase">Talles:</span>
                          {(product.talles || product.sizes || []).slice(0, 5).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300"
                            >
                              {t}
                            </span>
                          ))}
                          {(product.talles || product.sizes || []).length > 5 && (
                            <span className="text-[10px] text-slate-500">+{(product.talles || product.sizes || []).length - 5}</span>
                          )}
                        </div>
                      )}

                      {hasColores && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase">Colores:</span>
                          {(product.colores || product.colors || []).slice(0, 4).map((c) => {
                            const hex = COLOR_HEX_MAP[c.toLowerCase().trim()] || "#6366F1";
                            return (
                              <span
                                key={c}
                                title={c}
                                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                                style={{ backgroundColor: hex }}
                              />
                            );
                          })}
                        </div>
                      )}

                      {/* Price & Add CTA */}
                      <div className="flex items-center justify-between pt-2 mt-1">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Precio</span>
                          <span className="text-lg font-black text-white">
                            ${priceNum.toLocaleString("es-AR")}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasTalles || hasColores) {
                              handleOpenDetail(product);
                            } else {
                              addToCart(product, null, null, 1);
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-lg flex items-center gap-1.5"
                          style={{
                            background: `linear-gradient(135deg, ${primary}, #8B5CF6)`,
                          }}
                        >
                          <Ico n="plus" s={14} />
                          <span>Agregar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── PRODUCT DETAIL MODAL ─── */}
      {detailProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={() => setDetailProduct(null)}
        >
          <div
            className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-scaleIn max-h-[90vh] flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setDetailProduct(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <Ico n="x" s={16} />
            </button>

            {/* Modal Image */}
            <div className="md:w-1/2 aspect-square md:aspect-auto bg-slate-900 relative">
              {detailProduct.imagen || detailProduct.imageUrl ? (
                <img
                  src={detailProduct.imagen || detailProduct.imageUrl || ""}
                  alt={detailProduct.nombre || detailProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <Ico n="image" s={48} />
                </div>
              )}
            </div>

            {/* Modal Info & Selectors */}
            <div className="p-6 md:w-1/2 flex flex-col justify-between overflow-y-auto custom-scrollbar">
              <div>
                {detailProduct.categoria && (
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 block">
                    {detailProduct.categoria}
                  </span>
                )}
                <h3 className="text-xl font-black text-white mb-2 leading-tight">
                  {detailProduct.nombre || detailProduct.name}
                </h3>
                <div className="text-2xl font-black text-white mb-3">
                  ${Number(detailProduct.precio || detailProduct.price || 0).toLocaleString("es-AR")}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {detailProduct.descripcion || detailProduct.description || "Sin descripción adicional."}
                </p>

                {/* Size Selector */}
                {(detailProduct.talles || detailProduct.sizes || []).length > 0 && (
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Selecciona tu Talle / Tamaño
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(detailProduct.talles || detailProduct.sizes || []).map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTalle(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            selectedTalle === t
                              ? "bg-white text-slate-900 ring-2 ring-indigo-500 scale-105"
                              : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                {(detailProduct.colores || detailProduct.colors || []).length > 0 && (
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Selecciona Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(detailProduct.colores || detailProduct.colors || []).map((c) => {
                        const isSelected = selectedColor === c;
                        const hex = COLOR_HEX_MAP[c.toLowerCase().trim()] || "#6366F1";
                        return (
                          <button
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-indigo-600/30 text-white border border-indigo-500"
                                : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/20"
                              style={{ backgroundColor: hex }}
                            />
                            <span>{c}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Controls */}
                <div className="mb-6">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Cantidad
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                      <button
                        onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-white/10 font-bold"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-white text-sm">
                        {detailQty}
                      </span>
                      <button
                        onClick={() => setDetailQty((q) => q + 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-white/10 font-bold"
                      >
                        +
                      </button>
                    </div>
                    {detailProduct.stock ? (
                      <span className="text-xs text-slate-400">
                        {detailProduct.stock} disponibles
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Add CTA */}
              <button
                onClick={() =>
                  addToCart(detailProduct, selectedTalle, selectedColor, detailQty)
                }
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${primary}, #8B5CF6)`,
                }}
              >
                <Ico n="shopping-bag" s={18} />
                <span>
                  Agregar al Carrito • $
                  {(
                    Number(detailProduct.precio || detailProduct.price || 0) * detailQty
                  ).toLocaleString("es-AR")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CART DRAWER (SLIDE-OVER) ─── */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0F172A] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl animate-slideLeft"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cart Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#111A2E]">
              <div className="flex items-center gap-2.5">
                <Ico n="shopping-bag" s={20} c="text-indigo-400" />
                <h3 className="text-lg font-black text-white">Tu Carrito</h3>
                <span className="text-xs bg-white/10 text-white font-bold px-2 py-0.5 rounded-full">
                  {cartTotalQty}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <Ico n="x" s={16} />
              </button>
            </div>

            {/* Free shipping bar */}
            {enviosConfig.envioGratisDesde ? (
              <div className="px-5 py-3 bg-indigo-950/30 border-b border-indigo-500/20 text-xs">
                {freeShippingNeeded > 0 ? (
                  <div>
                    <div className="flex justify-between font-medium text-indigo-300 mb-1.5">
                      <span>¡Te faltan <b>${freeShippingNeeded.toLocaleString("es-AR")}</b> para envío gratis!</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (cartSubtotal / Number(enviosConfig.envioGratisDesde)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Ico n="check" s={14} />
                    <span>¡Felicitaciones! Tienes ENVÍO GRATIS 🎉</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-600">
                    <Ico n="shopping-bag" s={28} />
                  </div>
                  <p className="text-sm font-bold text-white mb-1">Tu carrito está vacío</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Agrega productos de la tienda para comenzar tu pedido.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                  >
                    Ver Productos
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.cartKey}
                    className="flex gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/5 relative group"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/5">
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Ico n="box" s={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start pr-6">
                          <h4 className="text-sm font-bold text-white truncate">
                            {item.nombre}
                          </h4>
                        </div>
                        <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                          {item.talle && (
                            <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                              Talle: {item.talle}
                            </span>
                          )}
                          {item.color && (
                            <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-black text-white">
                          ${(item.precio * item.qty).toLocaleString("es-AR")}
                        </span>
                        <div className="flex items-center bg-white/10 rounded-lg p-0.5">
                          <button
                            onClick={() => updateCartItemQty(item.cartKey, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-white/20 text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-white">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateCartItemQty(item.cartKey, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-white/20 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeCartItem(item.cartKey)}
                      className="absolute top-2.5 right-2.5 text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Eliminar"
                    >
                      <Ico n="trash" s={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer & Checkout Action */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-white/10 bg-[#111A2E] space-y-4">
                {/* Delivery Type Option */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Forma de Entrega
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {enviosConfig.permitirEnvio !== false && (
                      <button
                        type="button"
                        onClick={() => setDeliveryType("ENVIO")}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                          deliveryType === "ENVIO"
                            ? "bg-indigo-600/20 border-indigo-500 text-white"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Ico n="truck" s={14} c={deliveryType === "ENVIO" ? "text-indigo-400" : ""} />
                          <span>Envío a domicilio</span>
                        </div>
                        <span className="text-[10px] block font-normal text-slate-400">
                          {shippingCost === 0 ? "¡Envío Gratis!" : `$${shippingCost.toLocaleString("es-AR")}`}
                        </span>
                      </button>
                    )}

                    {enviosConfig.permitirRetiro !== false && (
                      <button
                        type="button"
                        onClick={() => setDeliveryType("RETIRO")}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                          deliveryType === "RETIRO"
                            ? "bg-indigo-600/20 border-indigo-500 text-white"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Ico n="box" s={14} c={deliveryType === "RETIRO" ? "text-indigo-400" : ""} />
                          <span>Retiro en Local</span>
                        </div>
                        <span className="text-[10px] block font-normal text-emerald-400">
                          Gratis
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-white/5">
                  <div className="flex justify-between">
                    <span>Subtotal productos:</span>
                    <span className="font-bold text-white">${cartSubtotal.toLocaleString("es-AR")}</span>
                  </div>
                  {deliveryType === "ENVIO" && (
                    <div className="flex justify-between">
                      <span>Costo de envío:</span>
                      <span className={shippingCost === 0 ? "text-emerald-400 font-bold" : "font-bold text-white"}>
                        {shippingCost === 0 ? "Gratis" : `$${shippingCost.toLocaleString("es-AR")}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
                    <span>Total:</span>
                    <span>${cartGrandTotal.toLocaleString("es-AR")}</span>
                  </div>
                </div>

                {/* Start Checkout CTA */}
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${primary}, #8B5CF6)`,
                  }}
                >
                  <span>Iniciar Pedido</span>
                  <Ico n="check" s={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CHECKOUT FORM MODAL ─── */}
      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto"
          onClick={() => setIsCheckoutOpen(false)}
        >
          <div
            className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-scaleIn my-auto max-h-[95vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-white">Finalizar Pedido</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Completa tus datos para coordinar el pedido por WhatsApp
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <Ico n="x" s={16} />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  1. Tus Datos
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Sofía Martínez"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp / Celular *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej: +54 9 11 2345 6789"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email (Opcional)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  2. Entrega ({deliveryType === "ENVIO" ? "Envío a Domicilio" : "Retiro en Local"})
                </p>

                {deliveryType === "ENVIO" ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Calle, Número y Piso / Dpto *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressStreet}
                        onChange={(e) => setAddressStreet(e.target.value)}
                        placeholder="Ej: Av. San Martín 1420, Piso 3 Dpto B"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Ciudad / Localidad
                        </label>
                        <input
                          type="text"
                          value={addressCity}
                          onChange={(e) => setAddressCity(e.target.value)}
                          placeholder="Ej: Córdoba"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Indicaciones de Entrega
                        </label>
                        <input
                          type="text"
                          value={addressNotes}
                          onChange={(e) => setAddressNotes(e.target.value)}
                          placeholder="Timbre negro, entre calles..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
                    <p className="font-bold text-white mb-1">📍 Dirección de Retiro:</p>
                    <p>{enviosConfig.direccionRetiro || negocio?.address || "Coordinamos punto de entrega por WhatsApp."}</p>
                    {enviosConfig.horarioRetiro && (
                      <p className="text-slate-400 mt-1">⏰ Horario: {enviosConfig.horarioRetiro}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  3. Método de Pago
                </p>

                <div className="space-y-2">
                  {/* A acordar con el vendedor (Primary) */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === "acordar"
                        ? "bg-indigo-600/15 border-indigo-500"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="acordar"
                      checked={paymentMethod === "acordar"}
                      onChange={() => setPaymentMethod("acordar")}
                      className="mt-1 accent-indigo-500"
                    />
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-white">A acordar con el vendedor (Efectivo / Transferencia)</p>
                      <p className="text-slate-400 mt-0.5">
                        {pagosConfig.instruccionesAcordar ||
                          "Coordinas los detalles de pago y envío de comprobante directamente por WhatsApp."}
                      </p>
                    </div>
                  </label>

                  {/* Mercado Pago */}
                  {pagosConfig.mercadoPago?.enabled && (
                    <label
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === "mercadopago"
                          ? "bg-sky-600/15 border-sky-500"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="mercadopago"
                        checked={paymentMethod === "mercadopago"}
                        onChange={() => setPaymentMethod("mercadopago")}
                        className="mt-1 accent-sky-500"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">Mercado Pago</p>
                          <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-bold">
                            Tarjetas / Débito / Saldo MP
                          </span>
                        </div>
                        <p className="text-slate-400 mt-0.5">
                          Pagas de forma segura mediante enlace de pago o alias de Mercado Pago.
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Stripe */}
                  {pagosConfig.stripe?.enabled && (
                    <label
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === "stripe"
                          ? "bg-purple-600/15 border-purple-500"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="stripe"
                        checked={paymentMethod === "stripe"}
                        onChange={() => setPaymentMethod("stripe")}
                        className="mt-1 accent-purple-500"
                      />
                      <div className="flex-1 text-xs">
                        <p className="font-bold text-white">Tarjeta de Crédito / Débito (Stripe)</p>
                        <p className="text-slate-400 mt-0.5">
                          Cobro internacional o local con tarjeta.
                        </p>
                      </div>
                    </label>
                  )}

                  {/* PayPal */}
                  {pagosConfig.paypal?.enabled && (
                    <label
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === "paypal"
                          ? "bg-blue-600/15 border-blue-500"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="paypal"
                        checked={paymentMethod === "paypal"}
                        onChange={() => setPaymentMethod("paypal")}
                        className="mt-1 accent-blue-500"
                      />
                      <div className="flex-1 text-xs">
                        <p className="font-bold text-white">PayPal</p>
                        <p className="text-slate-400 mt-0.5">
                          Paga con tu cuenta o tarjeta a través de PayPal.
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas adicionales (Opcional)
                </label>
                <textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Aclaraciones sobre el pedido, horario preferido de entrega..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Total & Submit */}
              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between items-center text-sm font-bold text-white mb-4">
                  <span>Total a Pagar:</span>
                  <span className="text-xl font-black text-white">
                    ${cartGrandTotal.toLocaleString("es-AR")}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${primary}, #8B5CF6)`,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Ico n="loader" s={16} c="animate-spin" />
                      <span>Registrando Pedido...</span>
                    </>
                  ) : (
                    <>
                      <Ico n="check" s={18} />
                      <span>Confirmar Pedido</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ORDER SUCCESS MODAL ─── */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0F172A] border border-emerald-500/30 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl text-center animate-scaleIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <Ico n="check" s={32} />
            </div>

            <h3 className="text-2xl font-black text-white mb-1">
              ¡Pedido Registrado con Éxito!
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Ticket #{orderSuccess.id ? orderSuccess.id.slice(-6).toUpperCase() : "NUEVO"}
            </p>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Total:</span>
                <span className="font-bold text-white">${orderSuccess.total?.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entrega:</span>
                <span className="font-bold text-white capitalize">{orderSuccess.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estado:</span>
                <span className="font-bold text-emerald-400">Pendiente de confirmación</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Le enviamos una notificación automática al vendedor. También puedes abrir WhatsApp para coordinar directamente:
            </p>

            <div className="space-y-3">
              {orderSuccess.whatsappUrl ? (
                <a
                  href={orderSuccess.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Ico n="whatsapp" s={18} c="text-slate-950" />
                  <span>Enviar Pedido por WhatsApp</span>
                </a>
              ) : null}

              {/* Payment Gateway Links if configured */}
              {paymentMethod === "mercadopago" && pagosConfig.mercadoPago?.paymentLink && (
                <a
                  href={pagosConfig.mercadoPago.paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <span>Pagar con Mercado Pago</span>
                </a>
              )}
              {paymentMethod === "stripe" && pagosConfig.stripe?.paymentLink && (
                <a
                  href={pagosConfig.stripe.paymentLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <span>Pagar con Tarjeta (Stripe)</span>
                </a>
              )}
              {paymentMethod === "paypal" && pagosConfig.paypal?.meLink && (
                <a
                  href={pagosConfig.paypal.meLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <span>Pagar con PayPal</span>
                </a>
              )}

              <button
                onClick={() => setOrderSuccess(null)}
                className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Volver a la Tienda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE FLOATING CART BUTTON (FAB) ─── */}
      {cartTotalQty > 0 && !isCartOpen && !isCheckoutOpen && !orderSuccess && (
        <div className="fixed bottom-6 inset-x-0 px-4 sm:hidden z-40 pointer-events-none flex justify-center">
          <button
            onClick={() => setIsCartOpen(true)}
            className="pointer-events-auto w-full max-w-sm flex items-center justify-between px-5 py-3.5 rounded-2xl text-white font-bold text-sm shadow-2xl transition-all active:scale-95 animate-bounce"
            style={{
              background: `linear-gradient(135deg, ${primary}, #8B5CF6)`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-white text-slate-900 text-xs font-black flex items-center justify-center">
                {cartTotalQty}
              </span>
              <span>Ver Carrito</span>
            </div>
            <span className="font-black">${cartGrandTotal.toLocaleString("es-AR")}</span>
          </button>
        </div>
      )}

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 bg-[#050811] text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400">
            {negocio?.instagram && (
              <a
                href={negocio.instagram.startsWith("http") ? negocio.instagram : `https://instagram.com/${negocio.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Instagram
              </a>
            )}
            {merchantPhone && (
              <a
                href={`https://wa.me/${merchantPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
