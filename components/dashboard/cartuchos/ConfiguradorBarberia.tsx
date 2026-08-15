"use client";

import React, { useState } from "react";
import { Ico } from "@/lib/constants";

export default function ConfiguradorBarberia({ biz, setBiz }: { biz: any, setBiz: any }) {
  const [tab, setTab] = useState<"servicios" | "productos" | "reseñas" | "faqs">("servicios");
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragEnabledIdx, setDragEnabledIdx] = useState<{list: string, idx: number} | null>(null);
  const [uploadingImg, setUploadingImg] = useState<string | null>(null);

  const servicios = biz.layoutConfig?.barberiaServices || [];
  const productos = biz.layoutConfig?.barberiaProducts || [];
  const testimonios = biz.layoutConfig?.barberiaTestimonios || [];
  const faqs = biz.layoutConfig?.faqs || [];

  const updateLayoutConfig = (key: string, value: any) => {
    setBiz((prev: any) => ({ ...prev, layoutConfig: { ...(prev.layoutConfig || {}), [key]: value } }));
  };

  // ── SUBIDA DE FOTOS ──
  const handleImageUpload = async (file: File, id: string, listType: "servicios" | "productos") => {
    setUploadingImg(id);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("businessId", biz.id);
    try {
      const res = await fetch(`/api/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        const currentList = listType === "servicios" ? servicios : productos;
        const updated = currentList.map((item: any) => item.id === id ? { ...item, imageUrl: data.url } : item);
        updateLayoutConfig(listType === "servicios" ? "barberiaServices" : "barberiaProducts", updated);
      }
    } catch (error) {
      console.error("Error al subir imagen");
    }
    setUploadingImg(null);
  };

  // ── DRAG AND DROP LÓGICA ──
  const handleDrop = (targetIdx: number, listType: "servicios" | "productos" | "reseñas" | "faqs") => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const currentList = listType === "servicios" ? [...servicios] : listType === "productos" ? [...productos] : listType === "reseñas" ? [...testimonios] : [...faqs];
    const [removed] = currentList.splice(draggedIdx, 1);
    currentList.splice(targetIdx, 0, removed);
    updateLayoutConfig(listType === "servicios" ? "barberiaServices" : listType === "productos" ? "barberiaProducts" : listType === "reseñas" ? "barberiaTestimonios" : "faqs", currentList);
    setDraggedIdx(null);
  };

  // ── ABM BÁSICO ──
  const addServicio = () => updateLayoutConfig("barberiaServices", [...servicios, { id: Date.now().toString(), name: "Nuevo Corte", price: 5000, duration: 40, desc: "", imageUrl: "" }]);
  const updateServicio = (id: string, field: string, val: any) => updateLayoutConfig("barberiaServices", servicios.map((s: any) => s.id === id ? { ...s, [field]: val } : s));
  const deleteServicio = (id: string) => updateLayoutConfig("barberiaServices", servicios.filter((s: any) => s.id !== id));

  const addProducto = () => updateLayoutConfig("barberiaProducts", [...productos, { id: Date.now().toString(), name: "Nuevo Producto", price: 8000, stock: 10, imageUrl: "" }]);
  const updateProducto = (id: string, field: string, val: any) => updateLayoutConfig("barberiaProducts", productos.map((p: any) => p.id === id ? { ...p, [field]: val } : p));
  const deleteProducto = (id: string) => updateLayoutConfig("barberiaProducts", productos.filter((p: any) => p.id !== id));

  const addTestimonio = () => updateLayoutConfig("barberiaTestimonios", [...testimonios, { id: Date.now().toString(), name: "Cliente Feliz", text: "Excelente atención y muy buen corte.", rating: 5 }]);
  const updateTestimonio = (id: string, field: string, val: any) => updateLayoutConfig("barberiaTestimonios", testimonios.map((t: any) => t.id === id ? { ...t, [field]: val } : t));
  const deleteTestimonio = (id: string) => updateLayoutConfig("barberiaTestimonios", testimonios.filter((t: any) => t.id !== id));

  const addFaq = () => updateLayoutConfig("faqs", [...faqs, { id: Date.now().toString(), question: "Nueva Pregunta", answer: "Respuesta a la pregunta." }]);
  const updateFaq = (id: string, field: string, val: any) => updateLayoutConfig("faqs", faqs.map((f: any) => f.id === id ? { ...f, [field]: val } : f));
  const deleteFaq = (id: string) => updateLayoutConfig("faqs", faqs.filter((f: any) => f.id !== id));

  return (
    <div className="flex flex-col h-full">
      {/* PESTAÑAS */}
      <div className="flex gap-1 p-1 mx-3 mt-3 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-hide" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => setTab("servicios")} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={tab === "servicios" ? { background: "rgba(99,102,241,0.2)", color: "#fff" } : { color: "#64748b" }}>Servicios</button>
        <button onClick={() => setTab("productos")} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={tab === "productos" ? { background: "rgba(99,102,241,0.2)", color: "#fff" } : { color: "#64748b" }}>Productos</button>
        <button onClick={() => setTab("reseñas")} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={tab === "reseñas" ? { background: "rgba(99,102,241,0.2)", color: "#fff" } : { color: "#64748b" }}>Reseñas</button>
        <button onClick={() => setTab("faqs")} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={tab === "faqs" ? { background: "rgba(99,102,241,0.2)", color: "#fff" } : { color: "#64748b" }}>FAQs</button>
      </div>

      <div className="p-3 overflow-y-auto flex-1 space-y-3 pb-24">
        
        {/* LISTA DE SERVICIOS */}
        {tab === "servicios" && (
          <div className="space-y-3 animate-fadeIn">
            {servicios.map((s: any, idx: number) => (
              <div key={s.id} draggable={dragEnabledIdx?.list === "servicios" && dragEnabledIdx?.idx === idx} onDragStart={() => setDraggedIdx(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(idx, "servicios")}
                className="p-3 rounded-xl cursor-grab active:cursor-grabbing border transition-all"
                style={{ background: draggedIdx === idx ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)", borderColor: draggedIdx === idx ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)", opacity: draggedIdx === idx ? 0.5 : 1 }}>
                
                <div className="flex gap-3 mb-2 items-start">
                  {/* Imagen del servicio */}
                  <div className="w-12 h-12 rounded-lg bg-black/20 flex-shrink-0 overflow-hidden relative group flex items-center justify-center border border-white/10">
                    {s.imageUrl ? <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" /> : <Ico n="image" s={16} c="text-white/20" />}
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      {uploadingImg === s.id ? <Ico n="loader" s={14} c="animate-spin text-white" /> : <Ico n="upload" s={14} c="text-white" />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], s.id, "servicios")} />
                    </label>
                  </div>
                  
                  <div className="flex-1">
                    <input type="text" value={s.name} onChange={e => updateServicio(s.id, "name", e.target.value)} placeholder="Ej: Corte + Barba"
                      className="w-full bg-transparent text-sm font-bold text-white mb-1 focus:outline-none border-b border-transparent focus:border-indigo-500/50" />
                    <input type="text" value={s.desc} onChange={e => updateServicio(s.id, "desc", e.target.value)} placeholder="Breve descripción..."
                      className="w-full bg-transparent text-[10px] text-slate-400 focus:outline-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Precio ($)</label>
                    <input type="number" value={s.price} onChange={e => updateServicio(s.id, "price", Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Duración (Min)</label>
                    <input type="number" value={s.duration} onChange={e => updateServicio(s.id, "duration", Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg text-xs text-emerald-400 font-bold bg-white/5 border border-white/10 focus:outline-none" />
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                  <div onMouseEnter={() => setDragEnabledIdx({list:"servicios", idx})} onMouseLeave={() => setDragEnabledIdx(null)} className="flex items-center gap-1 text-[9px] text-slate-600 cursor-grab"><Ico n="drag" s={10} /> Arrastrar</div>
                  <button onClick={() => deleteServicio(s.id)} className="text-[10px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                    <Ico n="trash" s={10} /> Quitar
                  </button>
                </div>
              </div>
            ))}
            <button onClick={addServicio} className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors" style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>+ Agregar Servicio</button>
          </div>
        )}

        {/* LISTA DE PRODUCTOS */}
        {tab === "productos" && (
          <div className="space-y-3 animate-fadeIn">
            {productos.map((p: any, idx: number) => (
              <div key={p.id} draggable={dragEnabledIdx?.list === "productos" && dragEnabledIdx?.idx === idx} onDragStart={() => setDraggedIdx(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(idx, "productos")}
                className="p-3 rounded-xl cursor-grab active:cursor-grabbing border transition-all"
                style={{ background: draggedIdx === idx ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)", borderColor: draggedIdx === idx ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)", opacity: draggedIdx === idx ? 0.5 : 1 }}>
                
                <div className="flex gap-3 mb-2 items-start">
                  <div className="w-12 h-12 rounded-lg bg-black/20 flex-shrink-0 overflow-hidden relative group flex items-center justify-center border border-white/10">
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <Ico n="image" s={16} c="text-white/20" />}
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      {uploadingImg === p.id ? <Ico n="loader" s={14} c="animate-spin text-white" /> : <Ico n="upload" s={14} c="text-white" />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], p.id, "productos")} />
                    </label>
                  </div>
                  <div className="flex-1">
                    <input type="text" value={p.name} onChange={e => updateProducto(p.id, "name", e.target.value)} placeholder="Ej: Cera Mate"
                      className="w-full bg-transparent text-sm font-bold text-white mb-1 focus:outline-none border-b border-transparent focus:border-indigo-500/50" />
                    <input type="text" value={p.desc || ""} onChange={e => updateProducto(p.id, "desc", e.target.value)} placeholder="Breve descripción..."
                      className="w-full bg-transparent text-[10px] text-slate-400 focus:outline-none" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Precio ($)</label>
                    <input type="number" value={p.price} onChange={e => updateProducto(p.id, "price", Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Stock actual</label>
                    <input type="number" value={p.stock} onChange={e => updateProducto(p.id, "stock", Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg text-xs text-amber-400 font-bold bg-white/5 border border-white/10 focus:outline-none" />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                  <div onMouseEnter={() => setDragEnabledIdx({list:"productos", idx})} onMouseLeave={() => setDragEnabledIdx(null)} className="flex items-center gap-1 text-[9px] text-slate-600 cursor-grab"><Ico n="drag" s={10} /> Arrastrar</div>
                  <button onClick={() => deleteProducto(p.id)} className="text-[10px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                    <Ico n="trash" s={10} /> Quitar
                  </button>
                </div>
              </div>
            ))}
            <button onClick={addProducto} className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors" style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>+ Agregar Producto</button>
          </div>
        )}

        {/* LISTA DE RESEÑAS */}
        {tab === "reseñas" && (
          <div className="space-y-3 animate-fadeIn">
            {testimonios.map((t: any, idx: number) => (
              <div key={t.id} draggable={dragEnabledIdx?.list === "reseñas" && dragEnabledIdx?.idx === idx} onDragStart={() => setDraggedIdx(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(idx, "reseñas")}
                className="p-3 rounded-xl cursor-grab active:cursor-grabbing border transition-all"
                style={{ background: draggedIdx === idx ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)", borderColor: draggedIdx === idx ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)", opacity: draggedIdx === idx ? 0.5 : 1 }}>
                
                <div className="flex gap-3 mb-2 items-start">
                  <div className="flex-1">
                    <input type="text" value={t.name} onChange={e => updateTestimonio(t.id, "name", e.target.value)} placeholder="Nombre del cliente"
                      className="w-full bg-transparent text-sm font-bold text-white mb-2 focus:outline-none border-b border-transparent focus:border-indigo-500/50" />
                    <textarea value={t.text} onChange={e => updateTestimonio(t.id, "text", e.target.value)} placeholder="Opinión del cliente..."
                      className="w-full bg-transparent text-xs text-slate-400 focus:outline-none resize-none h-16" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Estrellas</label>
                    <select value={t.rating} onChange={e => updateTestimonio(t.id, "rating", Number(e.target.value))} className="bg-white/5 border border-white/10 text-amber-400 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none">
                      <option value={5} className="bg-[#131929]">5 ⭐</option>
                      <option value={4} className="bg-[#131929]">4 ⭐</option>
                      <option value={3} className="bg-[#131929]">3 ⭐</option>
                      <option value={2} className="bg-[#131929]">2 ⭐</option>
                      <option value={1} className="bg-[#131929]">1 ⭐</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                  <div onMouseEnter={() => setDragEnabledIdx({list:"reseñas", idx})} onMouseLeave={() => setDragEnabledIdx(null)} className="flex items-center gap-1 text-[9px] text-slate-600 cursor-grab"><Ico n="drag" s={10} /> Arrastrar</div>
                  <button onClick={() => deleteTestimonio(t.id)} className="text-[10px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                    <Ico n="trash" s={10} /> Quitar
                  </button>
                </div>
              </div>
            ))}
            <button onClick={addTestimonio} className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors" style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>+ Agregar Testimonio</button>
          </div>
        )}

        {/* LISTA DE FAQS */}
        {tab === "faqs" && (
          <div className="space-y-3 animate-fadeIn">
            {faqs.map((f: any, idx: number) => (
              <div key={f.id} draggable={dragEnabledIdx?.list === "faqs" && dragEnabledIdx?.idx === idx} onDragStart={() => setDraggedIdx(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(idx, "faqs")}
                className="p-3 rounded-xl cursor-grab active:cursor-grabbing border transition-all"
                style={{ background: draggedIdx === idx ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)", borderColor: draggedIdx === idx ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)", opacity: draggedIdx === idx ? 0.5 : 1 }}>
                
                <div className="flex gap-3 mb-2 items-start">
                  <div className="flex-1">
                    <input type="text" value={f.question} onChange={e => updateFaq(f.id, "question", e.target.value)} placeholder="Ej: ¿Tienen estacionamiento?"
                      className="w-full bg-transparent text-sm font-bold text-white mb-2 focus:outline-none border-b border-transparent focus:border-indigo-500/50" />
                    <textarea value={f.answer} onChange={e => updateFaq(f.id, "answer", e.target.value)} placeholder="Respuesta..."
                      className="w-full bg-transparent text-xs text-slate-400 focus:outline-none resize-none h-16" />
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                  <div onMouseEnter={() => setDragEnabledIdx({list:"faqs", idx})} onMouseLeave={() => setDragEnabledIdx(null)} className="flex items-center gap-1 text-[9px] text-slate-600 cursor-grab"><Ico n="drag" s={10} /> Arrastrar</div>
                  <button onClick={() => deleteFaq(f.id)} className="text-[10px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                    <Ico n="trash" s={10} /> Quitar
                  </button>
                </div>
              </div>
            ))}
            <button onClick={addFaq} className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors" style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>+ Agregar Pregunta (FAQ)</button>
          </div>
        )}
      </div>
    </div>
  );
}