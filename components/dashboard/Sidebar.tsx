"use client";

import React from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Palette,
  Image as ImageIcon,
  Link as LinkIcon,
  Calendar,
  ShoppingBag,
  Users,
  Bot,
  Settings,
  ChevronDown,
  LogOut,
  Copy,
  Check,
  Globe,
  Sparkles,
  Menu,
} from "lucide-react";

export interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  tab: string;
  active: string;
  setActive: (t: string) => void;
  badge?: number;
  collapsed?: boolean;
}

export const NavItem = React.memo<NavItemProps>(({
  icon,
  label,
  tab,
  active,
  setActive,
  badge,
  collapsed,
}) => {
  const isSelected = active === tab;

  return (
    <button
      type="button"
      onClick={() => setActive(tab)}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${
        collapsed ? "justify-center" : ""
      } ${
        isSelected
          ? "bg-indigo-600/15 text-white border border-indigo-500/30 shadow-sm"
          : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
      }`}
    >
      <span className={isSelected ? "text-indigo-400" : "text-slate-500"}>
        {icon}
      </span>
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {badge !== undefined && badge > 0 && !collapsed && (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400 border border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span>{badge}</span>
        </span>
      )}
      {badge !== undefined && badge > 0 && collapsed && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0B1020]" />
      )}
    </button>
  );
});

NavItem.displayName = "NavItem";

export interface SidebarProps {
  biz: any;
  tab: string;
  setTab: (t: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (c: boolean) => void;
  mediaLength?: number;
  pendingLength?: number;
  unreadSupport?: number;
  copyUrl: () => void;
  copiedUrl: boolean;
  onOpenPayModal?: () => void;
}

export default function Sidebar({
  biz,
  tab,
  setTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  mediaLength = 0,
  pendingLength = 0,
  unreadSupport = 0,
  copyUrl,
  copiedUrl,
  onOpenPayModal,
}: SidebarProps) {
  const isDemo = biz?.status === "DEMO" || biz?.status === "TRIAL";
  const primary = biz?.primaryColor || "#6366F1";

  return (
    <aside
      className={`hidden md:flex flex-shrink-0 flex-col h-full max-h-screen overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? "w-20" : "w-64"
      } bg-[#0A0D14] border-r border-white/5 z-40 select-none`}
    >
      {/* ── TOP: BUSINESS SELECTOR ── */}
      <div
        className={`p-4 border-b border-white/5 flex ${
          sidebarCollapsed ? "justify-center" : "justify-between"
        } items-center`}
      >
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            {biz?.logoUrl ? (
              <img
                src={biz.logoUrl}
                className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                alt="logo"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0 shadow-md"
                style={{ background: `linear-gradient(135deg, ${primary}, #8B5CF6)` }}
              >
                {biz?.name?.charAt(0) || "M"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-white font-bold text-xs truncate">{biz?.name || "Mi Negocio"}</p>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-400">En línea</span>
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* ── NAVIGATION GROUPS ── */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto custom-scrollbar">
        {/* GRUPO 1: INICIO */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1">
              Inicio
            </p>
          )}
          <NavItem
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Panel Principal"
            tab="home"
            active={tab}
            setActive={setTab}
            collapsed={sidebarCollapsed}
          />
        </div>

        {/* GRUPO 2: SITIO */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1">
              Sitio Web
            </p>
          )}
          {sidebarCollapsed && <div className="my-2 h-px bg-white/5" />}
          <NavItem
            icon={<Palette className="w-4 h-4" />}
            label="Editor Visual"
            tab="editor"
            active={tab}
            setActive={setTab}
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<ImageIcon className="w-4 h-4" />}
            label="Galería de Fotos"
            tab="gallery"
            active={tab}
            setActive={setTab}
            badge={mediaLength}
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<LinkIcon className="w-4 h-4" />}
            label="BioLinks"
            tab="biolinks"
            active={tab}
            setActive={setTab}
            collapsed={sidebarCollapsed}
          />
        </div>

        {/* GRUPO 3: VENTAS */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1">
              Ventas & Clientes
            </p>
          )}
          {sidebarCollapsed && <div className="my-2 h-px bg-white/5" />}
          <NavItem
            icon={<Calendar className="w-4 h-4" />}
            label="Turnos y Citas"
            tab="appointments"
            active={tab}
            setActive={setTab}
            badge={pendingLength}
            collapsed={sidebarCollapsed}
          />
          {(biz?.type === "menu" || biz?.type === "restaurante" || biz?.type === "tienda") && (
            <NavItem
              icon={<ShoppingBag className="w-4 h-4" />}
              label="Pedidos"
              tab="orders"
              active={tab}
              setActive={setTab}
              collapsed={sidebarCollapsed}
            />
          )}
          <NavItem
            icon={<Users className="w-4 h-4" />}
            label="Clientes & CRM"
            tab="crm"
            active={tab}
            setActive={setTab}
            collapsed={sidebarCollapsed}
          />
        </div>

        {/* GRUPO 4: CRECIMIENTO */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1">
              Crecimiento
            </p>
          )}
          {sidebarCollapsed && <div className="my-2 h-px bg-white/5" />}
          <NavItem
            icon={<Sparkles className="w-4 h-4 text-accent" />}
            label="Flyers con IA"
            tab="flyers"
            active={tab}
            setActive={setTab}
            collapsed={sidebarCollapsed}
          />
          <NavItem
            icon={<Bot className="w-4 h-4" />}
            label="Asesor Inteligente"
            tab="intelligence"
            active={tab}
            setActive={setTab}
            collapsed={sidebarCollapsed}
          />
        </div>

        {/* GRUPO 5: AJUSTES */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1">
              Ajustes
            </p>
          )}
          {sidebarCollapsed && <div className="my-2 h-px bg-white/5" />}
          <NavItem
            icon={<Settings className="w-4 h-4" />}
            label="Configuración"
            tab="config"
            active={tab}
            setActive={setTab}
            collapsed={sidebarCollapsed}
          />
        </div>
      </nav>

      {/* ── PLAN STATUS / TRIAL WIDGET ── */}
      {!sidebarCollapsed && isDemo && (
        <div className="mx-3 my-2 p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300">Plan Demostración</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
              Prueba
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Activa tu plan comercial para dominio propio y turnos ilimitados.
          </p>
          {onOpenPayModal && (
            <button
              type="button"
              onClick={onOpenPayModal}
              className="w-full py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ background: primary }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Activar Plan</span>
            </button>
          )}
        </div>
      )}

      {/* ── PUBLIC URL COPY CHIP ── */}
      <div className="px-3 py-2 border-t border-white/5">
        <button
          type="button"
          onClick={copyUrl}
          className={`w-full flex items-center ${
            sidebarCollapsed ? "justify-center" : "gap-2"
          } px-3 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-slate-300 hover:text-white cursor-pointer group`}
          title={sidebarCollapsed ? "Copiar URL del sitio" : undefined}
        >
          {copiedUrl ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
          )}
          {!sidebarCollapsed && (
            <span className="flex-1 text-left truncate text-[11px] font-mono text-slate-400">
              /{biz?.subdomain}
            </span>
          )}
          {!sidebarCollapsed && (
            <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300 shrink-0" />
          )}
        </button>
      </div>

      {/* ── LOGOUT BUTTON ── */}
      <div className="p-3 border-t border-white/5">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={sidebarCollapsed ? "Cerrar Sesión" : undefined}
          className={`w-full flex items-center ${
            sidebarCollapsed ? "justify-center" : "gap-2.5"
          } px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 bg-red-500/10 transition-colors border border-red-500/20 cursor-pointer`}
        >
          <LogOut className="w-4 h-4" />
          {!sidebarCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
