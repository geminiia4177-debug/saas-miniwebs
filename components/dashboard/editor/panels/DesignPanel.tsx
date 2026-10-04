import React, { useState, useRef, useEffect } from "react";
import { Biz } from "@/lib/constants";
import { HexColorPicker } from "react-colorful";
import { TEMPLATE_LEVEL_METADATA } from "@/lib/templates/themes";
import { switchTemplateLevel } from "@/lib/templates/contract";
import { Badge } from "@/components/ui/Badge";
import { DropZone } from "../DropZone";
import { uploadToImgBB } from "@/lib/utils/upload";
import HelpTooltip from "@/components/ui/HelpTooltip";
import { extractPalettesFromImage, ColorPalette } from "@/lib/utils/colorExtractor";
import { Palette, Type, Image as ImageIcon, Sparkles } from "lucide-react";

function ColorPickerPopup({
  color,
  onChange,
  label,
}: {
  color: string;
  onChange: (c: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const popover = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popover.current && !popover.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      {label && <span className="text-[11px] font-medium text-fg-subtle">{label}</span>}
      <div className="relative w-full">
        <button
          type="button"
          className="w-full h-8 rounded-lg cursor-pointer border border-border-default hover:border-border-strong transition-all flex items-center justify-between px-2 text-xs font-mono"
          style={{ backgroundColor: color || "#000000" }}
          onClick={() => setOpen(!open)}
        >
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm"
          >
            {color || "#000"}
          </span>
        </button>

        {open && (
          <div className="absolute z-50 mt-2 left-0" ref={popover}>
            <div className="fixed inset-0" onClick={() => setOpen(false)} />
            <div className="relative z-50 p-2 rounded-xl bg-surface-2 border border-border-strong shadow-popover">
              <HexColorPicker color={color || "#000000"} onChange={onChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export interface DesignPanelProps {
  biz: Biz;
  setBiz: (fnOrObj: any) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const DesignPanel: React.FC<DesignPanelProps> = ({
  biz,
  setBiz,
  showToast,
}) => {
  const [uploadingBg, setUploadingBg] = useState(false);
  const [extractedPalettes, setExtractedPalettes] = useState<ColorPalette[]>([]);
  const [extracting, setExtracting] = useState(false);
  const layout = biz.layoutConfig || {};

  useEffect(() => {
    if (!biz.logoUrl) {
      setExtractedPalettes([]);
      return;
    }
    setExtracting(true);
    extractPalettesFromImage(biz.logoUrl)
      .then((palettes) => setExtractedPalettes(palettes))
      .catch(() => {})
      .finally(() => setExtracting(false));
  }, [biz.logoUrl]);

  const handleBgUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setUploadingBg(true);
    try {
      const url = await uploadToImgBB(files[0], biz.id);
      setBiz((prev: any) =>
        prev
          ? {
              ...prev,
              layoutConfig: {
                ...(prev.layoutConfig || {}),
                backgroundImageUrl: url,
                backgroundType: "image",
              },
            }
          : prev
      );
      showToast("Imagen de fondo actualizada ✓", "success");
    } catch {
      showToast("Error al subir la imagen", "error");
    }
    setUploadingBg(false);
  };

  const FONT_OPTIONS = [
    { label: "Inter (Moderna y Neutra)", value: "'Inter', sans-serif" },
    { label: "Plus Jakarta Sans (SaaS & Tech)", value: "'Plus Jakarta Sans', sans-serif" },
    { label: "Outfit (Geométrica y Limpia)", value: "'Outfit', sans-serif" },
    { label: "Montserrat (Elegante & Premium)", value: "'Montserrat', sans-serif" },
    { label: "Playfair Display (Editorial Serif)", value: "'Playfair Display', serif" },
    { label: "Cinzel (Clásica y Distinguida)", value: "'Cinzel', serif" },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* ── 1. GALERÍA DE PLANTILLAS MULTINIVEL ── */}
      <section className="p-4 rounded-xl bg-surface-2 border border-border-default space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
              Plantilla y Nivel Visual
            </h3>
          </div>
          <HelpTooltip
            title="Niveles de Plantilla"
            description="Classic es ultra rápida y minimalista; Motion incorpora micro-animaciones al scroll; Premium brinda diseño editorial y tipografía distinguida; Immersive agrega efectos 3D."
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {(["classic", "motion", "premium", "immersive", "bento", "app_native", "lookbook"] as const).map((lvl) => {
            const meta = TEMPLATE_LEVEL_METADATA[lvl];
            const isSelected = (biz.layoutConfig?.templateLevel || "classic") === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  const updated = switchTemplateLevel(biz, lvl);
                  setBiz(updated);
                  showToast(`Plantilla cambiada a ${meta.name} ✓`, "info");
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-accent/10 border-accent shadow-card"
                    : "bg-surface-1 hover:bg-surface-2 border-border-default text-fg-muted hover:text-fg"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isSelected ? "text-accent" : "text-fg"}`}>
                    {meta.name}
                  </span>
                  <Badge variant={isSelected ? "accent" : "secondary"} size="sm">
                    {meta.badge}
                  </Badge>
                </div>
                <p className="text-[11px] text-fg-muted leading-tight">
                  {meta.description}
                </p>
                <div className="flex gap-1 mt-2">
                  {meta.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-surface-3 text-fg-subtle"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 2. PALETA DE COLORES DE MARCA ── */}
      <section className="p-4 rounded-xl bg-surface-2 border border-border-default space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
              Colores de Marca
            </h3>
          </div>
          <HelpTooltip
            title="Colores de Marca"
            description="Principal (botones y encabezados), Secundario (fondos suaves y tarjetas), Acento (precios y llamadas a la acción)."
          />
        </div>

        {biz.logoUrl && extractedPalettes.length > 0 && (
          <div className="p-3 rounded-xl bg-surface-1 border border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-bold text-fg">
                  Paleta automática de tu logo
                </span>
              </div>
              <Badge variant="accent" size="sm">
                Auto-Logo
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {extractedPalettes.map((pal, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBiz((prev: any) => ({
                      ...prev,
                      primaryColor: pal.primary,
                      secondaryColor: pal.secondary,
                    }));
                    showToast(`Paleta "${pal.name}" aplicada ✓`, "success");
                  }}
                  className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-subtle hover:border-accent/40 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1 mb-1">
                    <div
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: pal.primary }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ backgroundColor: pal.secondary }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-fg block truncate group-hover:text-accent">
                    {pal.name}
                  </span>
                  <span className="text-[9px] text-fg-subtle block">
                    {pal.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <ColorPickerPopup
            label="Principal"
            color={biz.primaryColor || "#3B82F6"}
            onChange={(c) => setBiz((prev: any) => ({ ...prev, primaryColor: c }))}
          />
          <ColorPickerPopup
            label="Secundario"
            color={biz.secondaryColor || "#1E293B"}
            onChange={(c) => setBiz((prev: any) => ({ ...prev, secondaryColor: c }))}
          />
          <ColorPickerPopup
            label="Acento"
            color={biz.accentColor || "#10B981"}
            onChange={(c) => setBiz((prev: any) => ({ ...prev, accentColor: c }))}
          />
        </div>
      </section>

      {/* ── 3. TIPOGRAFÍA Y TEXTOS ── */}
      <section className="p-4 rounded-xl bg-surface-2 border border-border-default space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
              Tipografía
            </h3>
          </div>
          <HelpTooltip
            title="Tipografía de Marca"
            description="Fuentes optimizadas de Google Fonts cargadas para máxima nitidez y rendimiento."
          />
        </div>

        <select
          value={biz.fontFamily || "'Inter', sans-serif"}
          onChange={(e) =>
            setBiz((prev: any) => (prev ? { ...prev, fontFamily: e.target.value } : prev))
          }
          className="w-full px-3 py-2 rounded-lg text-xs text-fg bg-surface-1 border border-border-default focus:border-accent focus:outline-none"
        >
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>

      {/* ── 4. ESTILO DE BOTONES Y FONDO ── */}
      <section className="p-4 rounded-xl bg-surface-2 border border-border-default space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
              Imagen de Fondo (Hero)
            </h3>
          </div>
        </div>

        <DropZone onFiles={handleBgUpload} multiple={false} />
        {layout.backgroundImageUrl && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-surface-1 border border-border-subtle text-xs">
            <span className="text-fg-muted truncate max-w-[200px]">
              Fondo activo configurado
            </span>
            <button
              type="button"
              onClick={() =>
                setBiz((prev: any) => ({
                  ...prev,
                  layoutConfig: {
                    ...(prev.layoutConfig || {}),
                    backgroundImageUrl: "",
                    backgroundType: "color",
                  },
                }))
              }
              className="text-danger hover:underline text-xs"
            >
              Quitar
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
