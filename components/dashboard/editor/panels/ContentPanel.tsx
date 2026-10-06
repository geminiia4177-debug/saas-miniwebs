import React from "react";
import { Biz, Section } from "@/lib/constants";
import ConfiguradorTienda from "@/components/dashboard/cartuchos/ConfiguradorTienda";
import ConfiguradorMenu from "@/components/dashboard/cartuchos/ConfiguradorMenu";
import ConfiguradorTaller from "@/components/dashboard/cartuchos/ConfiguradorTaller";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AIAssistButton } from "@/components/ui/AIAssistButton";
import { ArrowLeft, Trash2, Plus, Video, Play, ExternalLink } from "lucide-react";
import { extractYouTubeId } from "@/components/ui/VideoSection";

export interface ContentPanelProps {
  biz: Biz;
  setBiz: (fnOrObj: any) => void;
  sections: Section[];
  setSections: (fnOrVal: any) => void;
  activeSection: Section | null;
  onBackToSections: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warn") => void;
}

export const ContentPanel: React.FC<ContentPanelProps> = ({
  biz,
  setBiz,
  sections,
  setSections,
  activeSection,
  onBackToSections,
  showToast,
}) => {
  const bizType = (biz.type || "general").toLowerCase();

  // 1. Specialty Cartridge for Tienda Virtual
  if (bizType === "tienda") {
    return (
      <div className="space-y-4 pb-20">
        <ConfiguradorTienda biz={biz} setBiz={setBiz} showToast={showToast} activeTab="tiendaProductos" />
      </div>
    );
  }

  // 2. Specialty Cartridge for Gastronomía / Menú
  if (bizType === "menu" || bizType === "restaurante") {
    return (
      <div className="space-y-4 pb-20">
        <ConfiguradorMenu biz={biz} setBiz={setBiz} showToast={showToast} activeTab="menuCategorias" />
      </div>
    );
  }

  // 3. Specialty Cartridge for Taller Mecánico / Lavadero
  if (bizType === "taller" || bizType === "lavadero") {
    return (
      <div className="space-y-4 pb-20">
        <ConfiguradorTaller biz={biz} setBiz={setBiz} showToast={showToast} activeTab="tallerServices" />
      </div>
    );
  }

  // 4. Section-specific editor if a section was selected
  if (activeSection) {
    const sec = sections.find((s) => s.id === activeSection.id) || activeSection;
    const isHero = sec.id === "hero";
    const isServices = sec.id === "services";
    const isVideo = sec.id === "video";

    const updateConfig = (field: string, val: any) => {
      const updated = sections.map((s) => {
        if (s.id !== sec.id) return s;
        const newConfig = { ...(s.config || {}), [field]: val };
        const newLabel =
          field === "label"
            ? val
            : field === "title" && (!s.label || s.label === "Video Institucional" || s.label === "Video")
            ? val
            : s.label;
        return {
          ...s,
          label: newLabel,
          config: newConfig,
        };
      });

      setSections(updated);

      setBiz((prev: any) => {
        const extra: any = {};
        if (isHero && field === "title") extra.heroTitle = val;
        if (isHero && field === "subtitle") extra.heroSubtitle = val;
        if (isVideo && (field === "youtubeUrl" || field === "videoUrl")) {
          extra.videoUrl = val;
          extra.youtubeUrl = val;
        }
        if (isVideo && field === "title") {
          extra.videoTitle = val;
        }
        return {
          ...prev,
          layoutConfig: {
            ...(prev?.layoutConfig || {}),
            ...extra,
            sections: updated,
          },
        };
      });
    };

    return (
      <div className="space-y-5 pb-20">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToSections}
            className="gap-1.5 -ml-2 text-fg-muted hover:text-fg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Secciones</span>
          </Button>
          <span className="text-xs font-semibold text-fg">{sec.label || sec.id}</span>
        </div>

        {isHero && (
          <div className="space-y-4">
            <Field
              label="Título de Portada"
              action={
                <AIAssistButton
                  businessId={biz.id}
                  fieldType="heroTitle"
                  currentText={sec.config?.title || biz.layoutConfig?.heroTitle || biz.name}
                  context={`Rubro: ${biz.type}`}
                  onSelect={(txt) => {
                    updateConfig("title", txt);
                    showToast?.("Título con IA aplicado ✓", "success");
                  }}
                  compact
                />
              }
            >
              <Input
                value={sec.config?.title || biz.layoutConfig?.heroTitle || biz.name}
                onChange={(e) => updateConfig("title", e.target.value)}
                placeholder="Título impactante"
              />
            </Field>

            <Field
              label="Subtítulo o Propuesta de Valor"
              action={
                <AIAssistButton
                  businessId={biz.id}
                  fieldType="heroSubtitle"
                  currentText={sec.config?.subtitle || biz.layoutConfig?.heroSubtitle || ""}
                  context={`Rubro: ${biz.type}. Título: ${sec.config?.title || biz.name}`}
                  onSelect={(txt) => {
                    updateConfig("subtitle", txt);
                    showToast?.("Subtítulo con IA aplicado ✓", "success");
                  }}
                  compact
                />
              }
            >
              <Input
                value={sec.config?.subtitle || biz.layoutConfig?.heroSubtitle || ""}
                onChange={(e) => updateConfig("subtitle", e.target.value)}
                placeholder="Una frase que describa tu diferencial"
              />
            </Field>

            <Field label="Texto del Botón Principal (CTA)">
              <Input
                value={sec.config?.ctaText || "Reservar Turno"}
                onChange={(e) => updateConfig("ctaText", e.target.value)}
                placeholder="Ej: Agendar Ahora"
              />
            </Field>
          </div>
        )}

        {isServices && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-fg-subtle">
                Servicios ({sec.config?.items?.length || 0})
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const items = sec.config?.items || [];
                  updateConfig("items", [
                    ...items,
                    {
                      name: "Nuevo Servicio",
                      price: "$ 5.000",
                      duration: 30,
                      description: "Descripción del servicio",
                    },
                  ]);
                }}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </Button>
            </div>

            <div className="space-y-2.5">
              {(sec.config?.items || []).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surface-2 border border-border-default space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.name || ""}
                      onChange={(e) => {
                        const items = [...sec.config.items];
                        items[idx] = { ...items[idx], name: e.target.value };
                        updateConfig("items", items);
                      }}
                      className="font-semibold text-xs text-fg bg-transparent border-b border-transparent focus:border-accent focus:outline-none w-full"
                      placeholder="Nombre del servicio"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const items = sec.config.items.filter((_: any, i: number) => i !== idx);
                        updateConfig("items", items);
                      }}
                      className="text-fg-subtle hover:text-danger p-1 transition-colors"
                      title="Eliminar servicio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.price || ""}
                      onChange={(e) => {
                        const items = [...sec.config.items];
                        items[idx] = { ...items[idx], price: e.target.value };
                        updateConfig("items", items);
                      }}
                      placeholder="Precio (ej: $ 5.000)"
                    />
                    <Input
                      value={item.duration ? `${item.duration} min` : ""}
                      onChange={(e) => {
                        const items = [...sec.config.items];
                        items[idx] = {
                          ...items[idx],
                          duration: parseInt(e.target.value) || 30,
                        };
                        updateConfig("items", items);
                      }}
                      placeholder="Duración (min)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isVideo && (
          <div className="space-y-4">
            <Field label="Nombre de la Sección (Menú y Navegación)">
              <Input
                value={sec.label || "Video Institucional"}
                onChange={(e) => updateConfig("label", e.target.value)}
                placeholder="Ej: Video Institucional, Nuestro Local, etc."
              />
            </Field>

            <Field label="Título del Video">
              <Input
                value={sec.config?.title || sec.label || "Video Institucional"}
                onChange={(e) => updateConfig("title", e.target.value)}
                placeholder="Ej: Conocé nuestro espacio"
              />
            </Field>

            <Field
              label="Descripción o Subtítulo"
              action={
                <AIAssistButton
                  businessId={biz.id}
                  fieldType="description"
                  currentText={sec.config?.description || ""}
                  context={`Sección de video para ${biz.name} (${biz.type})`}
                  onSelect={(txt) => {
                    updateConfig("description", txt);
                    showToast?.("Descripción con IA aplicada ✓", "success");
                  }}
                  compact
                />
              }
            >
              <textarea
                value={sec.config?.description || ""}
                onChange={(e) => updateConfig("description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-border-default text-xs text-fg focus:border-accent focus:outline-none resize-none"
                placeholder="Breve texto que acompañe al video..."
              />
            </Field>

            <Field label="Enlace del Video (YouTube o Vimeo)">
              <div className="space-y-2">
                <Input
                  value={sec.config?.youtubeUrl || sec.config?.videoUrl || biz.layoutConfig?.videoUrl || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig("youtubeUrl", val);
                    updateConfig("videoUrl", val);
                  }}
                  placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                />
                <p className="text-[10px] text-fg-subtle">
                  Admite enlaces de YouTube (videos normales o shorts) y enlaces directos.
                </p>
              </div>
            </Field>

            {/* Video Preview */}
            {(() => {
              const currentUrl = sec.config?.youtubeUrl || sec.config?.videoUrl || biz.layoutConfig?.videoUrl || "";
              const ytId = extractYouTubeId(currentUrl);
              if (!currentUrl) return null;

              if (ytId) {
                return (
                  <div className="p-3 rounded-xl bg-surface-2 border border-border-default space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-success flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" />
                        <span>Video detectado ✓</span>
                      </span>
                      <a
                        href={`https://www.youtube.com/watch?v=${ytId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-fg-subtle hover:text-accent flex items-center gap-1 text-[11px]"
                      >
                        <span>Abrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-border-subtle group">
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                        alt="Preview video"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="p-2.5 rounded-xl bg-surface-2 border border-border-subtle text-[11px] text-fg-muted">
                  Ingresa un link válido de YouTube para visualizar la vista previa.
                </div>
              );
            })()}

            <div className="pt-2 border-t border-border-subtle">
              <label className="flex items-center gap-2 text-xs text-fg cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!sec.config?.autoplay}
                  onChange={(e) => updateConfig("autoplay", e.target.checked)}
                  className="rounded border-border-default text-accent focus:ring-accent"
                />
                <span>Reproducción automática (silenciada)</span>
              </label>
            </div>
          </div>
        )}

        {!isHero && !isServices && !isVideo && (
          <div className="space-y-4">
            <Field label="Nombre de la Sección (Menú y Navegación)">
              <Input
                value={sec.label || ""}
                onChange={(e) => updateConfig("label", e.target.value)}
                placeholder="Nombre para el menú/navegación"
              />
            </Field>

            <Field label="Título de la Sección">
              <Input
                value={sec.config?.title || ""}
                onChange={(e) => updateConfig("title", e.target.value)}
                placeholder="Título del bloque"
              />
            </Field>

            <Field
              label="Descripción o Texto informativo"
              action={
                <AIAssistButton
                  businessId={biz.id}
                  fieldType="description"
                  currentText={sec.config?.description || ""}
                  context={`Sección: ${sec.label || sec.id}. Rubro: ${biz.type}`}
                  onSelect={(txt) => {
                    updateConfig("description", txt);
                    showToast?.("Descripción con IA aplicada ✓", "success");
                  }}
                  compact
                />
              }
            >
              <textarea
                value={sec.config?.description || ""}
                onChange={(e) => updateConfig("description", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-border-default text-xs text-fg focus:border-accent focus:outline-none resize-none"
                placeholder="Escribí el texto de este bloque..."
              />
            </Field>
          </div>
        )}
      </div>
    );
  }

  // 5. Default view if no section is active
  return (
    <div className="p-6 text-center space-y-3 bg-surface-2 rounded-xl border border-border-default">
      <p className="text-xs text-fg-muted">
        Seleccioná una sección en la pestaña <strong>Secciones</strong> para editar su contenido específico, o hacé clic directamente en el preview a la derecha.
      </p>
      <Button variant="outline" size="sm" onClick={onBackToSections}>
        Ir a Secciones
      </Button>
    </div>
  );
};
