"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Biz, Section, MediaItem, Appointment, ToastType, DEFAULT_SECTIONS, Ico } from "@/lib/constants";
import Sidebar, { NavItem } from "@/components/dashboard/Sidebar";
import EditorTab from "@/components/dashboard/EditorTab";
import ManagementTabs from "@/components/dashboard/ManagementTabs";
import CrmTab from "@/components/dashboard/CrmTab";
import OrdersTablesTab from "@/components/dashboard/OrdersTablesTab";
import BiolinksTab from "@/components/dashboard/BiolinksTab";
import IntelligenceTab from "@/components/dashboard/IntelligenceTab";
import HomeTab from "@/components/dashboard/HomeTab";
import SupportWidget from "@/components/dashboard/SupportWidget";
import PayModal from "@/components/dashboard/PayModal";
import OnboardingModal from "@/components/dashboard/OnboardingModal";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// IMGBB UPLOAD (Para la subida general de la galerÃ­a)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const uploadToImgBB = async (file: File, businessId: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("businessId", businessId);
  const res = await fetch(
    `/api/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// COMPONENTES DE INTERFAZ (Sidebar y Alertas)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ToastBar = ({ toast }: { toast: ToastType | null }) => {
  if (!toast) return null;
  const colors = {
    success: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", icon: "check", iconColor: "#10b981" },
    error: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", icon: "x", iconColor: "#ef4444" },
    info: { bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.4)", icon: "info", iconColor: "#6366f1" },
  }[toast.type];
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl animate-slideUp"
      style={{ background: `linear-gradient(135deg,#1a2235,#1e2845)`, border: `1px solid ${colors.border}`, backdropFilter: "blur(12px)" }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: colors.bg }}>
        <Ico n={colors.icon} s={13} />
      </div>
      <span className="text-sm font-medium text-white max-w-xs">{toast.msg}</span>
    </div>
  );
};



// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// COMPONENTE PRINCIPAL: DIRECTOR DE ORQUESTA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [biz, setBiz] = useState<Biz | null>(null);
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [globalAlert, setGlobalAlert] = useState<any>(null);
  const [uploadQueue, setUploadQueue] = useState<{ file: File; progress: number; status: "pending" | "uploading" | "done" | "error"; url?: string }[]>([]);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // â”€â”€ ESTADO DE GUARDADO PERSISTENTE â”€â”€
  const [initialDataStr, setInitialDataStr] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!loading && biz) {
      const currentStr = JSON.stringify({ biz, sections, media });
      if (!initialDataStr) {
        setInitialDataStr(currentStr);
      } else {
        setHasUnsavedChanges(currentStr !== initialDataStr);
      }
    }
  }, [biz, sections, media, loading, initialDataStr]);

  // â”€â”€ PAGOS MODAL STATE â”€â”€
  const [payModalOpen, setPayModalOpen] = useState(false);

  // â”€â”€ ONBOARDING STATE â”€â”€
  const [showOnboarding, setShowOnboarding] = useState(false);

  const pushToast = (msg: string, type: "success" | "error" | "info" | "warn" = "info") => {
    setToast({ msg, type: type as any });
    setTimeout(() => setToast(null), 3000);
  };

  // â”€â”€ CARGAR DATOS DEL NEGOCIO â”€â”€
  useEffect(() => {
    // Fetch active global alerts
    fetch("/api/alerts")
      .then(r => r.json())
      .then(d => {
        if (d && d.length > 0) setGlobalAlert(d[0]);
      })
      .catch(e => console.error("Error fetching alerts", e));

    fetch("/api/my-business", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        if (d.user?.role === "ADMIN") {
          router.push("/admin");
          return;
        }
        if (d.business) {
          setBiz({
            ...d.business,
            primaryColor: d.business.primaryColor || "#6366f1",
            secondaryColor: d.business.secondaryColor || "#a855f7",
            accentColor: d.business.accentColor || "#f59e0b",
            fontFamily: d.business.fontFamily || "sans",
            instagram: d.business.layoutConfig?.instagram || "",
            facebook: d.business.layoutConfig?.facebook || "",
            whatsapp: d.business.layoutConfig?.whatsapp || "",
            tiktok: d.business.layoutConfig?.tiktok || "",
          });
          if (d.business.layoutConfig?.sections) {
            const loaded = d.business.layoutConfig.sections;
            const merged = loaded.map((s: any) => {
              const ds = DEFAULT_SECTIONS.find(d => d.id === s.id);
              return ds ? { ...ds, ...s } : s;
            });
            DEFAULT_SECTIONS.forEach(ds => {
              if (!merged.find((m: any) => m.id === ds.id)) merged.push(ds);
            });
            setSections(merged);
          }
          if (d.business.layoutConfig?.media) setMedia(d.business.layoutConfig.media);

          // Check Onboarding
          if (d.business && !d.business.layoutConfig?.onboarded) {
            setShowOnboarding(true);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // â”€â”€ AUTO COLLAPSE SIDEBAR EN EDITOR â”€â”€
  useEffect(() => {
    if (tab === "editor") setSidebarCollapsed(true);
    else setSidebarCollapsed(false);
  }, [tab]);

  // â”€â”€ AUTOSAVE (UX-011) â”€â”€
  useEffect(() => {
    if (hasUnsavedChanges && !saving) {
      const timer = setTimeout(() => {
        saveAll(false, true); // AutoSave flag true
      }, 3000); // 3 seconds debounce
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges]);

  // â”€â”€ CARGAR TURNOS â”€â”€
  useEffect(() => {
    if (!biz?.id) return;

    if (tab === "appointments" || appointments.length === 0) {
      fetch(`/api/appointments?businessId=${biz.id}`)
        .then(res => {
          if (!res.ok) throw new Error("Error en el servidor");
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setAppointments(data);
          }
        })
        .catch(err => console.error("Error al cargar los turnos:", err));
    }
  }, [biz?.id, tab]);

  // ── GUARDAR EN BASE DE DATOS ──
  const saveAll = async (publish: boolean | any = false, isAutoSave: boolean = false) => {
    if (!biz) return;
    if (!isAutoSave) setSaving(true);
    try {
      const isPublish = typeof publish === 'boolean' ? publish : false;
      const res = await fetch(`/api/businesses/${biz.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...biz, layoutConfig: { ...(biz.layoutConfig || {}), sections, media }, publish: isPublish }),
      });
      if (res.ok) {
        if (!isAutoSave) pushToast(isPublish ? "¡Web publicada con éxito! 🚀" : "Borrador guardado ✓", "success");
        setInitialDataStr(JSON.stringify({ biz, sections, media }));
      }
      else {
        let errMsg = "Error en el servidor";
        try {
          const errData = await res.json();
          errMsg = errData.error + " - " + JSON.stringify(errData.details);
          console.error("BACKEND REJECTED:", errData);
        } catch(e) {}
        if (!isAutoSave) pushToast("Fallo: " + errMsg, "error");
      }
    } catch {
      if (!isAutoSave) pushToast("Error de conexión", "error");
    }
    if (!isAutoSave) setSaving(false);
  };

  // â”€â”€ SUBIR ARCHIVOS DE LA GALERÃA â”€â”€
  const uploadFiles = async (files: File[]) => {
    const queue = files.map(file => ({ file, progress: 0, status: "pending" as const }));
    setUploadQueue(queue);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: "uploading", progress: 10 } : q));
      const progressInterval = setInterval(() => {
        setUploadQueue(prev => prev.map((q, idx) => {
          if (idx === i && q.progress < 85) return { ...q, progress: q.progress + Math.random() * 15 };
          return q;
        }));
      }, 300);
      try {
        const url = await uploadToImgBB(file, biz?.id || "unknown");
        clearInterval(progressInterval);
        setUploadQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: "done", progress: 100, url } : q));
        const newItem: MediaItem = { id: `m${Date.now()}_${i}`, type: "image", url, name: file.name, size: file.size, uploadedAt: new Date().toISOString() };
        setMedia(prev => [newItem, ...prev]);
      } catch {
        clearInterval(progressInterval);
        setUploadQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: "error", progress: 0 } : q));
        pushToast(`Error al subir ${file.name}`, "error");
      }
    }
    setTimeout(() => setUploadQueue([]), 2000);
    pushToast(`${files.length} imagen${files.length > 1 ? "es" : ""} subida${files.length > 1 ? "s" : ""} correctamente`, "success");
  };

  const copyUrl = () => {
    if (!biz) return;
    navigator.clipboard.writeText(biz.customDomain ? `https://${biz.customDomain}` : `https://${biz.subdomain}.saas-miniwebs.vercel.app`);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    pushToast("URL copiada al portapapeles", "info");
  };

  if (loading) return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "#070b12" }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
          <Ico n="zap" s={20} c="text-white" />
        </div>
        <p className="text-slate-400 text-sm">Cargando tu panel...</p>
      </div>
    </div>
  );

  if (!biz) return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#070b12]">
      <div className="text-center p-8 border border-white/10 rounded-2xl bg-white/5">
        <h2 className="text-xl text-white font-bold mb-2">Acceso Restringido 🛑</h2>
        <p className="text-slate-400 text-sm">Tu cuenta no tiene un negocio asignado.<br />Contactá a la administración para obtener tu acceso.</p>
      </div>
    </div>
  );

  const pending = appointments.filter(a => a.status === "PENDING");

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "#070b12", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", "--primary-color": biz?.primaryColor || "#6366f1", "--secondary-color": biz?.secondaryColor || "#a855f7" } as React.CSSProperties}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .animate-slideUp { animation: slideUp .3s ease forwards; }
        .animate-fadeIn { animation: fadeIn .25s ease forwards; }
        .animate-spin { animation: spin 1s linear infinite; }
        input[type=color] { -webkit-appearance:none; appearance:none; padding:0; border:none; cursor:pointer; border-radius:8px; }
        input[type=color]::-webkit-color-swatch-wrapper { padding:0; }
        input[type=color]::-webkit-color-swatch { border:none; border-radius:6px; }
        select option { background: #1a2235; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .sidebar-slide-in { animation: slideIn 0.3s ease forwards; }
      `}</style>

      {/* ── MOBILE MENU OVERLAY ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-64 sidebar-slide-in flex flex-col pt-[env(safe-area-inset-top,1rem)] pb-[env(safe-area-inset-bottom,1rem)]" style={{ background: "linear-gradient(180deg,#0b1020 0%,#090e1c 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 pb-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-3 min-w-0">
                {biz.logoUrl
                  ? <img src={biz.logoUrl} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="logo" />
                  : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${biz.primaryColor},${biz.secondaryColor})` }}>{biz.name ? biz.name.charAt(0) : "M"}</div>}
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{biz.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[11px] text-emerald-400/80">En línea</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1" aria-label="Cerrar menú">
                <Ico n="x" s={18} />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-2">Principal</p>
              <NavItem icon="grid" label="Resumen" tab="home" active={tab} setActive={(t: string) => { setTab(t); setMobileMenuOpen(false); }} />
              
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-2 mt-3">Crear y editar</p>
              <NavItem icon="eye" label="Editor Visual" tab="editor" active={tab} setActive={(t: string) => { setTab(t); setMobileMenuOpen(false); }} />
              <NavItem icon="image" label="Galería" tab="gallery" active={tab} setActive={(t: string) => { setTab(t); setMobileMenuOpen(false); }} badge={media.length} />
              
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-2 mt-3">Contenido</p>
              <NavItem icon="calendar" label="Turnos" tab="appointments" active={tab} setActive={(t: string) => { setTab(t); setMobileMenuOpen(false); }} badge={pending.length} />
              {(biz.type === "menu" || biz.type === "restaurante") && (
                <NavItem icon="box" label="Pedidos / Mesas" tab="orders" active={tab} setActive={(t: string) => { setTab(t); setMobileMenuOpen(false); }} />
              )}

              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-2 mt-3">Herramientas</p>
              <NavItem icon="bot" label="Asesor Inteligente" tab="intelligence" active={tab} setActive={(t: string) => { setTab(t); setMobileMenuOpen(false); }} />
              <NavItem icon="link" label="BioLinks" tab="biolinks" active={tab} setActive={(t: string) => { setTab(t); setMobileMenuOpen(false); }} />
              <NavItem icon="list" label="CRM y Finanzas" tab="crm" active={tab} setActive={(t: string) => { setTab(t); setMobileMenuOpen(false); }} />

              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-2 mt-3">Configuración</p>
              <NavItem icon="settings" label="Ajustes Generales" tab="config" active={tab} setActive={(t: string) => { setTab(t); setMobileMenuOpen(false); }} />
            </nav>
            <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:text-white hover:bg-red-500/20 bg-red-500/10 transition-colors border border-red-500/20 min-h-[44px]">
                <Ico n="logout" s={15} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR (Desktop only) ── */}
      <Sidebar
        biz={biz}
        tab={tab}
        setTab={setTab}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mediaLength={media.length}
        pendingLength={pending.length}
        copyUrl={copyUrl}
        copiedUrl={copiedUrl}
        unreadSupport={0}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden custom-scrollbar bg-[#080a10]">

        {/* ALERT BANNER GLOBAL */}
        {globalAlert && (
          <div className={`px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold z-50 ${globalAlert.type === "warning" ? "bg-red-500/20 text-red-200 border-b border-red-500/30" : globalAlert.type === "success" ? "bg-emerald-500/20 text-emerald-200 border-b border-emerald-500/30" : "bg-indigo-500/20 text-indigo-200 border-b border-indigo-500/30"}`}>
            <Ico n="info" s={16} />
            <span>{globalAlert.content}</span>
            <button onClick={() => setGlobalAlert(null)} className="ml-4 opacity-50 hover:opacity-100"><Ico n="x" s={14} /></button>
          </div>
        )}

        {/* TOP BAR GUARDADO PERSISTENTE & MOBILE HEADER */}
        <div className="bg-[#0f1523] border-b border-white/5 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 z-10 shrink-0 shadow-sm gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Botón de Menú Móvil */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Abrir menú"
            >
              <Ico n="menu" s={18} />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${hasUnsavedChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                {saving ? "Guardando..." : hasUnsavedChanges ? "Cambios sin guardar" : "Todos los cambios están guardados"}
              </span>
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
            <button 
              onClick={() => saveAll(false)} 
              disabled={!hasUnsavedChanges || saving}
              className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${!hasUnsavedChanges || saving ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
            >
              {saving ? "..." : "Guardar Borrador"}
            </button>
            <button 
              onClick={() => saveAll(true)} 
              disabled={saving}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${saving ? 'bg-indigo-500/50 text-white/50 cursor-not-allowed' : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]'}`}
            >
              Publicar Web
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-6 pb-[calc(env(safe-area-inset-bottom)+5rem)] md:pb-6 relative" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.05), transparent 60%)" }}>

          <div className="max-w-[1400px] mx-auto h-full flex flex-col">
            {/* ── HOME (Overview) ── */}
            {tab === "home" && (
              <HomeTab
                biz={biz}
                media={media}
                sections={sections}
                pending={pending}
                appointments={appointments}
                setTab={setTab}
                copyUrl={copyUrl}
                copiedUrl={copiedUrl}
              />
            )}

            {/* ── EDITOR ── */}
            {tab === "editor" && (
              <EditorTab
                biz={biz} setBiz={setBiz} sections={sections} setSections={setSections}
                media={media} setMedia={setMedia} saveAll={saveAll} saving={saving}
                showToast={pushToast} setTab={setTab}
              />
            )}

            {/* ── BIOLINKS EDITOR ── */}
            {tab === "biolinks" && (
              <BiolinksTab
                biz={biz} setBiz={setBiz} saveAll={saveAll} saving={saving}
                showToast={pushToast} copyUrl={() => {
                  navigator.clipboard.writeText(biz.customDomain ? `https://${biz.customDomain}/links` : `https://${biz.subdomain}.saas-miniwebs.vercel.app/links`);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                  pushToast("URL /links copiada al portapapeles", "success");
                }} copiedUrl={copiedUrl}
              />
            )}

            {/* ── TABS HIJOS IMPORTADOS ── */}
            {(tab === "appointments" || tab === "gallery" || tab === "config") && (
              <ManagementTabs
                tab={tab} biz={biz} setBiz={setBiz} media={media} setMedia={setMedia}
                appointments={appointments} setAppointments={setAppointments} saveAll={saveAll} saving={saving}
                showToast={pushToast} uploadQueue={uploadQueue} uploadFiles={uploadFiles}
              />
            )}

            {tab === "crm" && (
              <CrmTab biz={biz} setBiz={setBiz} saveAll={saveAll} showToast={pushToast} />
            )}

            {tab === "orders" && (
              <OrdersTablesTab biz={biz} showToast={pushToast} />
            )}

            {tab === "intelligence" && (
              <IntelligenceTab businessId={biz.id} bizName={biz.name} />
            )}
          </div>
        </div>

        {/* ── BOTTOM NAVIGATION BAR (Mobile Only) ── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0b1020]/95 border-t border-white/10 backdrop-blur-xl flex items-center justify-around py-2 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] shadow-2xl">
          <button
            onClick={() => setTab("home")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${tab === "home" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-white"}`}
          >
            <Ico n="grid" s={18} />
            <span className="text-[10px]">Inicio</span>
          </button>
          <button
            onClick={() => setTab("editor")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${tab === "editor" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-white"}`}
          >
            <Ico n="eye" s={18} />
            <span className="text-[10px]">Editor</span>
          </button>
          <button
            onClick={() => setTab("appointments")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${tab === "appointments" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-white"}`}
          >
            <Ico n="calendar" s={18} />
            <span className="text-[10px]">Turnos</span>
            {pending.length > 0 && (
              <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
          <button
            onClick={() => setTab("biolinks")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${tab === "biolinks" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-white"}`}
          >
            <Ico n="link" s={18} />
            <span className="text-[10px]">BioLinks</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <Ico n="menu" s={18} />
            <span className="text-[10px]">Menú</span>
          </button>
        </nav>
      </main>

      <SupportWidget biz={biz} />

      <PayModal biz={biz} open={payModalOpen} onClose={() => setPayModalOpen(false)} />

      {showOnboarding && (
        <OnboardingModal
          biz={biz}
          setBiz={setBiz}
          saving={saving}
          setSaving={setSaving}
          showToast={pushToast}
        />
      )}


      {/* TOAST NOTIFICATIONS */}
      <ToastBar toast={toast} />
    </div>
  );
}
