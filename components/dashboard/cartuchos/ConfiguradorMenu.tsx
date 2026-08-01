"use client";

import React, { useState } from "react";

export default function ConfiguradorMenu({ biz, setBiz, media, setMedia, showToast, activeTab }: any) {
  const layoutConfig = biz?.layoutConfig || {};
  const updateLayout = (patch: Record<string, any>) =>
    setBiz((prev: any) => prev ? { ...prev, layoutConfig: { ...(prev.layoutConfig || {}), ...patch } } : prev);

  if (activeTab === "menuConfig") {
    return (
      <div className="space-y-4 px-3 pt-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ajustes del Menú</p>

        <div>
          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Modos Disponibles</label>
          <div className="flex gap-2">
            {['local', 'delivery', 'llevar'].map(m => {
              const checked = (layoutConfig.modosDisponibles || ['local', 'delivery', 'llevar']).includes(m);
              return (
                <label key={m} className="flex items-center gap-2 cursor-pointer p-2 rounded bg-white/5 border border-white/10 flex-1">
                  <input type="checkbox" checked={checked} onChange={() => {
                    let modos = [...(layoutConfig.modosDisponibles || ['local', 'delivery', 'llevar'])];
                    if (checked) modos = modos.filter(x => x !== m);
                    else modos.push(m);
                    updateLayout({ modosDisponibles: modos });
                  }} className="accent-indigo-500" />
                  <span className="text-xs text-white capitalize">{m}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Aviso de Delivery (Radio / Costo)</label>
          <input value={layoutConfig.deliveryRadio || "Radio de entrega: 3km"} onChange={e => updateLayout({ deliveryRadio: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none" placeholder="Ej: Envíos gratis hasta 2km" />
        </div>

        <div className="mt-4 p-3 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Reserva de Mesa Activa</p>
            <p className="text-[10px] text-slate-400">Mostrar formulario al final del menú</p>
          </div>
          <div onClick={() => updateLayout({ reservaMesaActiva: layoutConfig.reservaMesaActiva === false ? true : false })}
            className="w-10 h-5 rounded-full relative transition-colors cursor-pointer"
            style={{ background: layoutConfig.reservaMesaActiva !== false ? "#6366f1" : "rgba(255,255,255,0.08)" }}>
            <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: layoutConfig.reservaMesaActiva !== false ? "22px" : "2px" }} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
