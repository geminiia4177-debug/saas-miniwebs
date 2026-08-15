"use client";

import React, { useState, useRef } from "react";

// DropZone is needed, but we don't export it from EditorTab.tsx. We can quickly redefine it or assume uploadToImgBB is available globally or passed.
// To keep it simple, we use a basic file input or redefine DropZone.
const uploadToImgBB = async (file: File, businessId: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("businessId", businessId);
  const res = await fetch(`/api/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
};

export default function ConfiguradorTaller({ biz, setBiz, media, setMedia, showToast, activeTab }: any) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const layoutConfig = biz?.layoutConfig || {};
  const updateLayout = (patch: Record<string, any>) =>
    setBiz((prev: any) => prev ? { ...prev, layoutConfig: { ...(prev.layoutConfig || {}), ...patch } } : prev);

  // -- TALLER SERVICES --
  if (activeTab === "tallerServices") {
    const list = layoutConfig.tallerServices || [];
    const updateList = (l: any[]) => updateLayout({ tallerServices: l });

    return (
      <div className="space-y-4 px-3 pt-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Servicios Mecánicos</p>
        </div>
        
        {list.map((item: any, i: number) => (
          <div key={i} className="rounded-xl overflow-hidden p-3 transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl shrink-0">
                {item.emoji || "🔧"}
              </div>
              <div className="flex-1">
                <input value={item.name || ""} placeholder="Nombre del servicio" onChange={e => {
                  const n = [...list]; n[i] = { ...n[i], name: e.target.value }; updateList(n);
                }} className="w-full bg-transparent text-white font-bold outline-none text-sm" />
              </div>
              <button onClick={() => updateList(list.filter((_:any, idx:number) => idx !== i))} className="text-red-400/50 hover:text-red-400 p-2">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Categoría</label>
                <select value={item.categoria || ""} onChange={e => {
                  const n = [...list]; n[i] = { ...n[i], categoria: e.target.value }; updateList(n);
                }} className="w-full px-2 py-1.5 rounded-lg text-xs text-white bg-white/5 border border-white/10 outline-none" style={{ background: "#1a2235" }}>
                  <option value="">Seleccionar...</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Frenos">Frenos</option>
                  <option value="Motor">Motor</option>
                  <option value="Electricidad">Electricidad</option>
                  <option value="Tren Delantero">Tren Delantero</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Precio (Opcional)</label>
                <input value={item.price || ""} onChange={e => {
                  const n = [...list]; n[i] = { ...n[i], price: e.target.value }; updateList(n);
                }} className="w-full px-2 py-1.5 rounded-lg text-xs text-white bg-white/5 border border-white/10 outline-none" placeholder="EJ: 50000" />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Descripción corta</label>
              <input value={item.desc || ""} onChange={e => {
                const n = [...list]; n[i] = { ...n[i], desc: e.target.value }; updateList(n);
              }} className="w-full px-2 py-1.5 rounded-lg text-xs text-white bg-white/5 border border-white/10 outline-none" placeholder="Descripción breve" />
            </div>

            <div className="mt-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Checklist de tareas (separadas por coma)</label>
              <input value={(item.items || []).join(", ")} onChange={e => {
                const n = [...list]; n[i] = { ...n[i], items: e.target.value.split(",").map(x=>x.trim()).filter(Boolean) }; updateList(n);
              }} className="w-full px-2 py-1.5 rounded-lg text-xs text-white bg-white/5 border border-white/10 outline-none" placeholder="Cambio de aceite, Filtros, Revisión 30 puntos" />
            </div>
          </div>
        ))}

        <button onClick={() => updateList([...list, { id: `srv_${Date.now()}`, name: "Nuevo Servicio", categoria: "Mantenimiento", price: "", desc: "", items: [] }])}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors" style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>
          + Agregar Servicio
        </button>
      </div>
    );
  }

  // -- TALLER SETTINGS --
  if (activeTab === "tallerSettings") {
    const stats = layoutConfig.stats || { anios: 10, clientes: 5000, trabajos: 15000 };
    return (
      <div className="space-y-4 px-3 pt-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuración del Taller</p>

        <div>
          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Badge del Hero</label>
          <input value={layoutConfig.badge || ""} onChange={e => updateLayout({ badge: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none" placeholder="🔧 Taller Certificado" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Años Exp.</label>
            <input type="number" value={stats.anios} onChange={e => updateLayout({ stats: { ...stats, anios: Number(e.target.value) } })}
              className="w-full px-2 py-2 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none" />
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Clientes</label>
            <input type="number" value={stats.clientes} onChange={e => updateLayout({ stats: { ...stats, clientes: Number(e.target.value) } })}
              className="w-full px-2 py-2 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none" />
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Trabajos</label>
            <input type="number" value={stats.trabajos} onChange={e => updateLayout({ stats: { ...stats, trabajos: Number(e.target.value) } })}
              className="w-full px-2 py-2 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Garantía (Meses)</label>
            <input type="number" value={layoutConfig.garantiaMeses || 6} onChange={e => updateLayout({ garantiaMeses: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none" />
          </div>
          <div className="col-span-2">
            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Marcas de Repuestos (separadas por coma)</label>
            <input value={(layoutConfig.marcasRepuestos || ['Bosch', 'NGK']).join(', ')} onChange={e => updateLayout({ marcasRepuestos: e.target.value.split(',').map(x=>x.trim()) })}
              className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none" />
          </div>
          <div className="col-span-2">
            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Certificaciones (separadas por coma)</label>
            <input value={(layoutConfig.certificaciones || ['Mecánicos Certificados']).join(', ')} onChange={e => updateLayout({ certificaciones: e.target.value.split(',').map(x=>x.trim()) })}
              className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none" />
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 mt-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Galería Antes/Después</p>
          {(layoutConfig.beforeAfter || []).map((ba: any, i: number) => (
            <div key={i} className="p-3 mb-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <input value={ba.titulo || ""} onChange={e => {
                const n = [...layoutConfig.beforeAfter]; n[i].titulo = e.target.value; updateLayout({ beforeAfter: n });
              }} placeholder="Título (ej: Cambio de motor)" className="w-full px-2 py-1.5 mb-2 rounded-lg text-xs text-white bg-white/5 border border-white/10 outline-none" />
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="text-[9px] text-slate-500 mb-1 block">Foto Antes</span>
                  {ba.before ? <img src={ba.before} className="w-full h-16 object-cover rounded" /> : <div className="h-16 bg-white/5 rounded"></div>}
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 mb-1 block">Foto Después</span>
                  {ba.after ? <img src={ba.after} className="w-full h-16 object-cover rounded" /> : <div className="h-16 bg-white/5 rounded"></div>}
                </div>
              </div>
              <button onClick={() => updateLayout({ beforeAfter: layoutConfig.beforeAfter.filter((_:any, idx:number) => idx !== i) })} className="text-red-400 text-xs mt-2 w-full text-center">Quitar</button>
            </div>
          ))}
          <button onClick={() => updateLayout({ beforeAfter: [...(layoutConfig.beforeAfter||[]), { id: Date.now(), titulo: "Nuevo trabajo", before: "https://i.ibb.co/68q8x91/engine-before.jpg", after: "https://i.ibb.co/1R16kP2/engine-after.jpg" }] })}
            className="w-full py-2 rounded-lg text-xs font-semibold text-indigo-400 hover:bg-white/5 transition-colors border border-indigo-400/30 mt-2">
            + Agregar Ejemplo (Demo)
          </button>
        </div>
      </div>
    );
  }

  // Fallback to gallery / video rendering if activeTab matches, but EditorTab.tsx handles generic tabs natively using ConfiguradorAvanzado.
  // We'll leave it simple.
  return null;
}
