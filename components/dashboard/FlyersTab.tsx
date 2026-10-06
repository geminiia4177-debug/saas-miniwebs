"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Smartphone,
  Calendar,
  Lock,
  Share2,
  Edit3,
  ExternalLink,
  Flame,
  CheckCircle2,
} from "lucide-react";
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
  imagePrompt?: string;
  caption?: string;
  hashtags?: string;
  style?: "promo" | "editorial" | "action";
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

  // Inicializar con flyers guardados si existen en el negocio
  const initialFlyers: FlyerItem[] = biz?.layoutConfig?.flyersUsage?.savedFlyers || [];
  const [flyers, setFlyers] = useState<FlyerItem[]>(initialFlyers);
  const [selectedFlyerIndex, setSelectedFlyerIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<"post" | "story" | "facebook">("post");
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Estado del cupo mensual
  const initialNextDate = biz?.layoutConfig?.flyersUsage?.nextAvailableAt || null;
  const [canGenerate, setCanGenerate] = useState<boolean>(true);
  const [nextAvailableAt, setNextAvailableAt] = useState<string | null>(initialNextDate);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  // Edición sin cupo (FM8)
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editHeadline, setEditHeadline] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [editCta, setEditCta] = useState("");
  const [editStyle, setEditStyle] = useState<"promo" | "editorial" | "action">("promo");
  const [rerendering, setRerendering] = useState(false);

  // Destacar en BioLinks (BM3)
  const [featuringBio, setFeaturingBio] = useState(false);

  const publicUrl = getPublicUrl(biz);

  // Consultar estado de cuota y sincronizar
  const checkQuotaStatus = async () => {
    try {
      const res = await fetch(`/api/flyers/generate?businessId=${biz.id}`);
      if (res.ok) {
        const data = await res.json();
        setCanGenerate(data.canGenerate !== false);
        setNextAvailableAt(data.nextAvailableAt);
        setDaysRemaining(data.daysRemaining || 0);
        if (Array.isArray(data.savedFlyers) && data.savedFlyers.length > 0) {
          setFlyers(data.savedFlyers);
        }
      }
    } catch (e) {
      console.warn("Error al consultar cuota de flyers:", e);
    }
  };

  useEffect(() => {
    checkQuotaStatus();
  }, [biz.id]);

  const activeFlyer = flyers[selectedFlyerIndex];

  // Sincronizar campos de edición cuando cambia el flyer activo
  useEffect(() => {
    if (activeFlyer) {
      setEditTitle(activeFlyer.title || "");
      setEditHeadline(activeFlyer.headline || "");
      setEditBadge(activeFlyer.badge || "");
      setEditCta(activeFlyer.ctaText || "");
      setEditStyle(activeFlyer.style || (selectedFlyerIndex === 0 ? "promo" : selectedFlyerIndex === 1 ? "editorial" : "action"));
    }
  }, [activeFlyer, selectedFlyerIndex]);

  const handleGenerate = async (forceAdmin = false) => {
    if (!canGenerate && !forceAdmin) {
      showToast("Ya alcanzaste el límite mensual de 3 flyers para esta tienda", "warn");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/flyers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: biz.id,
          goal,
          customPrompt,
          adminForce: forceAdmin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.quotaExceeded) {
          setCanGenerate(false);
          setNextAvailableAt(data.nextAvailableAt);
          if (data.savedFlyers?.length > 0) {
            setFlyers(data.savedFlyers);
          }
          throw new Error(data.message || "Límite mensual de 3 flyers alcanzado.");
        }
        throw new Error(data.error || "Error al generar flyers con IA");
      }

      if (data.flyers && data.flyers.length > 0) {
        setFlyers(data.flyers);
        setSelectedFlyerIndex(0);
        setCanGenerate(false);
        setNextAvailableAt(data.nextAvailableAt);
        setDaysRemaining(data.daysRemaining || 30);
        showToast("¡3 Flyers generados con IA y guardados en CDN! 🎨", "success");
      } else {
        throw new Error("No se recibieron flyers del servidor");
      }
    } catch (err: any) {
      showToast(err.message || "Error al generar flyers", "error");
    } finally {
      setLoading(false);
    }
  };

  // Re-renderizado gratis sin gastar cupo (FM8)
  const handleRerender = async () => {
    if (!activeFlyer) return;
    setRerendering(true);
    try {
      const res = await fetch("/api/flyers/rerender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: biz.id,
          flyerIndex: selectedFlyerIndex,
          title: editTitle,
          headline: editHeadline,
          badge: editBadge,
          ctaText: editCta,
          style: editStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar flyer");

      if (data.flyer) {
        const next = [...flyers];
        next[selectedFlyerIndex] = data.flyer;
        setFlyers(next);
        setIsEditing(false);
        showToast("¡Flyer re-renderizado con éxito sin consumir cupo! ✨", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Error al re-renderizar flyer", "error");
    } finally {
      setRerendering(false);
    }
  };

  // Destacar en BioLinks (BM3)
  const handleFeatureInBioLinks = async () => {
    if (!activeFlyer) return;
    setFeaturingBio(true);
    try {
      const res = await fetch("/api/biolinks/feature-flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: biz.id,
          title: activeFlyer.title,
          badge: activeFlyer.badge,
          imageUrl: activeFlyer.instagramPost,
          daysValid: 7,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al destacar en BioLinks");

      showToast("¡Promo destacada en BioLinks por 7 días! 🔥", "success");
    } catch (err: any) {
      showToast(err.message || "Error al destacar en BioLinks", "error");
    } finally {
      setFeaturingBio(false);
    }
  };

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

  const handleDownloadAllFormats = () => {
    if (!activeFlyer) return;
    const baseName = `${biz.subdomain || "negocio"}-flyer-${selectedFlyerIndex + 1}`;
    handleDownload(activeFlyer.instagramPost, `${baseName}-feed-1080x1080.jpg`);
    setTimeout(() => {
      handleDownload(activeFlyer.instagramStory, `${baseName}-historia-1080x1920.jpg`);
    }, 400);
    setTimeout(() => {
      handleDownload(activeFlyer.facebookPost, `${baseName}-facebook-1200x630.jpg`);
    }, 800);
    showToast("Descargando los 3 formatos (Feed, Historia y Facebook)... ✓", "info");
  };

  const handleCopyCaption = () => {
    if (!activeFlyer) return;
    const captionText =
      activeFlyer.caption ||
      `✨ ${activeFlyer.title} ✨\n\n${activeFlyer.headline}\n\n👉 ${activeFlyer.ctaText} ingresando en nuestro sitio oficial:\n🔗 https://${publicUrl}\n\n`;
    const hashtagsText =
      activeFlyer.hashtags || `#${biz.subdomain || "negocio"} #${biz.type || "servicios"} #turnosonline #promocion`;

    const fullCopy = `${captionText}\n\n${hashtagsText}`;
    navigator.clipboard.writeText(fullCopy);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
    showToast("Texto publicitario y hashtags copiados ✓", "success");
  };

  const handleShareMobile = async () => {
    if (!activeFlyer) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeFlyer.title,
          text: `${activeFlyer.title} - ${activeFlyer.headline}\nhttps://${publicUrl}`,
          url: `https://${publicUrl}`,
        });
        showToast("Compartido exitosamente ✓", "success");
      } catch {}
    } else {
      handleCopyCaption();
    }
  };

  const formattedDate = nextAvailableAt
    ? new Date(nextAvailableAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-1 border border-border-default shadow-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-fg">Flyers para Redes Sociales con IA & Sharp</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-accent/10 text-accent border border-accent/20">
              3 por tienda / mes
            </span>
          </div>
          <p className="text-xs text-fg-muted max-w-2xl">
            Genera 3 piezas publicitarias comerciales basadas en tu rubro, servicios reales y colores de marca. Las imágenes se procesan con Sharp, se guardan en CDN (sin sobrecargar tu base de datos) y se adaptan para Instagram Feed, Historia y Facebook.
          </p>
        </div>

        <HelpTooltip
          title="Límite Mensual y Edición Gratuita"
          description="Cada tienda cuenta con un cupo de 3 flyers con IA por mes. Puedes editar los textos de tus flyers guardados cuantas veces quieras sin consumir cupo gracias a la herramienta de re-renderizado."
          tip="Al cumplirse el mes desde tu última generación, se renueva automáticamente tu cupo."
        />
      </div>

      {/* ── BANNER DE ESTADO DE CUPO MENSUAL (FM9) ── */}
      {nextAvailableAt && !canGenerate ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300">Cupo mensual utilizado (3 de 3 flyers creados)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Renueva en {daysRemaining} días
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Tus 3 flyers están guardados abajo. Próxima recarga el <strong>{formattedDate}</strong>. Puedes descargarlos o <strong>editar sus textos gratis</strong> sin gastar cupo.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-300">Cupo mensual disponible</span>
              <p className="text-xs text-emerald-200/80">
                Tienes disponible tu cupo de este mes para generar <strong>3 flyers publicitarios</strong> con IA y Sharp.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/30">
            3 Disponibles
          </span>
        </div>
      )}

      {/* ── CONFIGURACIÓN DE CAMPAÑA ── */}
      <div className="p-5 rounded-2xl bg-surface-1 border border-border-default space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-fg uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>Configurar Temática Publicitaria</span>
          </span>
          <span className="text-[11px] text-fg-subtle">
            Colores de marca:{" "}
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
            disabled={!canGenerate}
            placeholder={
              canGenerate
                ? "Instrucción personalizada opcional (ej: 'Enfocarse en cortes modernos', 'Descuento 20% los martes')..."
                : `Cupo de este mes utilizado. Próxima recarga el ${formattedDate || "el próximo mes"}.`
            }
            className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border-default text-xs text-fg focus:border-accent focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          />

          <Button
            variant="primary"
            size="md"
            onClick={() => handleGenerate(false)}
            disabled={loading || !canGenerate}
            className="w-full sm:w-auto gap-2 font-bold whitespace-nowrap shadow-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generando 3 flyers con IA...</span>
              </>
            ) : !canGenerate ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Cupo Utilizado ({formattedDate})</span>
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
      {flyers.length > 0 && activeFlyer ? (
        <div className="space-y-5 animate-fadeIn">
          {/* Tabs para seleccionar entre los 3 flyers */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              {flyers.map((f, idx) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedFlyerIndex(idx);
                    setIsEditing(false);
                  }}
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
                    ? "bg-surface-3 text-fg shadow-sm border border-border-default font-bold"
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
                    ? "bg-surface-3 text-fg shadow-sm border border-border-default font-bold"
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
                    ? "bg-surface-3 text-fg shadow-sm border border-border-default font-bold"
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
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#030712] rounded-2xl border border-white/10 shadow-2xl relative">
              <div
                className={`transition-all duration-300 relative rounded-2xl overflow-hidden shadow-2xl border border-white/15 flex items-center justify-center bg-black ${
                  selectedFormat === "story"
                    ? "w-[280px] sm:w-[320px] aspect-[9/16]"
                    : selectedFormat === "facebook"
                    ? "w-full max-w-[580px] aspect-[1200/630]"
                    : "w-full max-w-[440px] aspect-square"
                }`}
              >
                <img
                  src={getCurrentImage(activeFlyer)}
                  alt={activeFlyer.title}
                  className="w-full h-full object-cover select-none"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-fg-subtle">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Resolución nativa:{" "}
                  <strong className="text-fg">
                    {selectedFormat === "post"
                      ? "1080 x 1080 px (1:1)"
                      : selectedFormat === "story"
                      ? "1080 x 1920 px (9:16)"
                      : "1200 x 630 px (1.91:1)"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Diseño: <strong className="capitalize">{activeFlyer.style || "Promo"}</strong>
                </span>
              </div>
            </div>

            {/* Panel de Detalles, Edición y Acciones */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-surface-1 border border-border-default space-y-4">
                {!isEditing ? (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-accent/15 text-accent border border-accent/30">
                            {activeFlyer.badge}
                          </span>
                          <span className="text-[11px] text-fg-subtle">Flyer #{selectedFlyerIndex + 1} de 3</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="text-xs text-accent hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar Texto Gratis</span>
                        </button>
                      </div>
                      <h3 className="text-base font-bold text-fg">{activeFlyer.title}</h3>
                      <p className="text-xs text-fg-muted leading-relaxed">{activeFlyer.headline}</p>
                    </div>

                    <div className="pt-3 border-t border-border-subtle space-y-2.5">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => {
                          const suffix =
                            selectedFormat === "post"
                              ? "feed-1080x1080"
                              : selectedFormat === "story"
                              ? "historia-1080x1920"
                              : "facebook-1200x630";
                          handleDownload(
                            getCurrentImage(activeFlyer),
                            `${biz.subdomain || "negocio"}-flyer-${selectedFlyerIndex + 1}-${suffix}.jpg`
                          );
                        }}
                        className="w-full justify-center gap-2 font-bold shadow-md cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>
                          Descargar (
                          {selectedFormat === "post"
                            ? "INSTAGRAM FEED"
                            : selectedFormat === "story"
                            ? "HISTORIA"
                            : "FACEBOOK"}
                          )
                        </span>
                      </Button>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="md"
                          onClick={handleCopyCaption}
                          className="w-full justify-center gap-2 text-xs font-semibold cursor-pointer"
                        >
                          {copiedCaption ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Copy & Tags</span>
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="md"
                          onClick={handleShareMobile}
                          className="w-full justify-center gap-2 text-xs font-semibold cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Compartir</span>
                        </Button>
                      </div>

                      {/* Botón BM3: Destacar en BioLinks */}
                      <button
                        type="button"
                        onClick={handleFeatureInBioLinks}
                        disabled={featuringBio}
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {featuringBio ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>Destacar Promo en BioLinks (7 días)</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-border-subtle">
                      <button
                        type="button"
                        onClick={handleDownloadAllFormats}
                        className="w-full py-2 px-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border-default text-xs font-semibold text-fg transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5 text-accent" />
                        <span>Descargar este flyer en los 3 formatos</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Formulario de Edición Gratuita (FM8) */
                  <div className="space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-accent" />
                        <span>Editar Textos (Sin Gastar Cupo)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="text-xs text-fg-subtle hover:text-fg cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-semibold text-fg-muted block mb-1">Título Principal</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          maxLength={32}
                          className="w-full px-3 py-1.5 rounded-lg bg-surface-2 border border-border-default text-xs text-fg focus:border-accent focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-fg-muted block mb-1">Frase Persuasiva</label>
                        <textarea
                          value={editHeadline}
                          onChange={(e) => setEditHeadline(e.target.value)}
                          maxLength={95}
                          rows={2}
                          className="w-full px-3 py-1.5 rounded-lg bg-surface-2 border border-border-default text-xs text-fg focus:border-accent focus:outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-fg-muted block mb-1">Etiqueta Badge</label>
                          <input
                            type="text"
                            value={editBadge}
                            onChange={(e) => setEditBadge(e.target.value)}
                            maxLength={20}
                            className="w-full px-3 py-1.5 rounded-lg bg-surface-2 border border-border-default text-xs text-fg focus:border-accent focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-fg-muted block mb-1">Texto Botón CTA</label>
                          <input
                            type="text"
                            value={editCta}
                            onChange={(e) => setEditCta(e.target.value)}
                            maxLength={25}
                            className="w-full px-3 py-1.5 rounded-lg bg-surface-2 border border-border-default text-xs text-fg focus:border-accent focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-fg-muted block mb-1">Estilo de Diseño</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["promo", "editorial", "action"] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setEditStyle(st)}
                              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold capitalize border cursor-pointer ${
                                editStyle === st
                                  ? "bg-accent/15 border-accent text-accent"
                                  : "bg-surface-2 border-border-default text-fg-muted"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleRerender}
                        disabled={rerendering}
                        className="w-full justify-center gap-2 font-bold cursor-pointer"
                      >
                        {rerendering ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Re-renderizando...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aplicar Cambios (Gratis)</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Estado inicial vacío */
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-surface-1 border border-dashed border-border-default space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-fg">Aún no has generado tus flyers de este mes</h3>
          <p className="text-xs text-fg-muted max-w-md mx-auto">
            Configura el objetivo de tu campaña y presiona &quot;Generar 3 Flyers con IA&quot; para crear automáticamente las piezas publicitarias optimizadas con Sharp para Instagram y Facebook.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => handleGenerate(false)}
              disabled={loading || !canGenerate}
              className="gap-2 font-bold cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generar 3 Flyers del Mes</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
