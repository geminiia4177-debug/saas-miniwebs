"use client";

import React, { useState, useMemo } from "react";
import { StoreProduct, StoreShipping, StorePayment } from "@/lib/types";
import { CartItem, DEMO_PRODUCTS } from "./tienda/tiendaTypes";
import { StoreHeader } from "./tienda/StoreHeader";
import { CategoryRail, SortOption } from "./tienda/CategoryRail";
import { ProductGrid } from "./tienda/ProductGrid";
import { ProductSheet } from "./tienda/ProductSheet";
import { CartDrawer } from "./tienda/CartDrawer";
import { CheckoutModal } from "./tienda/CheckoutModal";
import { OrderSuccessModal } from "./tienda/OrderSuccessModal";
import { FloatingCartButton } from "./tienda/FloatingCartButton";
import { Truck, Check, Sparkles, MessageCircle } from "lucide-react";

export default function TiendaTemplate({
  negocio,
  businessId,
  isPreview = false,
}: {
  negocio: any;
  businessId?: string;
  isPreview?: boolean;
}) {
  const isPreviewMode = isPreview || !!negocio?._isPreview;

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
  const isUsingDemoProducts =
    (layoutConfig.tiendaProductos || layoutConfig.products || []).length === 0 && isPreviewMode;

  const rawProducts: StoreProduct[] = useMemo(() => {
    const list = layoutConfig.tiendaProductos || layoutConfig.products || [];
    if (list.length > 0) return list;
    // D10: Demo products only in preview/editor mode; never on public live sites
    return isPreviewMode ? DEMO_PRODUCTS : [];
  }, [layoutConfig.tiendaProductos, layoutConfig.products, isPreviewMode]);

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
  const [sortBy, setSortBy] = useState<SortOption>("featured");

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

  const freeShippingNeeded = useMemo(() => {
    const freeFrom = Number(enviosConfig.envioGratisDesde);
    if (freeFrom > 0 && cartSubtotal < freeFrom) {
      return freeFrom - cartSubtotal;
    }
    return 0;
  }, [enviosConfig.envioGratisDesde, cartSubtotal]);

  // Detail Modal Open
  const handleOpenDetail = (product: StoreProduct) => {
    setDetailProduct(product);
    const availableSizes = product.talles || product.sizes || [];
    const availableColors = product.colores || product.colors || [];
    setSelectedTalle(availableSizes.length > 0 ? availableSizes[0] : null);
    setSelectedColor(availableColors.length > 0 ? availableColors[0] : null);
    setDetailQty(1);
  };

  // Add to cart
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

    setDetailProduct(null);
    setIsCartOpen(true);
  };

  const updateCartItemQty = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (cartKey: string) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  // Order submission
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

      setOrderSuccess(resData);
      setCart([]);
      setIsCheckoutOpen(false);
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
      {/* ── Main Store Header ── */}
      <StoreHeader
        storeName={storeName}
        storeTagline={storeTagline}
        logoUrl={logoUrl}
        primaryColor={primary}
        enviosConfig={enviosConfig}
        merchantPhone={merchantPhone}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartTotalQty={cartTotalQty}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* ── Hero Promo Banner ── */}
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
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Catálogo Actualizado</span>
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
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Envíos rápidos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <Check className="w-3.5 h-3.5 text-indigo-400" />
                <span>Stock asegurado</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pedido directo a WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Quick Stats / Guarantee Card */}
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

      {/* ── Main Catalog Section ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <CategoryRail
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          totalProductsCount={rawProducts.length}
          filteredCount={filteredProducts.length}
          sortBy={sortBy}
          onSortChange={setSortBy}
          searchQuery={searchQuery}
          onClearFilters={() => {
            setSelectedCategory("all");
            setSearchQuery("");
          }}
        />

        <div className="mt-8">
          <ProductGrid
            products={rawProducts}
            filteredProducts={filteredProducts}
            primaryColor={primary}
            isUsingDemoProducts={isUsingDemoProducts}
            storeName={storeName}
            merchantPhone={merchantPhone}
            onOpenDetail={handleOpenDetail}
            onQuickAdd={(prod) => addToCart(prod, null, null, 1)}
          />
        </div>
      </main>

      {/* ── Modals & Drawers ── */}
      <ProductSheet
        product={detailProduct}
        primaryColor={primary}
        selectedTalle={selectedTalle}
        onSelectTalle={setSelectedTalle}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        quantity={detailQty}
        onQuantityChange={setDetailQty}
        onAddToCart={addToCart}
        onClose={() => setDetailProduct(null)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        cartTotalQty={cartTotalQty}
        cartSubtotal={cartSubtotal}
        shippingCost={shippingCost}
        cartGrandTotal={cartGrandTotal}
        deliveryType={deliveryType}
        onDeliveryTypeChange={setDeliveryType}
        enviosConfig={enviosConfig}
        primaryColor={primary}
        freeShippingNeeded={freeShippingNeeded}
        onUpdateQty={updateCartItemQty}
        onRemoveItem={removeCartItem}
        onStartCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        deliveryType={deliveryType}
        enviosConfig={enviosConfig}
        pagosConfig={pagosConfig}
        merchantAddress={negocio?.address}
        cartGrandTotal={cartGrandTotal}
        primaryColor={primary}
        isSubmitting={isSubmitting}
        onSubmit={handleCheckoutSubmit}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        customerEmail={customerEmail}
        setCustomerEmail={setCustomerEmail}
        addressStreet={addressStreet}
        setAddressStreet={setAddressStreet}
        addressCity={addressCity}
        setAddressCity={setAddressCity}
        addressNotes={addressNotes}
        setAddressNotes={setAddressNotes}
        checkoutNotes={checkoutNotes}
        setCheckoutNotes={setCheckoutNotes}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />

      <OrderSuccessModal
        orderSuccess={orderSuccess}
        paymentMethod={paymentMethod}
        pagosConfig={pagosConfig}
        onClose={() => setOrderSuccess(null)}
      />

      <FloatingCartButton
        cartTotalQty={cartTotalQty}
        cartGrandTotal={cartGrandTotal}
        primaryColor={primary}
        isVisible={!isCartOpen && !isCheckoutOpen && !orderSuccess}
        onClick={() => setIsCartOpen(true)}
      />

      {/* ── Footer ── */}
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
