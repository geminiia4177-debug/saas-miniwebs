"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Biz, Section, MediaItem, Appointment, ToastType, DEFAULT_SECTIONS, Ico } from "@/lib/constants";
import Sidebar, { NavItem } from "@/components/dashboard/Sidebar";
import EditorTab from "@/components/dashboard/EditorTab";
import ManagementTabs from "@/components/dashboard/ManagementTabs";
import CrmTab from "@/components/dashboard/CrmTab";
import OrdersTablesTab from "@/components/dashboard/OrdersTablesTab"; // force IDE refresh
import BiolinksTab from "@/components/dashboard/BiolinksTab";
import IntelligenceTab from "@/components/dashboard/IntelligenceTab";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ─────────────────────────────────────────────
// IMGBB UPLOAD (Para la subida general de la galería)
// ─────────────────────────────────────────────
const uploadToImgBB = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(
    `/api/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
};

// ─────────────────────────────────────────────
// COMPONENTES DE INTERFAZ (Sidebar y Alertas)
// ─────────────────────────────────────────────
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



// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL: DIRECTOR DE ORQUESTA
// ─────────────────────────────────────────────
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
  const [unreadSupport, setUnreadSupport] = useState(0);

  // ── SOPORTE CHAT STATE ──
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMsgs, setSupportMsgs] = useState<any[]>([]);
  const [supportInput, setSupportInput] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const supportScrollRef = React.useRef<HTMLDivElement>(null);

  // Fetch support messages
  const fetchSupportMsgs = async () => {
    if (!biz) return;
    try {
      const res = await fetch(`/api/messages`);
      const data = await res.json();
      if (res.ok) setSupportMsgs(data);
    } catch (e) {}
  };

  useEffect(() => {
    if (supportOpen) {
      fetchSupportMsgs();
      // Mark as read when opening widget
      fetch("/api/messages/read", { method: "POST", body: JSON.stringify({ businessId: biz?.id }) });
    }
  }, [supportOpen, biz]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (supportOpen) {
      interval = setInterval(fetchSupportMsgs, 5000);
    }
    return () => clearInterval(interval);
  }, [supportOpen, biz]);

  useEffect(() => {
    if (supportScrollRef.current) {
      supportScrollRef.current.scrollTop = supportScrollRef.current.scrollHeight;
    }
  }, [supportMsgs, supportOpen]);

  const handleSendSupport = async () => {
    if (!supportInput.trim() || supportLoading || !biz) return;
    const msgText = supportInput.trim();
    // Optimistic UI update
    const tempMsg = { id: "temp", content: msgText, senderType: "USER", createdAt: new Date() };
    setSupportMsgs(prev => [...prev, tempMsg]);
    setSupportInput("");
    setSupportLoading(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, content: msgText })
      });
      if (res.ok) {
        await fetchSupportMsgs();
      }
    } catch {
      setSupportMsgs(prev => [...prev, { id: "err", content: "Error de conexión.", senderType: "AI", createdAt: new Date() }]);
    }
    setSupportLoading(false);
  };

  // ── PAGOS MODAL STATE ──
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payStatus, setPayStatus] = useState<"idle"|"sending"|"sent">("idle");

  // ── ONBOARDING STATE ──
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({ name: "", cbu: "", alias: "", phone: "" });
  const logoRef = React.useRef<HTMLInputElement>(null);

  const pushToast = (msg: string, type: "success" | "error" | "info" | "warn" = "info") => {
    setToast({ msg, type: type as any });
    setTimeout(() => setToast(null), 3000);
  };

  // ── CARGAR DATOS DEL NEGOCIO ──
  useEffect(() => {
    // Fetch active global alerts
    fetch("/api/alerts")
      .then(r => r.json())
      .then(d => {
        if(d && d.length > 0) setGlobalAlert(d[0]);
      })
      .catch(e => console.error("Error fetching alerts", e));

    const fetchUnread = () => {
      fetch("/api/messages/unread")
        .then(r => r.json())
        .then(d => { if (d.count !== undefined) setUnreadSupport(d.count); })
        .catch(e => {});
    };
    fetchUnread();
    const unreadInterval = setInterval(fetchUnread, 10000);

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
            setOnboardingData(prev => ({ ...prev, name: d.business.name || "", phone: d.business.phone || "" }));
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── AUTO COLLAPSE SIDEBAR EN EDITOR ──
  useEffect(() => {
    if (tab === "editor") setSidebarCollapsed(true);
    else setSidebarCollapsed(false);
  }, [tab]);

  // ── CARGAR TURNOS ──
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
  const saveAll = async () => {
    if (!biz) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${biz.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...biz, layoutConfig: { ...(biz.layoutConfig || {}), sections, media } }),
      });
      if (res.ok) pushToast("Configuración guardada con éxito ✓", "success");
      else pushToast("Error al guardar en el servidor", "error");
    } catch {
      pushToast("Error de conexión", "error");
    }
    setSaving(false);
  };

  // ── SUBIR ARCHIVOS DE LA GALERÍA ──
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
        const url = await uploadToImgBB(file);
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
        <p className="text-slate-400 text-sm">Tu cuenta no tiene un negocio asignado.<br/>Contactá a la administración para obtener tu acceso.</p>
      </div>
    </div>
  );

  const pending = appointments.filter(a => a.status === "PENDING");

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row" style={{ background: "#070b12", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
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
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-64 sidebar-slide-in flex flex-col" style={{ background: "linear-gradient(180deg,#0b1020 0%,#090e1c 100%)" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-3">
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
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-2">Principal</p>
              <NavItem icon="grid" label="Resumen" tab="home" active={tab} setActive={(t) => { setTab(t); setMobileMenuOpen(false); }} />
              <NavItem icon="bot" label="Asesor Inteligente" tab="intelligence" active={tab} setActive={(t) => { setTab(t); setMobileMenuOpen(false); }} />
              <NavItem icon="eye" label="Editor Visual" tab="editor" active={tab} setActive={(t) => { setTab(t); setMobileMenuOpen(false); }} />
              <NavItem icon="image" label="Galería" tab="gallery" active={tab} setActive={(t) => { setTab(t); setMobileMenuOpen(false); }} badge={media.length} />
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 py-2 mt-3">Gestión</p>
              <NavItem icon="calendar" label="Turnos" tab="appointments" active={tab} setActive={(t) => { setTab(t); setMobileMenuOpen(false); }} badge={pending.length} />
              <NavItem icon="settings" label="Configuración" tab="config" active={tab} setActive={(t) => { setTab(t); setMobileMenuOpen(false); }} />
            </nav>
            <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:text-white hover:bg-red-500/20 bg-red-500/10 transition-colors border border-red-500/20">
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
        unreadSupport={unreadSupport}
      />

      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden custom-scrollbar bg-[#080a10]">
        
        {/* ALERT BANNER GLOBAL */}
        {globalAlert && (
          <div className={`px-4 py-2 flex items-center justify-center gap-2 text-sm font-semibold z-50 ${globalAlert.type === "warning" ? "bg-red-500/20 text-red-200 border-b border-red-500/30" : globalAlert.type === "success" ? "bg-emerald-500/20 text-emerald-200 border-b border-emerald-500/30" : "bg-indigo-500/20 text-indigo-200 border-b border-indigo-500/30"}`}>
            <Ico n="info" s={16} />
            <span>{globalAlert.content}</span>
            <button onClick={() => setGlobalAlert(null)} className="ml-4 opacity-50 hover:opacity-100"><Ico n="x" s={14} /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-6 relative" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.05), transparent 60%)" }}>
          
          <div className="max-w-[1400px] mx-auto h-full flex flex-col">
            {/* ── HOME (Overview) ── */}
            {tab === "home" && (
              <div className="max-w-4xl animate-fadeIn">
                <div className="mb-8">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">Bienvenido, <span style={{ backgroundImage: `linear-gradient(135deg,${biz.primaryColor},${biz.secondaryColor})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{biz.name}</span></h1>
                  <p className="text-slate-500">Esto es lo que está pasando hoy.</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                  {[
                    { label: "Turnos pendientes", val: pending.length, icon: "calendar", color: "#f59e0b", bg: "#f59e0b15", tab: "appointments" },
                    { label: "Fotos en galería", val: media.length, icon: "image", color: "#10b981", bg: "#10b98115", tab: "gallery" },
                    { label: "Secciones activas", val: sections.filter((s: any) => s.visible).length, icon: "eye", color: "#6366f1", bg: "#6366f115", tab: "editor" },
                    { label: "Estado", val: "Activo", icon: "zap", color: "#a855f7", bg: "#a855f715", tab: "config" },
                  ].map((s: any, i: number) => (
                    <div key={s.label} onClick={() => setTab(s.tab)} className="group rounded-2xl p-5 flex flex-col justify-between cursor-pointer hover:shadow-2xl transition-all duration-300 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: s.bg }}>
                          <Ico n={s.icon} s={18} style={{ color: s.color } as any} />
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

                  <div className="rounded-2xl p-6 relative overflow-hidden group" style={{ background: "linear-gradient(135deg,#4338ca,#6366f1)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/20 transition-colors"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <h3 className="text-white font-bold text-lg mb-1">¡Completá tu perfil!</h3>
                        <p className="text-sm text-indigo-100 mb-4 leading-relaxed">Personalizá los colores, agregá tus servicios y subí algunas fotos para empezar a recibir reservas.</p>
                      </div>
                      <button onClick={() => setTab("editor")} className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-indigo-600 hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10">
                        <Ico n="edit" s={14} /> Ir al Editor Visual
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── CHARTS (ANALYTICS) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  {/* Bar Chart */}
                  <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Ico n="bar-chart-2" s={16} c="text-indigo-400"/> Actividad (Últimos 7 días)</h3>
                    <div className="h-64">
                      {(() => {
                        const last7Days = Array.from({length: 7}, (_, i) => {
                          const d = new Date(); d.setDate(d.getDate() - (6 - i));
                          return { name: d.toLocaleDateString('es-AR', {weekday: 'short'}), dateStr: d.toDateString(), turnos: 0 };
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
                              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                              <Bar dataKey="turnos" fill="#6366f1" radius={[4,4,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Ico n="pie-chart" s={16} c="text-purple-400"/> Servicios Populares</h3>
                    <div className="h-64">
                      {(() => {
                        const servicesMap: any = {};
                        appointments.forEach(a => {
                          const s = a.serviceName || "Otros";
                          servicesMap[s] = (servicesMap[s] || 0) + 1;
                        });
                        const data = Object.keys(servicesMap).map(k => ({ name: k, value: servicesMap[k] })).sort((a,b) => b.value - a.value).slice(0, 5);
                        const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b'];
                        if (data.length === 0) return <div className="h-full flex items-center justify-center text-slate-500 text-sm">Sin datos aún</div>;
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} itemStyle={{color: '#fff'}} />
                            </PieChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </div>
                </div>

              </div>
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
      </main>

      <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end">
        {supportOpen && (
          <div className="mb-4 w-80 bg-[#131929] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp" style={{ height: "400px" }}>
            <div className="p-4 bg-[var(--accent)] text-black flex justify-between items-center" style={{ background: biz?.primaryColor || "#6366f1" }}>
              <div className="flex items-center gap-2">
                <Ico n="message-circle" s={18} c="text-white" />
                <span className="font-bold text-white text-sm">Soporte Técnico</span>
              </div>
              <button onClick={() => setSupportOpen(false)} className="text-white hover:text-black/50 transition-colors">
                <Ico n="x" s={16} />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar bg-[#050810]" ref={supportScrollRef}>
              {supportMsgs.length === 0 && !supportLoading && (
                <div className="text-center text-slate-400 text-sm mt-4">¡Hola! ¿En qué podemos ayudarte?</div>
              )}
              {supportMsgs.map((m, i) => {
                if (m.content === "[CONSULTA_FINALIZADA]") {
                  return (
                    <div key={m.id || i} className="text-center text-xs text-slate-500 my-2 px-4 py-1 bg-white/5 rounded-full self-center border border-white/5">
                      Chat finalizado. Escribe para iniciar una nueva consulta.
                    </div>
                  );
                }
                if (m.content.startsWith("[TRANSFERIDO DESDE IA]")) {
                  return (
                    <div key={m.id || i} className="text-center text-xs text-indigo-400 my-2 px-4 py-1 bg-indigo-500/10 rounded-full self-center border border-indigo-500/20">
                      Un asesor humano se ha unido al chat.
                    </div>
                  );
                }
                return (
                  <div key={m.id || i} className={`max-w-[85%] p-3 rounded-xl text-sm ${m.senderType === "USER" ? "bg-indigo-500/20 text-indigo-100 self-end rounded-br-sm border border-indigo-500/30" : "bg-white/5 text-slate-300 self-start rounded-bl-sm border border-white/10 whitespace-pre-line"}`}>
                    {m.content}
                  </div>
                );
              })}
              {supportLoading && (
                <div className="max-w-[85%] p-3 rounded-xl text-sm bg-white/5 text-slate-400 self-start rounded-bl-sm border border-white/10 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                  Escribiendo...
                </div>
              )}
            </div>
            <div className="p-3 bg-[#131929] border-t border-white/5 flex gap-2">
              <input 
                type="text" 
                value={supportInput}
                onChange={e => setSupportInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleSendSupport();
                }}
                disabled={supportLoading}
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-[#050810] text-sm text-white px-3 py-2 rounded-lg border border-white/10 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              />
              <button 
                onClick={handleSendSupport}
                disabled={supportLoading}
                className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white hover:bg-indigo-400 transition-colors disabled:opacity-50"
              >
                <Ico n="send" s={16} />
              </button>
            </div>
          </div>
        )}
        <button 
          onClick={() => {
            setSupportOpen(!supportOpen);
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 relative ${supportOpen ? "bg-white/10" : "bg-indigo-500"}`}
        >
          <Ico n={supportOpen ? "x" : "message-circle"} s={24} c="text-white" />
          {!supportOpen && unreadSupport > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-[#080a10] rounded-full"></span>
          )}
        </button>
      </div>

      {/* ── PAGOS MODAL ── */}
      {payModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#131929] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative" style={{ animation: "slideUp 0.3s ease" }}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0b1020]">
              <div>
                <h3 className="text-xl font-extrabold text-white mb-1">Pago de Suscripción</h3>
                <p className="text-xs text-slate-400">Transferí para mantener tu servicio activo</p>
              </div>
              <button onClick={() => setPayModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                <Ico n="x" s={16} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-[#050810] border border-white/5 rounded-xl p-5 mb-6 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Datos de Transferencia</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">CBU / CVU</p>
                    <p className="text-lg font-mono text-white font-medium select-all">{biz?.paymentData?.cbu || "No configurado"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Alias</p>
                    <p className="text-lg font-mono text-emerald-400 font-bold select-all">{biz?.paymentData?.alias || "No configurado"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Titular</p>
                    <p className="text-sm font-medium text-white">{biz?.paymentData?.titular || "No configurado"}</p>
                  </div>
                </div>
              </div>

              {payStatus === "idle" && (
                <div>
                  <p className="text-sm font-semibold text-white mb-3 text-center">Ya transferí, enviar comprobante:</p>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-500/30 rounded-xl cursor-pointer hover:bg-indigo-500/5 transition-colors bg-[#050810]">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Ico n="upload-cloud" s={24} c="text-indigo-400 mb-2" />
                      <p className="mb-1 text-sm text-slate-300 font-semibold">Click para subir comprobante</p>
                      <p className="text-xs text-slate-500">PNG, JPG o PDF</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                      if (e.target.files?.length) {
                        setPayStatus("sending");
                        setTimeout(() => setPayStatus("sent"), 2000);
                      }
                    }} />
                  </label>
                </div>
              )}

              {payStatus === "sending" && (
                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-[#050810]">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                  <p className="text-sm font-medium text-slate-300 animate-pulse">Enviando comprobante...</p>
                </div>
              )}

              {payStatus === "sent" && (
                <div className="h-32 flex flex-col items-center justify-center border border-emerald-500/30 rounded-xl bg-emerald-500/5">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                    <Ico n="check" s={24} />
                  </div>
                  <p className="text-sm font-bold text-emerald-400">¡Comprobante enviado!</p>
                  <p className="text-xs text-slate-400 mt-1">Lo verificaremos a la brevedad.</p>
                </div>
              )}
            </div>
            {payStatus === "sent" && (
               <div className="p-4 border-t border-white/10 bg-[#0b1020]">
                 <button onClick={() => { setPayModalOpen(false); setTimeout(() => setPayStatus("idle"), 300); }} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors">
                   Cerrar ventana
                 </button>
               </div>
            )}
          </div>
        </div>
      )}

      {/* ── ONBOARDING MODAL ── */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#070b12]/95 backdrop-blur-xl p-4">
          <div className="bg-[#111825] w-full max-w-xl rounded-3xl border border-indigo-500/20 shadow-2xl p-8 relative overflow-hidden animate-slideUp">
            {/* Decors */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">Configuración Inicial</h2>
                  <p className="text-indigo-300 text-sm mt-1">Paso {onboardingStep} de 2</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <Ico n={onboardingStep === 1 ? "image" : "check-circle"} s={24} c="text-indigo-400" />
                </div>
              </div>

              {onboardingStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center p-6 border border-white/10 rounded-2xl bg-white/5 border-dashed">
                    <p className="text-sm font-bold text-white mb-4">Sube el logo de tu negocio</p>
                    <div className="flex justify-center mb-4">
                      {biz.logoUrl ? (
                        <img src={biz.logoUrl} className="w-24 h-24 rounded-2xl object-cover shadow-lg" alt="logo" />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                          {biz.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      pushToast("Subiendo logo...", "info");
                      try {
                        const url = await uploadToImgBB(file);
                        setBiz((prev: any) => prev ? { ...prev, logoUrl: url } : prev);
                        pushToast("Logo subido con éxito", "success");
                      } catch {
                        pushToast("Error al subir", "error");
                      }
                    }} />
                    <button onClick={() => logoRef.current?.click()} className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-colors">
                      Elegir Imagen
                    </button>
                  </div>
                  <button onClick={() => setOnboardingStep(2)} className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-gray-100 font-bold transition-colors">
                    Continuar
                  </button>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Teléfono / WhatsApp</label>
                    <input type="text" value={onboardingData.phone} onChange={e => setOnboardingData({...onboardingData, phone: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none" placeholder="Ej: 5512345678" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">CBU (Opcional)</label>
                      <input type="text" value={onboardingData.cbu} onChange={e => setOnboardingData({...onboardingData, cbu: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none" placeholder="00000..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Alias (Opcional)</label>
                      <input type="text" value={onboardingData.alias} onChange={e => setOnboardingData({...onboardingData, alias: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none" placeholder="MI.ALIAS" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setOnboardingStep(1)} className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors">
                      Atrás
                    </button>
                    <button onClick={async () => {
                      setSaving(true);
                      try {
                        const paymentData = { cbu: onboardingData.cbu, alias: onboardingData.alias, titular: "" };
                        await fetch(`/api/businesses/${biz.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ 
                            ...biz, 
                            phone: onboardingData.phone,
                            paymentData,
                            layoutConfig: { ...(biz.layoutConfig || {}), onboarded: true } 
                          }),
                        });
                        setBiz((prev: any) => ({ ...prev, phone: onboardingData.phone, paymentData, layoutConfig: { ...prev.layoutConfig, onboarded: true } }));
                        setShowOnboarding(false);
                        pushToast("¡Configuración completada! 🎉", "success");
                      } catch (e) {
                        pushToast("Error guardando datos", "error");
                      }
                      setSaving(false);
                    }} disabled={saving} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold transition-colors shadow-lg shadow-indigo-500/20">
                      {saving ? "Finalizando..." : "Finalizar y Entrar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <ToastBar toast={toast} />
    </div>
  );
}