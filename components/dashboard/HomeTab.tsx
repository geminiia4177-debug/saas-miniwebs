"use client";

import React from "react";
import { Biz, Section, MediaItem, Appointment, Ico } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface HomeTabProps {
  biz: Biz;
  media: MediaItem[];
  sections: Section[];
  pending: Appointment[];
  appointments: Appointment[];
  setTab: (tab: string) => void;
  copyUrl: () => void;
  copiedUrl: boolean;
}

export default function HomeTab({ biz, media, sections, pending, appointments, setTab, copyUrl, copiedUrl }: HomeTabProps) {
  return (
    <div className="max-w-4xl animate-fadeIn pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">Bienvenido, <span style={{ backgroundImage: `linear-gradient(135deg,${biz.primaryColor},${biz.secondaryColor})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{biz.name}</span></h1>
        <p className="text-slate-500">Esto es lo que está pasando hoy.</p>
      </div>

      {(() => {
        const progressItems = [
          { label: "Información básica", completed: !!biz.name && !!biz.tagline, weight: 20, tab: "config" },
          { label: "Logo subido", completed: !!biz.logoUrl, weight: 20, tab: "config" },
          { label: "Servicios cargados", completed: ((biz.layoutConfig?.services || []).length > 0) || ((biz.layoutConfig?.products || []).length > 0) || ((biz.layoutConfig?.menuCategorias || []).length > 0) || ((biz.layoutConfig?.canchas || []).length > 0) || ((biz.layoutConfig?.tallerServices || []).length > 0), weight: 20, tab: "editor" },
          { label: "Fotos en galería", completed: media.length > 0, weight: 20, tab: "gallery" },
          { label: "Horarios configurados", completed: !!biz.layoutConfig?.hours, weight: 20, tab: "config" },
        ];
        const progressTotal = progressItems.reduce((acc, item) => acc + (item.completed ? item.weight : 0), 0);
        
        if (progressTotal === 100) return null;

        return (
          <div className="mb-8 p-5 rounded-2xl relative overflow-hidden" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Ico n="target" s={16} c="text-indigo-400" /> Progreso de configuración
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Completá estos pasos para lanzar tu web</p>
              </div>
              <span className="text-xl font-black text-indigo-400">{progressTotal}%</span>
            </div>
            
            <div className="h-1.5 w-full bg-white/5 rounded-full mb-4 relative z-10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progressTotal}%`, background: "linear-gradient(90deg,#6366f1,#a855f7)" }} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 relative z-10">
              {progressItems.map((item, idx) => (
                <div key={idx} onClick={() => !item.completed && setTab(item.tab)} className={`flex items-center gap-2 p-2 rounded-lg text-[11px] font-medium transition-colors ${item.completed ? "text-emerald-400/70" : "text-slate-300 hover:bg-white/5 cursor-pointer"}`}>
                  {item.completed ? <Ico n="check-circle" s={14} /> : <Ico n="circle" s={14} c="text-slate-600" />}
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { label: "Turnos pendientes", val: pending.length, icon: "calendar", color: "#f59e0b", bg: "#f59e0b15", tab: "appointments" },
          { label: "Fotos en galería", val: media.length, icon: "image", color: "#10b981", bg: "#10b98115", tab: "gallery" },
          { label: "Secciones activas", val: sections.filter((s: Section) => s.visible).length, icon: "eye", color: "#6366f1", bg: "#6366f115", tab: "editor" },
          { label: "Estado", val: "Activo", icon: "zap", color: "#a855f7", bg: "#a855f715", tab: "config" },
        ].map((s) => (
          <div key={s.label} onClick={() => setTab(s.tab)} className="group rounded-2xl p-5 flex flex-col justify-between cursor-pointer hover:shadow-2xl transition-all duration-300 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: s.bg }}>
                <Ico n={s.icon} s={18} style={{ color: s.color } as React.CSSProperties} />
              </div>
              <span className="text-3xl font-black" style={{ color: s.color }}>{s.val}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest relative z-10">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-6" style={{ background: `linear-gradient(135deg,${biz.primaryColor}18,${biz.secondaryColor}10)`, border: `1px solid ${biz.primaryColor}25` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white font-bold mb-1">Tu página pública</p>
              <p className="text-sm text-slate-400">Compartí este link para recibir reservas.</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${biz.primaryColor}25` }}>
              <Ico n="globe" s={18} c="text-indigo-400" />
            </div>
          </div>
          <button onClick={copyUrl} className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs text-indigo-300 hover:text-white transition-colors" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Ico n={copiedUrl ? "check" : "copy"} s={11} />
            {biz.customDomain || `${biz.subdomain}.saas-miniwebs.vercel.app`}
          </button>
        </div>

        {(() => {
          const checklist = [
            { id: "logo", label: "Subir un logo", done: !!biz.logoUrl, tab: "config" },
            { id: "services", label: "Agregar servicios", done: sections.find((s: Section) => s.id === "services")?.config?.items?.length > 0, tab: "editor" },
            { id: "gallery", label: "Subir fotos", done: media.length > 0, tab: "gallery" },
            { id: "contact", label: "Añadir WhatsApp", done: !!biz.whatsapp, tab: "config" }
          ];
          const completed = checklist.filter(c => c.done).length;
          const progress = (completed / checklist.length) * 100;
          
          if (completed === checklist.length) {
            return (
              <div className="rounded-2xl p-6 relative overflow-hidden group flex flex-col justify-between" style={{ background: `linear-gradient(135deg, var(--secondary-color), var(--primary-color))`, border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/20 transition-colors"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Ico n="check" s={16} c="text-white" /></div>
                      <h3 className="text-white font-bold text-lg">¡Perfil completado!</h3>
                    </div>
                    <p className="text-sm text-white/80 mb-4 leading-relaxed">Tu negocio está listo para recibir reservas. Compartí el enlace para atraer más clientes.</p>
                  </div>
                  <button onClick={copyUrl} className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/20 text-white hover:bg-white/30 transition-colors shadow-lg">
                    <Ico n="share-2" s={14} /> Compartir Enlace
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="rounded-2xl p-6 relative overflow-hidden flex flex-col" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-white font-bold mb-1">Primeros pasos</h3>
                  <p className="text-xs text-slate-400">Completá tu perfil para arrancar</p>
                </div>
                <div className="text-xs font-bold" style={{ color: "var(--primary-color)" }}>{completed}/{checklist.length}</div>
              </div>
              
              <div className="w-full h-1.5 bg-white/5 rounded-full mb-5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: "var(--primary-color)" }}></div>
              </div>
              
              <div className="flex flex-col gap-2.5 flex-1 justify-center">
                {checklist.map(item => (
                  <div key={item.id} onClick={() => !item.done && setTab(item.tab)} className={`flex items-center gap-3 ${item.done ? "opacity-50 cursor-default" : "cursor-pointer hover:bg-white/5"} p-2 -mx-2 rounded-lg transition-colors`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${item.done ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/10 text-transparent"}`}>
                      <Ico n="check" s={12} c={item.done ? "text-emerald-400" : "text-transparent"} />
                    </div>
                    <span className={`text-sm font-medium ${item.done ? "text-slate-400 line-through" : "text-slate-300"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── CHARTS (ANALYTICS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Bar Chart */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Ico n="bar-chart-2" s={16} c="text-indigo-400" /> Actividad (Últimos 7 días)</h3>
          <div className="h-64">
            {(() => {
              const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i));
                return { name: d.toLocaleDateString('es-MX', { weekday: 'short' }), dateStr: d.toDateString(), turnos: 0 };
              });
              appointments.forEach(a => {
                const aDate = new Date(a.date).toDateString();
                const day = last7Days.find(d => d.dateStr === aDate);
                if (day) day.turnos++;
              });
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="turnos" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Ico n="pie-chart" s={16} c="text-purple-400" /> Servicios Populares</h3>
          <div className="h-64">
            {(() => {
              const servicesMap: Record<string, number> = {};
              appointments.forEach(a => {
                const s = a.serviceName || "Otros";
                servicesMap[s] = (servicesMap[s] || 0) + 1;
              });
              const data = Object.keys(servicesMap).map(k => ({ name: k, value: servicesMap[k] })).sort((a, b) => b.value - a.value).slice(0, 5);
              const COLORS = ['var(--primary-color)', 'var(--secondary-color)', '#ec4899', '#f43f5e', '#f59e0b'];
              if (data.length === 0) return <div className="h-full flex items-center justify-center text-slate-500 text-sm">Sin datos aún</div>;
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
