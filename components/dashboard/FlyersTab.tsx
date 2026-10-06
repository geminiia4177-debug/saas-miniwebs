"use client";

import React, { useState } from "react";
import { Sparkles, Download, Copy, Check, RefreshCw, Layers, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { getPublicUrl } from "@/lib/urls";
import { Ico } from "@/lib/constants";

export interface FlyerItem {
  id: string;
  title: string;
  headline: string;
  badge: string;
  ctaText: string;
  imagePrompt: string;
  instagramPost: string;
  instagramStory: string;
  facebookPost: string;
}

export interface FlyersTabProps {
  biz: any;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warn") => void;
}

export default function FlyersTab({ biz, showToast }: FlyersTabProps) {
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState<"general" | "promo" | "services" | "turnos">("general");
  const [customPrompt, setCustomPrompt] = useState("");
  const [flyers, setFlyers] = useState<FlyerItem[]>([]);
  const [selectedFlyerIndex, setSelectedFlyerIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<"post" | "story" | "facebook">("post");
  const [copiedCaption, setCopiedCaption] = useState(false);

  const publicUrl = getPublicUrl(biz);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/flyers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: biz.id,
          goal,
          customPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al generar flyers con IA");
      }

      if (data.flyers && data.flyers.length > 0) {
        setFlyers(data.flyers);
        setSelectedFlyerIndex(0);
        showToast("¡3 Flyers generados y adaptados con Sharp con éxito! 🎨", "success");
      } else {
        throw new Error("No se recibieron flyers del servidor");
      }
    } catch (err: any) {
      showToast(err.message || "Error al generar flyers", "error");
    } finally {
      setLoading(false);
    }
  };

  const activeFlyer = flyers[selectedFlyerIndex];

  const getCurrentImage = (f: FlyerItem) => {
    if (selectedFormat === "story") return f.instagramStory;
    if (selectedFormat === "facebook") return f.facebookPost;
    return f.instagramPost;
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Flyer descargado (${filename}) ✓`, "success");
  };

  const handleCopyCaption = () => {
    if (!activeFlyer) return;
    const caption = `✨ ${activeFlyer.title} ✨\n\n${activeFlyer.headline}\n\n👉 ${activeFlyer.ctaText} ingresando en nuestro sitio:\n🔗 ${publicUrl}\n\n#${biz.subdomain || "negocio"} #${biz.type || "servicios"} #turnosonline #calidad`;
    navigator.clipboard.writeText(caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
    showToast("Texto publicitario copiado para Instagram/Facebook ✓", "success");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-1 border border-border-default shadow-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-fg">Flyers para Redes Sociales con IA</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-accent/10 text-accent border border-accent/20">
              Sharp + Gemini
            </span>
          </div>
          <p className="text-xs text-fg-muted max-w-2xl">
            Crea 3 piezas publicitarias profesionales basadas en los datos y colores de tu negocio. Cada imagen se procesa automáticamente con Sharp para Instagram (Post y Story) y Facebook.
          </p>
        </div>

        <HelpTooltip
          title="Flyers con IA"
          description="Los flyers toman el rubro, nombre, colores de marca y servicios de tu negocio para generar piezas de diseño listas para subir a tus redes."
          tip="Puedes elegir el formato Post (1:1), Historia (9:16) o Facebook (1200x630) y descargarlos en 1 clic."
        />
      </div>

      {/* ── CONFIGURACIÓN DE CAMPAÑA ── */}
      <div className="p-5 rounded-2xl bg-surface-1 border border-border-default space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-fg uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>Configurar Generación</span>
          </span>
          <span className="text-[11px] text-fg-subtle">
            Colores aplicados:{" "}
            <span
              className="inline-block w-2.5 h-2.5 rounded-full border border-black/20 align-middle ml-1 mr-0.5"
              style={{ backgroundColor: biz.primaryColor || "#4f46e5" }}
            />
            {biz.primaryColor || "#4f46e5"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {[
            { id: "general", label: "General & Marca", desc: "Presentación elegante" },
            { id: "promo", label: "Oferta & Promo", desc: "Descuento o beneficio" },
            { id: "services", label: "Servicios Estrella", desc: "Enfoque en calidad" },
            { id: "turnos", label: "Reservas Online", desc: "Llamado a agendar" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGoal(item.id as any)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                goal === item.id
                  ? "bg-accent/10 border-accent text-fg shadow-sm"
                  : "bg-surface-2 hover:bg-surface-3 border-border-subtle text-fg-muted hover:text-fg"
              }`}
            >
              <span className={`text-xs font-bold block ${goal === item.id ? "text-accent" : "text-fg"}`}>
                {item.label}
              </span>
              <span className="text-[10px] text-fg-subtle">{item.desc}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Instrucción adicional opcional (ej: 'Enfocarse en cortes modernos de hombre', 'Descuento del 20% los martes')..."
            className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border-default text-xs text-fg focus:border-accent focus:outline-none"
          />

          <Button
            variant="primary"
            size="md"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:w-auto gap-2 font-bold whitespace-nowrap shadow-lg cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generando 3 Flyers con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{flyers.length > 0 ? "Regenerar 3 Flyers" : "✨ Generar 3 Flyers con IA"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── VISUALIZADOR DE FLYERS GENERADOS ── */}
      {flyers.length > 0 && activeFlyer && (
        <div className="space-y-5 animate-fadeIn">
          {/* Tabs para seleccionar entre los 3 flyers */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              {flyers.map((f, idx) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFlyerIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                    selectedFlyerIndex === idx
                      ? "bg-accent text-white border-accent shadow-md"
                      : "bg-surface-2 text-fg-muted hover:text-fg hover:bg-surface-3 border-border-default"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="truncate max-w-[130px] sm:max-w-[200px]">{f.title}</span>
                </button>
              ))}
            </div>

            {/* Selector de Red Social / Formato Sharp */}
            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border-subtle">
              <button
                type="button"
                onClick={() => setSelectedFormat("post")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedFormat === "post"
                    ? "bg-surface-3 text-fg shadow-sm border border-border-default"
                    : "text-fg-subtle hover:text-fg"
                }`}
              >
                <Ico n="instagram" s={14} c="text-pink-400" />
                <span>Feed (1:1)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat("story")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedFormat === "story"
                    ? "bg-surface-3 text-fg shadow-sm border border-border-default"
                    : "text-fg-subtle hover:text-fg"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span>Historia (9:16)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat("facebook")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedFormat === "facebook"
                    ? "bg-surface-3 text-fg shadow-sm border border-border-default"
                    : "text-fg-subtle hover:text-fg"
                }`}
              >
                <Ico n="facebook" s={14} c="text-blue-400" />
                <span>Facebook (1.91:1)</span>
              </button>
            </div>
          </div>

          {/* Área Central: Preview y Acciones */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#070a12] rounded-2xl border border-white/10 shadow-2xl relative">
              <div
                className={`transition-all duration-300 relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center bg-black ${
                  selectedFormat === "story"
                    ? "w-[280px] sm:w-[320px] aspect-[9/16]"
                    : selectedFormat === "facebook"
                    ? "w-full max-w-[560px] aspect-[1200/630]"
                    : "w-full max-w-[420px] aspect-square"
                }`}
              >
                <img
                  src={getCurrentImage(activeFlyer)}
                  alt={activeFlyer.title}
                  className="w-full h-full object-cover select-none"
                />

                {/* Badge flotante en el preview */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span>{activeFlyer.badge}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-[11px] text-fg-subtle">
                <span>
                  Resolución:{" "}
                  <strong>
                    {selectedFormat === "post"
                      ? "1080 x 1080 px"
                      : selectedFormat === "story"
                      ? "1080 x 1920 px"
                      : "1200 x 630 px"}
                  </strong>
                </span>
                <span>•</span>
                <span>Procesado con <strong>Sharp</strong></span>
              </div>
            </div>

            {/* Panel de Detalles y Descarga */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-surface-1 border border-border-default space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent/15 text-accent border border-accent/30">
                      {activeFlyer.badge}
                    </span>
                    <span className="text-[11px] text-fg-subtle">Flyer #{selectedFlyerIndex + 1}</span>
                  </div>
                  <h3 className="text-base font-bold text-fg">{activeFlyer.title}</h3>
                  <p className="text-xs text-fg-muted leading-relaxed">{activeFlyer.headline}</p>
                </div>

                <div className="pt-3 border-t border-border-subtle space-y-2.5">
                  <span className="text-[11px] font-bold text-fg uppercase tracking-wider block">
                    Descargar Flyer
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          getCurrentImage(activeFlyer),
                          `flyer-${selectedFlyerIndex + 1}-${selectedFormat}-${biz.subdomain || "negocio"}.jpg`
                        )
                      }
                      className="px-3.5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar ({selectedFormat.toUpperCase()})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyCaption}
                      className="px-3.5 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-fg font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-border-default cursor-pointer"
                    >
                      {copiedCaption ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCaption ? "¡Copiado!" : "Copiar Texto / Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Descargar todos los formatos para este flyer */}
                <div className="pt-3 border-t border-border-subtle space-y-2">
                  <span className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider block">
                    Descargar Este Flyer en Todos los Formatos
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          activeFlyer.instagramPost,
                          `flyer-${selectedFlyerIndex + 1}-post-${biz.subdomain}.jpg`
                        )
                      }
                      className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-subtle text-[11px] font-semibold text-fg flex flex-col items-center gap-1 transition-colors"
                    >
                      <Ico n="instagram" s={14} c="text-pink-400" />
                      <span>Feed (1:1)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          activeFlyer.instagramStory,
                          `flyer-${selectedFlyerIndex + 1}-story-${biz.subdomain}.jpg`
                        )
                      }
                      className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-subtle text-[11px] font-semibold text-fg flex flex-col items-center gap-1 transition-colors"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                      <span>Story (9:16)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          activeFlyer.facebookPost,
                          `flyer-${selectedFlyerIndex + 1}-facebook-${biz.subdomain}.jpg`
                        )
                      }
                      className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-subtle text-[11px] font-semibold text-fg flex flex-col items-center gap-1 transition-colors"
                    >
                      <Ico n="facebook" s={14} c="text-blue-400" />
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío antes de generar */}
      {flyers.length === 0 && !loading && (
        <div className="p-12 text-center rounded-2xl bg-surface-1 border border-dashed border-border-default space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-fg">Tus Flyers Listos en Segundos</h3>
            <p className="text-xs text-fg-muted">
              Elige el objetivo que deseas para tu campaña y haz clic en <strong>Generar 3 Flyers con IA</strong>. Tendrás 3 propuestas visuales listas para compartir en tu Instagram y Facebook.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={handleGenerate} className="gap-2 font-bold cursor-pointer">
            <Sparkles className="w-4 h-4" />
            <span>Generar 3 Flyers con IA</span>
          </Button>
        </div>
      )}
    </div>
  );
}
