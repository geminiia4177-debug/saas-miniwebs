"use client";

import React, { useState, useMemo, useRef } from "react";
import { Biz, Section, MediaItem, Appointment } from "@/lib/constants";
import { getPublicUrl } from "@/lib/urls";
import {
  Calendar,
  ShoppingBag,
  TrendingUp,
  Users,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ArrowRight,
  QrCode,
  Clock,
  ChevronRight,
} from "lucide-react";

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

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

export default function HomeTab({
  biz,
  media,
  sections,
  pending,
  appointments,
  setTab,
  copyUrl,
  copiedUrl,
}: HomeTabProps) {
  const primary = biz.primaryColor || "#6366F1";
  const publicUrl = getPublicUrl(biz);
  const [generatingStory, setGeneratingStory] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── 1. Checklist de Lanzamiento por Rubro ──
  const isTienda = biz.type === "tienda";
  const hasItems = isTienda
    ? (biz.layoutConfig?.tiendaProductos || []).length > 0
    : (biz.layoutConfig?.services || []).length > 0 || (biz.layoutConfig?.barberiaServices || []).length > 0;

  const checklistItems = useMemo(
    () => [
      { id: "info", label: "Nombre y descripción", done: !!biz.name && !!biz.description, tab: "config" },
      { id: "logo", label: "Logo del negocio", done: !!biz.logoUrl, tab: "config" },
      { id: "items", label: isTienda ? "Productos cargados" : "Servicios configurados", done: hasItems, tab: "editor" },
      { id: "hours", label: "Horarios comerciales", done: !!biz.layoutConfig?.hours, tab: "config" },
      { id: "whatsapp", label: "Número de WhatsApp", done: !!biz.whatsapp, tab: "config" },
      { id: "gallery", label: "Fotos en galería", done: media.length > 0, tab: "gallery" },
    ],
    [biz, isTienda, hasItems, media]
  );

  const completedCount = checklistItems.filter((i) => i.done).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  // ── 2. Timeline de "Hoy" ──
  const todayAppointments = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return appointments
      .filter((a) => a.date?.startsWith(todayStr))
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [appointments]);

  // ── 3. Generar Historia de Instagram con Canvas ──
  const handleGenerateStory = async () => {
    setGeneratingStory(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
      grad.addColorStop(0, "#0B0E17");
      grad.addColorStop(0.5, "#141B2D");
      grad.addColorStop(1, "#070A10");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Accent Glow
      const glow = ctx.createRadialGradient(540, 600, 50, 540, 600, 600);
      glow.addColorStop(0, `${primary}40`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1080, 1920);

      // Business Name
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 64px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(biz.name, 540, 380);

      // Subtitle / Tagline
      ctx.fillStyle = "#94A3B8";
      ctx.font = "34px sans-serif";
      ctx.fillText(biz.description || "Tu experiencia digital", 540, 450);

      // QR Code Box
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(290, 600, 500, 500, 40);
      ctx.fill();

      // Load QR Image
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(publicUrl)}&margin=15`;
      await new Promise((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 330, 640, 420, 420);
          resolve(true);
        };
        qrImg.onerror = () => resolve(false);
      });

      // Call to Action
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 44px sans-serif";
      ctx.fillText("Escaneá y visitá nuestra web", 540, 1220);

      // URL
      ctx.fillStyle = primary;
      ctx.font = "bold 36px monospace";
      ctx.fillText(publicUrl.replace("https://", ""), 540, 1290);

      // Watermark / Brand Badge
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "28px sans-serif";
      ctx.fillText("Creado con Miniwebs SaaS", 540, 1780);

      // Trigger download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${biz.subdomain}-story.png`;
      a.click();
    } catch (err) {
      console.error("Error generating story:", err);
    } finally {
      setGeneratingStory(false);
    }
  };

  // Sparkline mini helper (SVG path)
  const renderSparkline = (points: number[], color: string) => {
    const max = Math.max(...points, 1);
    const min = Math.min(...points, 0);
    const range = max - min || 1;
    const width = 80;
    const height = 28;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    });

    return (
      <svg className="overflow-visible" width={width} height={height}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords.join(" ")}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24 md:pb-12 max-w-6xl">
      {/* ── HEADER BIENVENIDA ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Panel de Control
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Hola,{" "}
            <span
              style={{
                backgroundImage: `linear-gradient(135deg, ${primary}, #A855F7)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {biz.name}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Esto es lo que está pasando en tu negocio hoy.
          </p>
        </div>

        {/* Live Site Shortcut & Flyers */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("flyers")}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Flyers con IA</span>
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all"
          >
            <span>Ver Sitio en Vivo</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* ── 4 STAT CARDS CON SPARKLINES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Visitas */}
        <div className="p-5 rounded-2xl bg-[#0E131F] border border-white/5 shadow-lg flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visitas (7d)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-black text-white tabular-nums">482</div>
              <span className="text-[11px] text-emerald-400 font-bold">+14% vs sem. ant.</span>
            </div>
            {renderSparkline([20, 35, 42, 60, 55, 78, 95], "#2DD4A4")}
          </div>
        </div>

        {/* Card 2: Turnos / Pedidos Pendientes */}
        <div
          onClick={() => setTab(isTienda ? "orders" : "appointments")}
          className="p-5 rounded-2xl bg-[#0E131F] border border-white/5 hover:border-indigo-500/40 shadow-lg flex flex-col justify-between space-y-4 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isTienda ? "Pedidos Nuevos" : "Turnos Pendientes"}
            </span>
            {isTienda ? (
              <ShoppingBag className="w-4 h-4 text-amber-400" />
            ) : (
              <Calendar className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-black text-amber-400 tabular-nums">
                {pending.length}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Requieren confirmación</span>
            </div>
            {renderSparkline([1, 4, 3, 7, 5, 8, pending.length || 6], "#F5B544")}
          </div>
        </div>

        {/* Card 3: Facturación Estimada */}
        <div className="p-5 rounded-2xl bg-[#0E131F] border border-white/5 shadow-lg flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Facturación Est.</span>
            <span className="text-[10px] font-bold text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10">Mes</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-black text-white tabular-nums">$148.500</div>
              <span className="text-[11px] text-indigo-400 font-bold">Cobros confirmados</span>
            </div>
            {renderSparkline([40, 65, 80, 75, 110, 130, 148], "#7C6CFF")}
          </div>
        </div>

        {/* Card 4: Tasa de Conversión */}
        <div className="p-5 rounded-2xl bg-[#0E131F] border border-white/5 shadow-lg flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversión</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-black text-white tabular-nums">5.2%</div>
              <span className="text-[11px] text-purple-400 font-bold">Visita a contacto</span>
            </div>
            {renderSparkline([3.2, 3.8, 4.1, 4.5, 4.8, 5.0, 5.2], "#A855F7")}
          </div>
        </div>
      </div>

      {/* ── 2 COLUMNAS: BLOQUE "HOY" + CHECKLIST DE LANZAMIENTO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BLOQUE "HOY": TIMELINE DEL DÍA (Span 7) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#0E131F] border border-white/5 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Actividad de Hoy</h3>
              </div>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" })}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Agenda y compromisos programados para la jornada de hoy.
            </p>
          </div>

          <div className="flex-1 space-y-3">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-xs font-bold text-white">¡Todo al día por hoy!</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  No tenés turnos programados para hoy. Podés compartir tu link en Instagram para recibir nuevas reservas.
                </p>
              </div>
            ) : (
              todayAppointments.slice(0, 4).map((apt) => (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-indigo-400 text-sm bg-indigo-500/10 px-2.5 py-1 rounded-xl">
                      {apt.time}
                    </span>
                    <div>
                      <h4 className="font-bold text-white">{apt.clientName}</h4>
                      <p className="text-slate-400 text-[11px]">{apt.serviceName}</p>
                    </div>
                  </div>

                  {apt.clientPhone && (
                    <a
                      href={`https://wa.me/${apt.clientPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-slate-400">Total de citas agendadas: {appointments.length}</span>
            <button
              type="button"
              onClick={() => setTab("appointments")}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver agenda completa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CHECKLIST DE LANZAMIENTO (Span 5) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#0E131F] border border-white/5 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">Checklist de Lanzamiento</h3>
              </div>
              <span className="text-xs font-black text-indigo-400 tabular-nums">
                {progressPercent}%
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Completá estos pasos para que tu web brille al 100%.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${primary}, #2DD4A4)`,
              }}
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.tab)}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                  item.done
                    ? "bg-white/5 border-white/5 text-slate-300"
                    : "bg-indigo-600/10 border-indigo-500/30 text-white hover:bg-indigo-600/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className={item.done ? "line-through text-slate-400" : "font-semibold"}>
                    {item.label}
                  </span>
                </div>
                {!item.done && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-slate-500 text-center">
            {completedCount === checklistItems.length
              ? "🎉 ¡Felicitaciones! Tu negocio está 100% configurado."
              : `Faltan ${checklistItems.length - completedCount} tareas para completar tu perfil.`}
          </div>
        </div>
      </div>

      {/* ── TARJETA "COMPARTÍ TU WEB" (QR + INSTAGRAM STORY + LINK) ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[#0E131F] to-[#0A0D14] border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-xl shrink-0 flex items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}&margin=4`}
              alt="QR Code"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1.5">
              <Share2 className="w-3 h-3" />
              <span>Difusión de tu Marca</span>
            </div>
            <h3 className="text-lg font-black text-white">Compartí tu Miniweb</h3>
            <p className="text-xs text-slate-400 max-w-md mt-0.5 leading-relaxed">
              Copiá tu enlace para ponerlo en tu biografía de Instagram o descargá el kit para compartir.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={copyUrl}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedUrl ? "¡Copiado!" : "Copiar Link"}</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("flyers")}
            className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Crear 3 Flyers con IA</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateStory}
            disabled={generatingStory}
            className="px-5 py-3 rounded-2xl text-white font-bold text-xs shadow-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            style={{ background: primary }}
          >
            <InstagramIcon className="w-4 h-4" />
            <span>{generatingStory ? "Generando..." : "Historia Rápida"}</span>
            <Download className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
}
