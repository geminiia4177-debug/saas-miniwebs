import React, { useState, useRef } from "react";
import { Ico } from "@/lib/constants";
import { DropZone } from "./DropZone";
import { uploadToImgBB } from "@/lib/utils/upload";


export function ConfiguradorAvanzado({
  biz, setBiz, media, setMedia, showToast, activeTab
}: {
  biz: any;
  setBiz: (fn: (prev: any) => any) => void;
  media: any[];
  setMedia: (fn: (prev: any[]) => any[]) => void;
  showToast: (msg: string, type?: string) => void;
  activeTab: string;
}) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState<number | null>(null);
  const dragFromRef = useRef<{ cat: string; idx: number } | null>(null);

  const layoutConfig = biz?.layoutConfig || {};
  const videoUrl: string   = layoutConfig.videoUrl || "";
  const bookingUrl: string = layoutConfig.bookingUrl || biz?.bookingUrl || "";
  const heroText: string   = layoutConfig.heroText || biz?.heroText || "";

  const updateLayout = (patch: Record<string, any>) =>
    setBiz((prev: any) => prev ? { ...prev, layoutConfig: { ...(prev.layoutConfig || {}), ...patch } } : prev);

  const getListKey = (tab: string) => {
    const map: Record<string, string> = {
      servicios: biz.type === "barberia" ? "barberiaServices" : "services",
      productos: biz.type === "barberia" ? "barberiaProducts" : "products",
    };
    return map[tab] || tab;
  };

  const currentListKey = getListKey(activeTab);
  const currentList = layoutConfig[currentListKey] || [];

  const updateList = (cat: string, list: any[]) => updateLayout({ [cat]: list });

  const addItem = (cat: string) => {
    const base = { id: `item_${Date.now()}`, name: "Nuevo Item", price: "0", duration: 30, description: "", imageUrl: "", active: true };
    updateList(cat, [...(layoutConfig[cat] || []), base]);
  };

  const updateItem = (cat: string, idx: number, patch: Record<string, any>) => {
    const current = [...(layoutConfig[cat] || [])];
    current[idx] = { ...current[idx], ...patch };
    updateList(cat, current);
  };

  const removeItem = (cat: string, idx: number) => {
    updateList(cat, (layoutConfig[cat] || []).filter((_: any, i: number) => i !== idx));
  };

  const toggleActive = (cat: string, idx: number) => {
    const item = (layoutConfig[cat] || [])[idx];
    updateItem(cat, idx, { active: !(item.active !== false) });
  };

  const uploadItemImage = async (cat: string, idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const url = await uploadToImgBB(file);
      updateItem(cat, idx, { imageUrl: url });
      showToast("Imagen actualizada ✓");
    } catch {
      showToast("Error al subir imagen", "error");
    }
    setUploadingIdx(null);
  };

  const handleDragStart = (cat: string, idx: number) => { dragFromRef.current = { cat, idx }; };
  const handleDrop = (cat: string, toIdx: number) => {
    const dragFrom = dragFromRef.current;
    if (!dragFrom || dragFrom.cat !== cat) return;
    const current = [...(layoutConfig[cat] || [])];
    const [removed] = current.splice(dragFrom.idx, 1);
    current.splice(toIdx, 0, removed);
    updateList(cat, current);
    dragFromRef.current = null;
  };

  const renderItemEditor = (
    cat: string,
    items: any[],
    catLabel: string
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{catLabel}</p>
        <span className="text-[10px] text-slate-600">Arrastrá para reordenar</span>
      </div>

      {items.length === 0 && (
        <div className="py-8 text-center rounded-xl text-white/30 text-sm"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          No hay {catLabel.toLowerCase()} aún. Agregá el primero.
        </div>
      )}

      {items.map((item: any, i: number) => (
        <div
          key={item.id || i}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", i.toString());
            handleDragStart(cat, i);
          }}
          onDragEnter={e => e.preventDefault()}
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(cat, i);
          }}
          className="rounded-xl overflow-hidden transition-all"
          style={{
            background: item.active === false ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${item.active === false ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)"}`,
            opacity: item.active === false ? 0.55 : 1,
          }}
        >
          {/* Header del item */}
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Drag handle */}
            <span className="cursor-grab text-slate-600">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 8h16M4 16h16"/>
              </svg>
            </span>

            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              {item.imageUrl
                ? <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                : <div className="w-full h-full flex items-center justify-center text-xl">{item.emoji || "📷"}</div>
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{item.name || "Sin nombre"}</p>
              <p className="text-[11px] text-slate-500">
                {item.price ? `$${item.price}` : "Sin precio"}
                {item.duration ? ` · ${item.duration}min` : ""}
              </p>
            </div>

            {/* Toggle activo/inactivo */}
            <button
              onClick={() => toggleActive(cat, i)}
              title={item.active === false ? "Activar" : "Desactivar"}
              className="w-9 h-5 rounded-full relative flex-shrink-0 transition-colors"
              style={{ background: item.active === false ? "rgba(255,255,255,0.08)" : "#6366f1" }}
            >
              <div
                className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all"
                style={{ left: item.active === false ? "3px" : "19px" }}
              />
            </button>

            {/* Eliminar */}
            <button
              onClick={() => removeItem(cat, i)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>

          {/* Campos editables */}
          <div className="px-4 pb-4 grid grid-cols-2 gap-2.5 border-t border-white/5 pt-3">
            {/* Imagen */}
            <div className="col-span-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1.5 block">Foto del {catLabel.slice(0, -1).toLowerCase()}</label>
              <DropZone onFiles={files => uploadItemImage(cat, i, files[0])} multiple={false} compact>
                {uploadingIdx === i
                  ? <div className="flex flex-col items-center gap-1 p-2">
                      <Ico n="loader" s={16} c="text-indigo-400 animate-spin" />
                      <span className="text-[9px] text-slate-400">Subiendo...</span>
                    </div>
                  : item.imageUrl
                    ? <div className="relative w-full h-16 rounded-lg overflow-hidden group">
                        <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] text-white font-bold">Cambiar foto</span>
                        </div>
                      </div>
                    : <div className="flex flex-col items-center gap-1 p-2">
                        <Ico n="upload" s={16} c="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-[9px] text-slate-400 group-hover:text-indigo-300">Subir foto</span>
                      </div>
                }
              </DropZone>
              {item.imageUrl && (
                <button onClick={() => updateItem(cat, i, { imageUrl: "" })}
                  className="text-[9px] text-red-400/50 hover:text-red-400 transition-colors mt-1">
                  Quitar foto
                </button>
              )}
            </div>

            {/* Nombre */}
            <div className="col-span-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Nombre</label>
              <input
                value={item.name || item.nombre || ""} placeholder="Nombre..."
                onChange={e => updateItem(cat, i, { name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>

            {/* Precio */}
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Precio ($)</label>
              <input
                value={item.price || item.precio || ""} placeholder="2500"
                onChange={e => updateItem(cat, i, { price: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>

            {/* Duración */}
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Duración (min)</label>
              <input
                type="number" value={item.duration || ""} placeholder="30"
                onChange={e => updateItem(cat, i, { duration: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>

            {/* Descripción */}
            <div className="col-span-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Descripción breve</label>
              <input
                value={item.desc || item.description || item.descripcion || ""} placeholder="Descripción corta..."
                onChange={e => updateItem(cat, i, { description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => addItem(cat)}
        className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors"
        style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}
      >
        + Agregar {catLabel.slice(0, -1).toLowerCase()}
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2 space-y-4">

        {/* ── ITEMS GENERIC ── */}
        {!["galeria", "video", "generalConfig", "menuCategorias", "vehiculos"].includes(activeTab) && renderItemEditor(currentListKey, currentList, activeTab.toUpperCase())}

        {/* ── NESTED CATEGORIES / VEHICLES ── */}
        {(activeTab === "menuCategorias" || activeTab === "vehiculos") && (() => {
          const isVehiculos = activeTab === "vehiculos";
          const catLabel = isVehiculos ? "VEHÍCULO" : "CATEGORÍA";
          const catsLabel = isVehiculos ? "VEHÍCULOS" : "CATEGORÍAS DEL MENÚ";
          const prodLabel = isVehiculos ? "LAVADO" : "PRODUCTO";
          const prodsLabel = isVehiculos ? "LAVADOS" : "PRODUCTOS";
          return (
          <div className="space-y-4">
            {selectedCategoryIdx === null ? (
              // VISTA DE CATEGORIAS
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{catsLabel}</p>
                </div>
                {currentList.map((catItem: any, i: number) => (
                  <div key={i} className="rounded-xl overflow-hidden transition-all p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl overflow-hidden relative">
                        {catItem.imageUrl ? <img src={catItem.imageUrl} className="w-full h-full object-cover" /> : (catItem.emoji || "📁")}
                      </div>
                      <div className="flex-1">
                        <input value={catItem.name || ""} placeholder={`Nombre ${catLabel}`} onChange={e => {
                          const newList = [...currentList];
                          newList[i] = { ...newList[i], name: e.target.value };
                          updateList(currentListKey, newList);
                        }} className="w-full bg-transparent text-white font-bold outline-none" />
                        <p className="text-[10px] text-slate-400">{(catItem.products || []).length} {prodsLabel.toLowerCase()}</p>
                      </div>
                      <button onClick={() => removeItem(currentListKey, i)} className="text-red-400/50 hover:text-red-400 p-2"><Ico n="trash" s={14}/></button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedCategoryIdx(i)} className="flex-1 bg-indigo-500/20 text-indigo-300 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-500/40 transition">Ver {prodsLabel}</button>
                    </div>
                    {/* Background Image Upload for Category */}
                    <div className="mt-2 pt-2 border-t border-white/10">
                       <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Imagen de fondo (Opcional)</label>
                       <DropZone onFiles={async (files) => {
                          setUploadingIdx(i);
                          try {
                            const url = await uploadToImgBB(files[0]);
                            const newList = [...currentList];
                            newList[i] = { ...newList[i], imageUrl: url };
                            updateList(currentListKey, newList);
                            showToast("Fondo actualizado");
                          } catch {}
                          setUploadingIdx(null);
                       }} multiple={false} compact>
                          {uploadingIdx === i ? <span className="text-xs text-indigo-400">Subiendo...</span> : <span className="text-[10px] text-slate-400">Subir imagen sin fondo</span>}
                       </DropZone>
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  updateList(currentListKey, [...currentList, { id: `cat_${Date.now()}`, name: `Nuevo ${catLabel}`, emoji: "⭐", products: [] }]);
                }} className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors" style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>+ Agregar {catLabel}</button>
              </div>
            ) : (
              // VISTA DE PRODUCTOS DE LA CATEGORIA
              <div className="space-y-3">
                <button onClick={() => setSelectedCategoryIdx(null)} className="flex items-center gap-2 text-xs text-indigo-400 hover:text-white mb-2">
                  <Ico n="chevron-left" s={14} /> Volver a {catsLabel}
                </button>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{prodsLabel}: {currentList[selectedCategoryIdx]?.name}</p>
                </div>
                {(currentList[selectedCategoryIdx]?.products || []).map((prod: any, pIdx: number) => (
                  <div key={pIdx} className="rounded-xl overflow-hidden transition-all p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="flex items-center gap-3">
                       {prod.imageUrl ? (
                         <div className="w-10 h-10 rounded-lg overflow-hidden relative"><img src={prod.imageUrl} className="w-full h-full object-cover" /></div>
                       ) : (
                         <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">{prod.emoji || "⭐"}</div>
                       )}
                       <div className="flex-1">
                         <input value={prod.name || ""} placeholder="Nombre" onChange={e => {
                           const newList = [...currentList];
                           newList[selectedCategoryIdx].products[pIdx] = { ...prod, name: e.target.value };
                           updateList(currentListKey, newList);
                         }} className="w-full bg-transparent text-white font-bold outline-none text-sm" />
                       </div>
                       <button onClick={() => {
                          const newList = [...currentList];
                          newList[selectedCategoryIdx].products = newList[selectedCategoryIdx].products.filter((_: any, i: number) => i !== pIdx);
                          updateList(currentListKey, newList);
                       }} className="text-red-400/50 hover:text-red-400"><Ico n="trash" s={14}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div>
                         <label className="text-[9px] font-bold text-slate-500 uppercase block">Precio</label>
                         <input value={prod.price || ""} onChange={e => {
                           const newList = [...currentList];
                           newList[selectedCategoryIdx].products[pIdx] = { ...prod, price: e.target.value };
                           updateList(currentListKey, newList);
                         }} className="w-full px-2 py-1 rounded-lg text-xs text-white bg-white/5 border border-white/10" placeholder="0" />
                       </div>
                       <div>
                         <label className="text-[9px] font-bold text-slate-500 uppercase block">Descripción</label>
                         <input value={prod.description || ""} onChange={e => {
                           const newList = [...currentList];
                           newList[selectedCategoryIdx].products[pIdx] = { ...prod, description: e.target.value };
                           updateList(currentListKey, newList);
                         }} className="w-full px-2 py-1 rounded-lg text-xs text-white bg-white/5 border border-white/10" placeholder="Detalle..." />
                       </div>
                    </div>
                    {isVehiculos && (
                      <div className="mt-2">
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Duración (minutos)</label>
                        <input value={prod.duration || ""} onChange={e => {
                          const newList = [...currentList];
                          newList[selectedCategoryIdx].products[pIdx] = { ...prod, duration: Number(e.target.value) };
                          updateList(currentListKey, newList);
                        }} type="number" className="w-full px-2 py-1 rounded-lg text-xs text-white bg-white/5 border border-white/10" placeholder="30" />
                      </div>
                    )}
                    <div>
                       <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Foto del {prodLabel.toLowerCase()}</label>
                       <DropZone onFiles={async (files) => {
                          setUploadingIdx(pIdx + 1000); // offset to avoid conflict
                          try {
                            const url = await uploadToImgBB(files[0]);
                            const newList = [...currentList];
                            newList[selectedCategoryIdx].products[pIdx] = { ...prod, imageUrl: url };
                            updateList(currentListKey, newList);
                          } catch {}
                          setUploadingIdx(null);
                       }} multiple={false} compact>
                          {uploadingIdx === (pIdx + 1000) ? <span className="text-[9px] text-indigo-400">Subiendo...</span> : <span className="text-[9px] text-slate-400">Subir foto</span>}
                       </DropZone>
                    </div>
                  </div>
                ))}
                <button onClick={() => {
                  const newList = [...currentList];
                  if (!newList[selectedCategoryIdx].products) newList[selectedCategoryIdx].products = [];
                  newList[selectedCategoryIdx].products.push({ id: `prod_${Date.now()}`, name: `Nuevo ${prodLabel}`, price: "0", duration: 30, description: "", imageUrl: "" });
                  updateList(currentListKey, newList);
                }} className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors" style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>+ Agregar {prodLabel}</button>
              </div>
            )}
          </div>
          );
        })()}



        {/* ── VIDEO ── */}
        {activeTab === "video" && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">URL de YouTube</label>
              <input
                value={videoUrl}
                placeholder="https://youtube.com/watch?v=..."
                onChange={e => updateLayout({ videoUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-slate-500 mt-2">
                Soporta: youtube.com/watch, youtu.be, /shorts y /embed
              </p>
            </div>

            {videoUrl && (
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(99,102,241,0.3)" }}>
                <div style={{ paddingTop: "56.25%", position: "relative", background: "#000" }}>
                  {/* Preview mínimo */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                      <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <p className="text-white/50 text-xs">Video cargado. Se verá en la página.</p>
                    <p className="text-slate-500 text-[10px] max-w-[200px] text-center truncate">{videoUrl}</p>
                  </div>
                </div>
              </div>
            )}

            {videoUrl && (
              <button
                onClick={() => updateLayout({ videoUrl: "" })}
                className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
              >
                Quitar video
              </button>
            )}
          </div>
        )}

        {/* ── CONFIG (textos y reserva) ── */}
        {activeTab === "generalConfig" && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Textos del Hero</p>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1.5 block">Tagline (debajo del logo)</label>
              <input
                value={biz?.tagline || ""} placeholder="Barbería de autor"
                onChange={e => setBiz((prev: any) => prev ? { ...prev, tagline: e.target.value } : prev)}
                className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1.5 block">Texto del Hero</label>
              <textarea
                value={heroText} placeholder="Reservá tu turno online en segundos..."
                rows={3}
                onChange={e => {
                  setBiz((prev: any) => prev ? { ...prev, heroText: e.target.value } : prev);
                  updateLayout({ heroText: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none resize-none"
              />
            </div>

            <div className="h-px bg-white/5" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Botón de Reserva</p>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1.5 block">URL de reserva externa (opcional)</label>
              <input
                value={bookingUrl} placeholder="https://calendly.com/tu-barberia"
                onChange={e => {
                  setBiz((prev: any) => prev ? { ...prev, bookingUrl: e.target.value } : prev);
                  updateLayout({ bookingUrl: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
              />
              <p className="text-[10px] text-slate-600 mt-1">Si dejás en blanco, el botón abre WhatsApp.</p>
            </div>

            <div className="h-px bg-white/5" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mapa</p>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1.5 block">Dirección</label>
              <input
                value={biz?.layoutConfig?.address || biz?.address || ""} placeholder="Av. Corrientes 1234, CABA"
                onChange={e => {
                  setBiz((prev: any) => prev ? { ...prev, address: e.target.value } : prev);
                  updateLayout({ address: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1.5 block">URL embed de Google Maps</label>
              <input
                value={biz?.layoutConfig?.mapUrl || biz?.mapUrl || ""} placeholder="https://maps.google.com/embed?..."
                onChange={e => {
                  setBiz((prev: any) => prev ? { ...prev, mapUrl: e.target.value } : prev);
                  updateLayout({ mapUrl: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
              />
              <p className="text-[10px] text-slate-600 mt-1">
                En Google Maps → Compartir → Insertar un mapa → copiá el URL del iframe.
              </p>
            </div>
            
            <div className="h-px bg-white/5 mt-4" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Contacto Adicional</p>
            <label className="flex items-center gap-3 cursor-pointer mt-2 mb-4">
              <div onClick={() => updateLayout({ showEmailFooter: biz?.layoutConfig?.showEmailFooter === false ? true : false })}
                className="w-10 h-5 rounded-full relative transition-colors cursor-pointer flex-shrink-0"
                style={{ background: biz?.layoutConfig?.showEmailFooter !== false ? "#6366f1" : "rgba(255,255,255,0.08)" }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: biz?.layoutConfig?.showEmailFooter !== false ? "22px" : "2px" }} />
              </div>
              <span className="text-xs text-white">Mostrar Email en el Footer</span>
            </label>
            
            <div className="h-px bg-white/5 mt-4" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Transferencias Bancarias</p>
            
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1.5 block">Datos Bancarios para Transferencias</label>
              <textarea
                value={layoutConfig.bankDetails || ""}
                placeholder="Ej: Banco Santander, Cuenta 123456, CLABE 123456789012345678, A nombre de Juan Pérez"
                rows={4}
                onChange={e => updateLayout({ bankDetails: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none resize-none"
              />
              <p className="text-[10px] text-slate-600 mt-1">Si completas este campo, los clientes podrán elegir pagar por transferencia y recibirán estos datos.</p>
            </div>

            <div className="h-px bg-white/5 mt-4" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Mensajes de WhatsApp</p>
            <p className="text-[10px] text-slate-500 mb-4">Variables: {'{{cliente}}'}, {'{{negocio}}'}, {'{{fecha}}'}, {'{{hora}}'}, {'{{servicio}}'}, {'{{referencia}}'}, {'{{datos_bancarios}}'}</p>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1.5 block">Mensaje Normal (Abono en local)</label>
              <textarea
                value={layoutConfig.waTemplateConfirmed || ""}
                placeholder="¡Hola! {{cliente}} tu turno en {{negocio}} quedó confirmado..."
                rows={3}
                onChange={e => updateLayout({ waTemplateConfirmed: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1.5 block">Mensaje para Transferencia</label>
              <textarea
                value={layoutConfig.waTemplateTransfer || ""}
                placeholder="¡Hola! {{cliente}} para confirmar tu turno, transfiere a {{datos_bancarios}} y pon el código {{referencia}} en el concepto."
                rows={4}
                onChange={e => updateLayout({ waTemplateTransfer: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none resize-none"
              />
            </div>

            <div className="h-px bg-white/5 mt-4" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Chatbot de IA</p>
            
            <label className="flex items-center gap-3 cursor-pointer mt-2 mb-4">
              <div onClick={() => updateLayout({ chatbotEnabled: layoutConfig.chatbotEnabled === false ? true : false })}
                className="w-10 h-5 rounded-full relative transition-colors cursor-pointer flex-shrink-0"
                style={{ background: layoutConfig.chatbotEnabled !== false ? "#6366f1" : "rgba(255,255,255,0.08)" }}>
                <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: layoutConfig.chatbotEnabled !== false ? "22px" : "2px" }} />
              </div>
              <span className="text-xs text-white">Habilitar Chatbot de IA</span>
            </label>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase mb-1.5 block">Nombre del Robot</label>
              <input
                value={layoutConfig.chatbotName || ""} placeholder="Ej: Robotito"
                onChange={e => updateLayout({ chatbotName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
                disabled={layoutConfig.chatbotEnabled === false}
              />
            </div>
            
            <div className="h-px bg-white/5 mt-4" />
          </div>
        )}
      </div>
    </div>
  );
}
