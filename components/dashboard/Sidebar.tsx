import React from "react";
import { signOut } from "next-auth/react";
import { Ico } from "@/lib/constants";

export const NavItem = React.memo(({ icon, label, tab, active, setActive, badge, collapsed }: {
  icon: string; label: string; tab: string; active: string; setActive: (t: string) => void; badge?: number; collapsed?: boolean;
}) => (
  <button onClick={() => setActive(tab)}
    title={collapsed ? label : undefined}
    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all relative ${collapsed ? "justify-center" : ""}`}
    style={active === tab ? { background: "rgba(99,102,241,0.15)", color: "#fff", border: "1px solid rgba(99,102,241,0.3)" } : { color: "#64748b", border: "1px solid transparent" }}
  >
    <span style={active === tab ? { color: "#818cf8" } : {}}><Ico n={icon} s={16} /></span>
    {!collapsed && <span className="flex-1 text-left">{label}</span>}
    {badge !== undefined && badge > 0 && !collapsed && (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>{badge}</span>
    )}
    {badge !== undefined && badge > 0 && collapsed && (
      <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#f87171" }} />
    )}
  </button>
));

// Adding a display name for dev tools since it's memoized
NavItem.displayName = "NavItem";

export default function Sidebar({
  biz,
  tab,
  setTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  mediaLength,
  pendingLength,
  copyUrl,
  copiedUrl
}: any) {
  return (
    <aside className={`hidden md:flex flex-shrink-0 flex-col transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-60"}`} style={{ background: "linear-gradient(180deg,#0b1020 0%,#090e1c 100%)", borderRight: "1px solid rgba(255,255,255,0.05)", zIndex: 40 }}>
      <div className={`p-5 pb-4 border-b flex ${sidebarCollapsed ? "justify-center" : "justify-between"} items-center`} style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            {biz.logoUrl
              ? <img src={biz.logoUrl} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="logo" />
              : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                style={{ background: `linear-gradient(135deg,${biz.primaryColor},${biz.secondaryColor})` }}>{biz.name.charAt(0)}</div>}
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{biz.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[11px] text-emerald-400/80">En línea</p>
              </div>
            </div>
          </div>
        )}
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {!sidebarCollapsed && <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-2">Principal</p>}
        <NavItem icon="grid" label="Resumen" tab="home" active={tab} setActive={setTab} collapsed={sidebarCollapsed} />
        <NavItem icon="cpu" label="Asesor Inteligente" tab="intelligence" active={tab} setActive={setTab} collapsed={sidebarCollapsed} />
        <NavItem icon="eye" label="Editor Visual" tab="editor" active={tab} setActive={setTab} collapsed={sidebarCollapsed} />
        <NavItem icon="link" label="BioLinks (Linktree)" tab="biolinks" active={tab} setActive={setTab} collapsed={sidebarCollapsed} />
        <NavItem icon="image" label="Galería de Fotos" tab="gallery" active={tab} setActive={setTab} badge={mediaLength} collapsed={sidebarCollapsed} />

        {!sidebarCollapsed && <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-2 mt-3">Gestión</p>}
        {sidebarCollapsed && <div className="my-3 h-px bg-white/5" />}
        <NavItem icon="calendar" label="Turnos" tab="appointments" active={tab} setActive={setTab} badge={pendingLength} collapsed={sidebarCollapsed} />
        {(biz.type === "menu" || biz.type === "restaurante") && (
          <NavItem icon="box" label="Pedidos / Mesas" tab="orders" active={tab} setActive={setTab} collapsed={sidebarCollapsed} />
        )}
        <NavItem icon="list" label="CRM y Finanzas" tab="crm" active={tab} setActive={setTab} collapsed={sidebarCollapsed} />
        <NavItem icon="settings" label="Configuración" tab="config" active={tab} setActive={setTab} collapsed={sidebarCollapsed} />
        <NavItem icon="message" label="Soporte" tab="support" active={tab} setActive={setTab} collapsed={sidebarCollapsed} />
      </nav>

      <div className="px-3 py-2">
        <button onClick={copyUrl} className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "gap-2"} px-3 py-2 rounded-xl text-[11px] font-medium transition-all group`} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }} title={sidebarCollapsed ? "Copiar URL" : undefined}>
          <Ico n={copiedUrl ? "check" : "globe"} s={13} c={copiedUrl ? "text-emerald-400" : "text-slate-500"} />
          {!sidebarCollapsed && <span className="flex-1 text-left text-slate-500 truncate">/{biz.subdomain}</span>}
          {!sidebarCollapsed && <Ico n="copy" s={11} c="text-slate-600 group-hover:text-slate-400" />}
        </button>
      </div>

      <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <button onClick={() => signOut({ callbackUrl: "/login" })} title={sidebarCollapsed ? "Cerrar Sesión" : undefined}
          className={`w-full flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:text-white hover:bg-red-500/20 bg-red-500/10 transition-colors border border-red-500/20`}>
          <Ico n="logout" s={15} /> {!sidebarCollapsed && "Cerrar Sesión"}
        </button>
      </div>
    </aside>
  );
}
