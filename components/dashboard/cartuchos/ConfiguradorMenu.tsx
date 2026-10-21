"use client";

import React, { useState } from "react";
import { uploadImage } from "@/lib/utils/upload";
import { Ico } from "@/lib/constants";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  imageUrl?: string;
  disponible?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  emoji?: string;
  imageUrl?: string;
  products?: MenuItem[];
}

export default function ConfiguradorMenu({
  biz,
  setBiz,
  showToast,
  activeTab = "menuCategorias",
}: any) {
  const layoutConfig = biz?.layoutConfig || {};
  const categories: MenuCategory[] = layoutConfig.menuCategorias || [];
  const [selectedCatIdx, setSelectedCatIdx] = useState<number | null>(null);
  const [uploadingDishKey, setUploadingDishKey] = useState<string | null>(null);
  const [internalView, setInternalView] = useState<"items" | "config">(
    activeTab === "menuConfig" ? "config" : "items"
  );

  const updateLayout = (patch: Record<string, any>) => {
    setBiz((prev: any) =>
      prev
        ? {
            ...prev,
            layoutConfig: {
              ...(prev.layoutConfig || {}),
              ...patch,
            },
          }
        : prev
    );
  };

  const updateCategories = (newCategories: MenuCategory[]) => {
    updateLayout({ menuCategorias: newCategories });
  };

  const modosDisponibles: string[] = layoutConfig.modosDisponibles || ["local", "delivery", "llevar"];

  const toggleModo = (modo: string) => {
    let next = [...modosDisponibles];
    if (next.includes(modo)) {
      next = next.filter((m) => m !== modo);
    } else {
      next.push(modo);
    }
    updateLayout({ modosDisponibles: next });
  };

  const handleAddCategory = () => {
    const newCat: MenuCategory = {
      id: `cat_${Date.now()}`,
      name: "Nueva Categoría",
      emoji: "🍽️",
      products: [],
    };
    updateCategories([...categories, newCat]);
    setSelectedCatIdx(categories.length);
  };

  const handleDeleteCategory = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = categories.filter((_, i) => i !== idx);
    updateCategories(next);
    if (selectedCatIdx === idx) setSelectedCatIdx(null);
    else if (selectedCatIdx !== null && selectedCatIdx > idx) {
      setSelectedCatIdx(selectedCatIdx - 1);
    }
  };

  const handleAddDish = (catIdx: number) => {
    const next = [...categories];
    const cat = next[catIdx];
    const newDish: MenuItem = {
      id: `dish_${Date.now()}`,
      name: "Nuevo Plato",
      price: 0,
      description: "",
      disponible: true,
      imageUrl: "",
    };
    cat.products = [...(cat.products || []), newDish];
    updateCategories(next);
  };

  const handleUpdateDish = (
    catIdx: number,
    dishIdx: number,
    patch: Partial<MenuItem>
  ) => {
    const next = [...categories];
    const cat = next[catIdx];
    const dishes = [...(cat.products || [])];
    dishes[dishIdx] = { ...dishes[dishIdx], ...patch };
    cat.products = dishes;
    updateCategories(next);
  };

  const handleDeleteDish = (catIdx: number, dishIdx: number) => {
    const next = [...categories];
    const cat = next[catIdx];
    cat.products = (cat.products || []).filter((_, i) => i !== dishIdx);
    updateCategories(next);
  };

  const handleUploadDishPhoto = async (
    file: File,
    catIdx: number,
    dishIdx: number
  ) => {
    const key = `${catIdx}_${dishIdx}`;
    setUploadingDishKey(key);
    try {
      const url = await uploadImage(file, biz.id);
      handleUpdateDish(catIdx, dishIdx, { imageUrl: url });
      if (showToast) showToast("Foto subida con éxito", "success");
    } catch (err: any) {
      if (showToast) showToast(err.message || "Error al subir foto", "error");
    } finally {
      setUploadingDishKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Sub-header selector: Categorías vs Modalidades ── */}
      <div className="flex items-center gap-1 p-1 bg-[#181B26] border border-white/[0.08] rounded-xl">
        <button
          type="button"
          onClick={() => setInternalView("items")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
            internalView === "items"
              ? "bg-[#6366F1] text-white shadow-sm"
              : "text-[#94A3B8] hover:text-white"
          }`}
        >
          📋 Platos y Categorías
        </button>
        <button
          type="button"
          onClick={() => setInternalView("config")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
            internalView === "config"
              ? "bg-[#6366F1] text-white shadow-sm"
              : "text-[#94A3B8] hover:text-white"
          }`}
        >
          🛵 Entrega y Reservas
        </button>
      </div>

      {/* ── 1. MODALIDADES DE ENTREGA Y AJUSTES ── */}
      {internalView === "config" && (
        <div className="space-y-4 rounded-2xl bg-[#11131A] border border-white/[0.08] p-4">
          <div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
              Modalidades de Pedido
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "local", label: "Consumo Local", icon: "🍽️" },
                { id: "delivery", label: "Delivery", icon: "🛵" },
                { id: "llevar", label: "Takeaway", icon: "🛍️" },
              ].map(({ id, label, icon }) => {
                const active = modosDisponibles.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleModo(id)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                      active
                        ? "bg-[#181B26] border-[#6366F1] text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                        : "bg-[#181B26]/50 border-white/[0.08] text-[#64748B] hover:text-[#94A3B8]"
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="text-[11px] font-semibold">{label}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        active
                          ? "bg-[#6366F1]/20 text-[#6366F1]"
                          : "bg-white/5 text-[#64748B]"
                      }`}
                    >
                      {active ? "Activo" : "Inactivo"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
              Aviso o Cobertura de Delivery
            </label>
            <input
              type="text"
              value={layoutConfig.deliveryRadio || ""}
              onChange={(e) => updateLayout({ deliveryRadio: e.target.value })}
              placeholder="Ej: Envíos en radio de 4km · Costo fijo $500"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-[#181B26] border border-white/[0.08] focus:border-[#6366F1] outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181B26] border border-white/[0.08]">
            <div>
              <p className="text-xs font-bold text-white">Reserva de Mesas Online</p>
              <p className="text-[11px] text-[#94A3B8]">
                Permitir a los comensales reservar mesa desde la web
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateLayout({
                  reservaMesaActiva: layoutConfig.reservaMesaActiva === false ? true : false,
                })
              }
              className={`w-11 h-6 rounded-full relative transition-colors p-0.5 ${
                layoutConfig.reservaMesaActiva !== false ? "bg-[#6366F1]" : "bg-white/10"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  layoutConfig.reservaMesaActiva !== false ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* ── 2. GESTOR DE CATEGORÍAS Y PLATOS ── */}
      {internalView === "items" && (
        <div className="space-y-3">
          {selectedCatIdx === null ? (
            /* Vista 1: Lista de Categorías */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  Categorías del Menú ({categories.length})
                </p>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-1.5 rounded-lg bg-[#6366F1]/15 hover:bg-[#6366F1]/25 text-[#6366F1] font-bold text-xs flex items-center gap-1.5 transition-colors border border-[#6366F1]/30"
                >
                  <Ico n="plus" s={13} />
                  <span>Nueva Categoría</span>
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl bg-[#11131A] border border-dashed border-white/10">
                  <p className="text-2xl mb-1">🍔</p>
                  <p className="text-sm font-semibold text-white">Tu menú no tiene categorías</p>
                  <p className="text-xs text-[#94A3B8] mt-1 mb-4">
                    Agrega categorías como &quot;Hamburguesas&quot;, &quot;Pizzas&quot; o &quot;Bebidas&quot;.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2 rounded-xl bg-[#6366F1] text-white font-bold text-xs"
                  >
                    + Crear Primera Categoría
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat, idx) => (
                    <div
                      key={cat.id || idx}
                      className="p-3.5 rounded-xl bg-[#11131A] border border-white/[0.08] hover:border-white/20 transition-all flex items-center gap-3 group"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedCatIdx(idx)}
                        className="w-10 h-10 rounded-lg bg-[#181B26] border border-white/[0.08] flex items-center justify-center text-xl shrink-0 overflow-hidden"
                      >
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          cat.emoji || "🍽️"
                        )}
                      </button>

                      <div className="flex-1 min-w-0" onClick={() => setSelectedCatIdx(idx)}>
                        <input
                          type="text"
                          value={cat.name || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const next = [...categories];
                            next[idx] = { ...next[idx], name: e.target.value };
                            updateCategories(next);
                          }}
                          className="w-full bg-transparent font-bold text-sm text-white focus:outline-none"
                          placeholder="Nombre de categoría"
                        />
                        <p className="text-[11px] text-[#94A3B8]">
                          {(cat.products || []).length} platos · Clic para editar
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCatIdx(idx)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-colors"
                        >
                          Ver Platos
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCategory(idx, e)}
                          className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Ico n="trash" s={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Vista 2: Platos de la Categoría Seleccionada */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedCatIdx(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#6366F1] hover:text-white transition-colors"
                >
                  <Ico n="chevron-left" s={14} />
                  <span>Volver a Categorías</span>
                </button>
                <p className="text-[11px] font-semibold text-[#94A3B8] truncate max-w-[200px]">
                  {categories[selectedCatIdx]?.name}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#11131A] border border-white/[0.08] space-y-2">
                <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                  Nombre de Categoría
                </label>
                <input
                  type="text"
                  value={categories[selectedCatIdx]?.name || ""}
                  onChange={(e) => {
                    const next = [...categories];
                    next[selectedCatIdx] = {
                      ...next[selectedCatIdx],
                      name: e.target.value,
                    };
                    updateCategories(next);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white bg-[#181B26] border border-white/[0.08] focus:border-[#6366F1] outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  Platos / Productos ({(categories[selectedCatIdx]?.products || []).length})
                </p>
                <button
                  type="button"
                  onClick={() => handleAddDish(selectedCatIdx)}
                  className="px-3 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Ico n="plus" s={13} />
                  <span>Agregar Plato</span>
                </button>
              </div>

              {(categories[selectedCatIdx]?.products || []).length === 0 ? (
                <div className="text-center py-6 px-4 rounded-2xl bg-[#11131A] border border-dashed border-white/10">
                  <p className="text-xs text-[#94A3B8] mb-3">Esta categoría aún no tiene platos.</p>
                  <button
                    type="button"
                    onClick={() => handleAddDish(selectedCatIdx)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#6366F1]/20 text-[#6366F1] font-bold text-xs border border-[#6366F1]/30"
                  >
                    + Agregar Primer Plato
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(categories[selectedCatIdx]?.products || []).map((dish, dIdx) => {
                    const uploadKey = `${selectedCatIdx}_${dIdx}`;
                    const isUploading = uploadingDishKey === uploadKey;

                    return (
                      <div
                        key={dish.id || dIdx}
                        className="p-3.5 rounded-xl bg-[#11131A] border border-white/[0.08] space-y-3"
                      >
                        {/* Cabecera del plato: foto + nombre + botón eliminar */}
                        <div className="flex items-center gap-3">
                          <label className="w-12 h-12 rounded-xl bg-[#181B26] border border-white/[0.08] relative overflow-hidden flex items-center justify-center cursor-pointer shrink-0 group">
                            {dish.imageUrl ? (
                              <img
                                src={dish.imageUrl}
                                alt=""
                                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                              />
                            ) : (
                              <span className="text-lg">📷</span>
                            )}
                            {isUploading && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-bold">
                                ...
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadDishPhoto(f, selectedCatIdx, dIdx);
                              }}
                            />
                          </label>

                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={dish.name || ""}
                              onChange={(e) =>
                                handleUpdateDish(selectedCatIdx, dIdx, {
                                  name: e.target.value,
                                })
                              }
                              placeholder="Nombre del plato"
                              className="w-full bg-transparent font-bold text-sm text-white focus:outline-none"
                            />
                            <p className="text-[10px] text-[#64748B]">
                              Toca el recuadro para cambiar foto
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteDish(selectedCatIdx, dIdx)}
                            className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Ico n="trash" s={14} />
                          </button>
                        </div>

                        {/* Descripción del plato */}
                        <div>
                          <textarea
                            value={dish.description || ""}
                            onChange={(e) =>
                              handleUpdateDish(selectedCatIdx, dIdx, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Descripción de ingredientes, alérgenos..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl text-xs text-white bg-[#181B26] border border-white/[0.08] focus:border-[#6366F1] outline-none resize-none"
                          />
                        </div>

                        {/* Precio y Toggle de Disponibilidad */}
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-[#94A3B8] uppercase block mb-1">
                              Precio ($)
                            </label>
                            <input
                              type="text"
                              value={dish.price ?? ""}
                              onChange={(e) =>
                                handleUpdateDish(selectedCatIdx, dIdx, {
                                  price: e.target.value,
                                })
                              }
                              placeholder="0"
                              className="w-full px-3 py-1.5 rounded-lg text-sm text-white bg-[#181B26] border border-white/[0.08] focus:border-[#6366F1] outline-none font-bold"
                            />
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-[#94A3B8] uppercase mb-1">
                              Disponible
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateDish(selectedCatIdx, dIdx, {
                                  disponible: dish.disponible === false ? true : false,
                                })
                              }
                              className={`w-10 h-5 rounded-full relative transition-colors p-0.5 ${
                                dish.disponible !== false ? "bg-[#10B981]" : "bg-white/10"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                  dish.disponible !== false ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
