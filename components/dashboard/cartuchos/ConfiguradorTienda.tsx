"use client";

import React, { useState, useRef } from "react";
import { Ico } from "@/lib/constants";
import { uploadToImgBB } from "@/lib/utils/upload";
import { StoreProduct, StoreShipping, StorePayment } from "@/lib/types";

// Size Presets
const PRESET_CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const PRESET_SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

// Color Presets
const PRESET_COLORS = [
  { name: "Negro", hex: "#111111" },
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Gris", hex: "#888888" },
  { name: "Azul", hex: "#2563EB" },
  { name: "Azul Marino", hex: "#1E3A8A" },
  { name: "Rojo", hex: "#DC2626" },
  { name: "Verde", hex: "#16A34A" },
  { name: "Verde Militar", hex: "#4D533C" },
  { name: "Beige", hex: "#D4C5B9" },
  { name: "Marrón", hex: "#78350F" },
  { name: "Rosa", hex: "#F472B6" },
  { name: "Amarillo", hex: "#EAB308" },
];

export default function ConfiguradorTienda({
  biz,
  setBiz,
  media,
  setMedia,
  showToast,
  activeTab,
}: {
  biz: any;
  setBiz: any;
  media?: any[];
  setMedia?: any;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warn") => void;
  activeTab: string;
}) {
  const layoutConfig = biz?.layoutConfig || {};
  const products: StoreProduct[] = layoutConfig.tiendaProductos || [];

  const envios: StoreShipping = layoutConfig.tiendaEnvios || {
    permitirEnvio: true,
    costoEnvio: 0,
    envioGratisDesde: null,
    textoEnvio: "Envíos a todo el país y retiros en tienda",
    permitirRetiro: true,
    direccionRetiro: biz?.address || "",
    horarioRetiro: "",
  };

  const pagos: StorePayment = layoutConfig.tiendaPagos || {
    acordarVendedor: true,
    instruccionesAcordar: "Coordinamos el pago (efectivo o transferencia) y entrega directamente por WhatsApp.",
    mercadoPago: { enabled: false, paymentLink: "", alias: "" },
    stripe: { enabled: false, paymentLink: "" },
    paypal: { enabled: false, meLink: "" },
  };

  const updateLayout = (patch: Record<string, any>) => {
    setBiz((prev: any) =>
      prev ? { ...prev, layoutConfig: { ...(prev.layoutConfig || {}), ...patch } } : prev
    );
  };

  // State for product modal (Create / Edit)
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [customColorInput, setCustomColorInput] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open modal to add new product
  const handleAddNew = () => {
    setEditingProduct({
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      nombre: "",
      categoria: "",
      precio: 0,
      descripcion: "",
      imagen: "",
      talles: [],
      colores: [],
      stock: null,
      destacado: false,
      disponible: true,
    });
    setIsModalOpen(true);
  };

  // Open modal to edit existing product
  const handleEdit = (prod: StoreProduct) => {
    setEditingProduct({
      ...prod,
      talles: prod.talles || prod.sizes || [],
      colores: prod.colores || prod.colors || [],
    });
    setIsModalOpen(true);
  };

  // Save edited or new product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.nombre?.trim()) {
      showToast("Ingresa el nombre del producto", "warn");
      return;
    }

    const currentList = [...products];
    const existingIndex = currentList.findIndex((p) => p.id === editingProduct.id);

    if (existingIndex >= 0) {
      currentList[existingIndex] = editingProduct;
      showToast("Producto actualizado", "success");
    } else {
      currentList.unshift(editingProduct);
      showToast("Producto agregado a la tienda", "success");
    }

    updateLayout({ tiendaProductos: currentList });
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  // Delete product
  const handleDeleteProduct = (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    const filtered = products.filter((p) => p.id !== id);
    updateLayout({ tiendaProductos: filtered });
    showToast("Producto eliminado", "info");
  };

  // Toggle product availability
  const handleToggleDisponible = (id: string) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, disponible: p.disponible === false ? true : false } : p
    );
    updateLayout({ tiendaProductos: updated });
  };

  // Toggle product featured
  const handleToggleDestacado = (id: string) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, destacado: !p.destacado } : p
    );
    updateLayout({ tiendaProductos: updated });
  };

  // Upload image to ImgBB
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    showToast("Subiendo imagen a ImgBB...", "info");

    try {
      const url = await uploadToImgBB(file, biz?.id || "unknown");
      setEditingProduct((prev) => (prev ? { ...prev, imagen: url } : prev));
      showToast("Imagen subida con éxito ✓", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Error al subir imagen", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Size helper tags
  const toggleTalle = (size: string) => {
    if (!editingProduct) return;
    const current = editingProduct.talles || [];
    const next = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    setEditingProduct({ ...editingProduct, talles: next });
  };

  const addCustomSize = () => {
    if (!customSizeInput.trim() || !editingProduct) return;
    const size = customSizeInput.trim().toUpperCase();
    const current = editingProduct.talles || [];
    if (!current.includes(size)) {
      setEditingProduct({ ...editingProduct, talles: [...current, size] });
    }
    setCustomSizeInput("");
  };

  // Color helper tags
  const toggleColor = (colorName: string) => {
    if (!editingProduct) return;
    const current = editingProduct.colores || [];
    const next = current.includes(colorName)
      ? current.filter((c) => c !== colorName)
      : [...current, colorName];
    setEditingProduct({ ...editingProduct, colores: next });
  };

  const addCustomColor = () => {
    if (!customColorInput.trim() || !editingProduct) return;
    const color = customColorInput.trim();
    const current = editingProduct.colores || [];
    if (!current.includes(color)) {
      setEditingProduct({ ...editingProduct, colores: [...current, color] });
    }
    setCustomColorInput("");
  };

  // ─────────────────────────────────────────────────────────
  // TAB: PRODUCTOS
  // ─────────────────────────────────────────────────────────
  if (activeTab === "tiendaProductos") {
    return (
      <div className="space-y-4 px-3 pt-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Productos de la Tienda
            </p>
            <p className="text-xs text-slate-400">
              {products.length} productos en catálogo
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md"
          >
            <Ico n="plus" s={14} />
            <span>Nuevo Producto</span>
          </button>
        </div>

        {/* Products List */}
        {products.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 border-dashed">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Ico n="box" s={24} />
            </div>
            <p className="text-sm font-bold text-white mb-1">Aún no tienes productos</p>
            <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
              Comienza agregando tu primer producto con precio, talles, colores e imagen.
            </p>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors"
            >
              + Agregar Primer Producto
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {products.map((item) => {
              const hasTalles = (item.talles || item.sizes || []).length > 0;
              const hasColores = (item.colores || item.colors || []).length > 0;
              const isDisp = item.disponible !== false;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isDisp
                      ? "bg-white/5 border-white/10 hover:border-white/20"
                      : "bg-white/[0.02] border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 overflow-hidden shrink-0">
                      {item.imagen || item.imageUrl ? (
                        <img
                          src={item.imagen || item.imageUrl || ""}
                          alt={item.nombre || item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Ico n="image" s={18} />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-white truncate">
                          {item.nombre || item.name}
                        </h4>
                        {item.destacado && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">
                            ⭐ Destacado
                          </span>
                        )}
                        {!isDisp && (
                          <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded font-bold">
                            Pausado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="font-black text-indigo-400">
                          ${Number(item.precio || item.price || 0).toLocaleString("es-AR")}
                        </span>
                        {item.categoria && (
                          <span className="text-[10px] text-slate-500">• {item.categoria}</span>
                        )}
                        {item.stock !== undefined && item.stock !== null && (
                          <span className="text-[10px] text-slate-500">
                            • Stock: {item.stock}
                          </span>
                        )}
                      </div>

                      {/* Variants tags preview */}
                      {(hasTalles || hasColores) && (
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          {hasTalles && (
                            <span>Talles: {(item.talles || item.sizes || []).join(", ")}</span>
                          )}
                          {hasTalles && hasColores && <span>•</span>}
                          {hasColores && (
                            <span>Colores: {(item.colores || item.colors || []).join(", ")}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleDestacado(String(item.id))}
                        title={item.destacado ? "Quitar de destacados" : "Marcar como destacado"}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          item.destacado ? "text-amber-400 bg-amber-400/10" : "text-slate-500 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Ico n="star" s={13} />
                      </button>
                      <button
                        onClick={() => handleToggleDisponible(String(item.id))}
                        title={isDisp ? "Pausar producto" : "Activar producto"}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isDisp ? "text-emerald-400 bg-emerald-400/10" : "text-slate-500 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Ico n={isDisp ? "check" : "x"} s={13} />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Editar"
                      >
                        <Ico n="edit" s={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(String(item.id))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Eliminar"
                      >
                        <Ico n="trash" s={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── CREATE / EDIT MODAL ─── */}
        {isModalOpen && editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
            <div
              className="bg-[#111827] border border-white/15 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative animate-scaleIn my-auto max-h-[92vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                <h3 className="text-base font-black text-white">
                  {editingProduct.id.startsWith("prod_") ? "Nuevo Producto" : "Editar Producto"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/5 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <Ico n="x" s={14} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                {/* Image Upload Area */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Foto del Producto (ImgBB)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative">
                      {editingProduct.imagen ? (
                        <img
                          src={editingProduct.imagen}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Ico n="image" s={24} c="text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Ico n="upload" s={14} />
                        <span>{isUploadingImage ? "Subiendo..." : "Cargar Imagen"}</span>
                      </button>
                      <input
                        type="url"
                        value={editingProduct.imagen || ""}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, imagen: e.target.value })
                        }
                        placeholder="O pega URL directa de imagen..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Name & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProduct.nombre || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, nombre: e.target.value })
                      }
                      placeholder="Ej: Remera Boxy Fit"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={editingProduct.categoria || ""}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, categoria: e.target.value })
                      }
                      placeholder="Ej: Remeras, Calzado, Accesorios"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Precio ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingProduct.precio || 0}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          precio: Number(e.target.value),
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Stock (Opcional, vacío = Ilimitado)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editingProduct.stock ?? ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          stock: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      placeholder="Ilimitado"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Descripción del Producto
                  </label>
                  <textarea
                    rows={2}
                    value={editingProduct.descripcion || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, descripcion: e.target.value })
                    }
                    placeholder="Materiales, detalles de confección, corte..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Talles / Sizes Section */}
                <div className="space-y-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Talles / Tamaños Disponibles
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {(editingProduct.talles || []).length} seleccionados
                    </span>
                  </div>

                  {/* Quick Clothing Presets */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block">Ropa:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_CLOTHING_SIZES.map((sz) => {
                        const isChecked = (editingProduct.talles || []).includes(sz);
                        return (
                          <button
                            type="button"
                            key={sz}
                            onClick={() => toggleTalle(sz)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              isChecked
                                ? "bg-indigo-600 text-white"
                                : "bg-white/5 text-slate-400 hover:text-white"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Shoe Presets */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block">Calzado:</span>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_SHOE_SIZES.map((sz) => {
                        const isChecked = (editingProduct.talles || []).includes(sz);
                        return (
                          <button
                            type="button"
                            key={sz}
                            onClick={() => toggleTalle(sz)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                              isChecked
                                ? "bg-indigo-600 text-white"
                                : "bg-white/5 text-slate-400 hover:text-white"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Size Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={customSizeInput}
                      onChange={(e) => setCustomSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomSize();
                        }
                      }}
                      placeholder="Otro talle (ej: 46, Único, 500ml)..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={addCustomSize}
                      className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* Colores Section */}
                <div className="space-y-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Colores Disponibles
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {(editingProduct.colores || []).length} seleccionados
                    </span>
                  </div>

                  {/* Preset Colors */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((col) => {
                      const isChecked = (editingProduct.colores || []).includes(col.name);
                      return (
                        <button
                          type="button"
                          key={col.name}
                          onClick={() => toggleColor(col.name)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                            isChecked
                              ? "bg-indigo-600/30 text-white border border-indigo-500"
                              : "bg-white/5 text-slate-400 hover:text-white border border-transparent"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/20"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Color Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={customColorInput}
                      onChange={(e) => setCustomColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomColor();
                        }
                      }}
                      placeholder="Otro color (ej: Bordo, Celeste pastel)..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={addCustomColor}
                      className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.destacado || false}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          destacado: e.target.checked,
                        })
                      }
                      className="accent-indigo-500 rounded"
                    />
                    <span className="text-xs text-white font-medium">⭐ Destacado</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.disponible !== false}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          disponible: e.target.checked,
                        })
                      }
                      className="accent-indigo-500 rounded"
                    />
                    <span className="text-xs text-white font-medium">Disponible</span>
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg"
                  >
                    Guardar Producto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // TAB: CONFIGURACIÓN DE ENVÍOS Y PAGOS
  // ─────────────────────────────────────────────────────────
  if (activeTab === "tiendaConfig") {
    return (
      <div className="space-y-6 px-3 pt-2">
        {/* Envíos y Entregas */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Envíos y Retiros
          </p>

          {/* Toggle Envío a Domicilio */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Envío a Domicilio</p>
                <p className="text-[10px] text-slate-400">
                  Permite a los clientes pedir con entrega en su dirección
                </p>
              </div>
              <input
                type="checkbox"
                checked={envios.permitirEnvio !== false}
                onChange={(e) =>
                  updateLayout({
                    tiendaEnvios: { ...envios, permitirEnvio: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-indigo-500"
              />
            </div>

            {envios.permitirEnvio !== false && (
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                      Costo Fijo de Envío ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={envios.costoEnvio || 0}
                      onChange={(e) =>
                        updateLayout({
                          tiendaEnvios: {
                            ...envios,
                            costoEnvio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                      Envío Gratis a partir de ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={envios.envioGratisDesde ?? ""}
                      onChange={(e) =>
                        updateLayout({
                          tiendaEnvios: {
                            ...envios,
                            envioGratisDesde: e.target.value === "" ? null : Number(e.target.value),
                          },
                        })
                      }
                      placeholder="Ej: 50000 (o vacío)"
                      className="w-full px-3 py-1.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                    Texto / Promesa de Envío
                  </label>
                  <input
                    type="text"
                    value={envios.textoEnvio || ""}
                    onChange={(e) =>
                      updateLayout({
                        tiendaEnvios: { ...envios, textoEnvio: e.target.value },
                      })
                    }
                    placeholder="Ej: Envíos a todo el país por correo y mensajería en 24hs"
                    className="w-full px-3 py-1.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Toggle Retiro en Local */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Retiro por Local / Showroom</p>
                <p className="text-[10px] text-slate-400">
                  Permite a los clientes pasar a retirar su compra sin costo
                </p>
              </div>
              <input
                type="checkbox"
                checked={envios.permitirRetiro !== false}
                onChange={(e) =>
                  updateLayout({
                    tiendaEnvios: { ...envios, permitirRetiro: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-indigo-500"
              />
            </div>

            {envios.permitirRetiro !== false && (
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                    Dirección de Retiro
                  </label>
                  <input
                    type="text"
                    value={envios.direccionRetiro || ""}
                    onChange={(e) =>
                      updateLayout({
                        tiendaEnvios: { ...envios, direccionRetiro: e.target.value },
                      })
                    }
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                    className="w-full px-3 py-1.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                    Horarios de Retiro
                  </label>
                  <input
                    type="text"
                    value={envios.horarioRetiro || ""}
                    onChange={(e) =>
                      updateLayout({
                        tiendaEnvios: { ...envios, horarioRetiro: e.target.value },
                      })
                    }
                    placeholder="Ej: Lunes a Viernes de 10 a 19 hs"
                    className="w-full px-3 py-1.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Métodos de Pago
          </p>

          {/* A acordar con el vendedor (Efectivo/Transferencia) */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">
                  🤝 A Acordar con el Vendedor (Efectivo / Transferencia)
                </p>
                <p className="text-[10px] text-slate-400">
                  Ideal para coordinar pago y entrega directamente por WhatsApp
                </p>
              </div>
              <input
                type="checkbox"
                checked={pagos.acordarVendedor !== false}
                onChange={(e) =>
                  updateLayout({
                    tiendaPagos: { ...pagos, acordarVendedor: e.target.checked },
                  })
                }
                className="w-4 h-4 accent-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                Instrucciones de Pago / Datos Bancarios
              </label>
              <textarea
                rows={2}
                value={pagos.instruccionesAcordar || ""}
                onChange={(e) =>
                  updateLayout({
                    tiendaPagos: { ...pagos, instruccionesAcordar: e.target.value },
                  })
                }
                placeholder="Ej: Coordinamos pago al retirar o por transferencia. Alias: mimarca.tienda"
                className="w-full px-3 py-1.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none resize-none"
              />
            </div>
          </div>

          {/* Mercado Pago */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-sky-400">💳 Mercado Pago</p>
                <p className="text-[10px] text-slate-400">
                  Ofrece pagar con tarjetas, débito o saldo en cuenta
                </p>
              </div>
              <input
                type="checkbox"
                checked={pagos.mercadoPago?.enabled || false}
                onChange={(e) =>
                  updateLayout({
                    tiendaPagos: {
                      ...pagos,
                      mercadoPago: { ...pagos.mercadoPago, enabled: e.target.checked },
                    },
                  })
                }
                className="w-4 h-4 accent-sky-500"
              />
            </div>
            {pagos.mercadoPago?.enabled && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                    Link de Cobro o CVU / Alias de Mercado Pago
                  </label>
                  <input
                    type="text"
                    value={pagos.mercadoPago?.paymentLink || ""}
                    onChange={(e) =>
                      updateLayout({
                        tiendaPagos: {
                          ...pagos,
                          mercadoPago: {
                            ...pagos.mercadoPago,
                            paymentLink: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="https://mpago.la/... o tu Alias / CVU"
                    className="w-full px-3 py-1.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stripe */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-400">💳 Stripe</p>
                <p className="text-[10px] text-slate-400">
                  Enlace de pago Stripe para cobros con tarjetas
                </p>
              </div>
              <input
                type="checkbox"
                checked={pagos.stripe?.enabled || false}
                onChange={(e) =>
                  updateLayout({
                    tiendaPagos: {
                      ...pagos,
                      stripe: { ...pagos.stripe, enabled: e.target.checked },
                    },
                  })
                }
                className="w-4 h-4 accent-purple-500"
              />
            </div>
            {pagos.stripe?.enabled && (
              <div className="pt-2 border-t border-white/5">
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                  Enlace de Pago Stripe (Payment Link)
                </label>
                <input
                  type="url"
                  value={pagos.stripe?.paymentLink || ""}
                  onChange={(e) =>
                    updateLayout({
                      tiendaPagos: {
                        ...pagos,
                        stripe: { ...pagos.stripe, paymentLink: e.target.value },
                      },
                    })
                  }
                  placeholder="https://buy.stripe.com/..."
                  className="w-full px-3 py-1.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none"
                />
              </div>
            )}
          </div>

          {/* PayPal */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-400">🅿️ PayPal</p>
                <p className="text-[10px] text-slate-400">
                  Enlace PayPal.Me para cobros rápidos
                </p>
              </div>
              <input
                type="checkbox"
                checked={pagos.paypal?.enabled || false}
                onChange={(e) =>
                  updateLayout({
                    tiendaPagos: {
                      ...pagos,
                      paypal: { ...pagos.paypal, enabled: e.target.checked },
                    },
                  })
                }
                className="w-4 h-4 accent-blue-500"
              />
            </div>
            {pagos.paypal?.enabled && (
              <div className="pt-2 border-t border-white/5">
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                  Link de PayPal.Me
                </label>
                <input
                  type="text"
                  value={pagos.paypal?.meLink || ""}
                  onChange={(e) =>
                    updateLayout({
                      tiendaPagos: {
                        ...pagos,
                        paypal: { ...pagos.paypal, meLink: e.target.value },
                      },
                    })
                  }
                  placeholder="https://paypal.me/tuusuario"
                  className="w-full px-3 py-1.5 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
