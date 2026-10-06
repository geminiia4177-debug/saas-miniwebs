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
  align = "auto",
}: {
  color: string;
  onChange: (c: string) => void;
  label?: string;
  align?: "left" | "right" | "auto";
}) {
  const [open, setOpen] = useState(false);
  const popover = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [inputVal, setInputVal] = useState(color || "#000000");

  useEffect(() => {
    setInputVal(color || "#000000");
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popover.current &&
        !popover.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const QUICK_SWATCHES = [
    "#4f46e5", "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
    "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#0f172a",
    "#1e293b", "#ffffff", "#000000"
  ];

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      {label && <span className="text-[11px] font-medium text-fg-subtle truncate max-w-full">{label}</span>}
      <div className="relative w-full">
        <button
          ref={triggerRef}
          type="button"
          className="w-full h-8 rounded-lg cursor-pointer border border-border-default hover:border-border-strong transition-all flex items-center justify-between px-2 text-xs font-mono shadow-sm group"
          style={{ backgroundColor: color || "#000000" }}
          onClick={() => setOpen(!open)}
          title={`Seleccionar color ${label || ""}`}
        >
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm group-hover:bg-black/80 transition-colors"
          >
            {color || "#000"}
          </span>
        </button>

        {open && (
          <div
            ref={popover}
            className={`absolute z-[9999] mt-2 ${align === "right" ? "right-0" : align === "left" ? "left-0" : "left-1/2 -translate-x-1/2"} p-3 rounded-2xl bg-[#0f1523] border border-white/20 shadow-2xl animate-scale-in w-[240px]`}
            style={{ backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white">{label || "Color"}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center mb-3">
              <HexColorPicker
                color={color || "#000000"}
                onChange={(c) => {
                  onChange(c);
                  setInputVal(c);
                }}
              />
            </div>

            {/* Input HEX directo */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-md border border-white/20 shrink-0"
                style={{ backgroundColor: color || "#000" }}
              />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  const val = e.target.value;
                  setInputVal(val);
                  if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
                    onChange(val);
                  }
                }}
                className="flex-1 bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 uppercase"
                placeholder="#HEX"
                maxLength={7}
              />
            </div>

            {/* Paletas de acceso rápido */}
            <div className="grid grid-cols-7 gap-1 pt-2 border-t border-white/10">
              {QUICK_SWATCHES.slice(0, 14).map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => {
                    onChange(swatch);
                    setInputVal(swatch);
                  }}
                  className="w-6 h-6 rounded-md border border-white/15 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: swatch }}
                  title={swatch}
                />
              ))}
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
    { label: "Syne (Artística y Vanguardista)", value: "'Syne', sans-serif" },
    { label: "Space Grotesk (Tech y Futurista)", value: "'Space Grotesk', sans-serif" },
    { label: "Cormorant Garamond (Lujo y Alta Gama)", value: "'Cormorant Garamond', serif" },
    { label: "Poppins (Amigable y Redondeada)", value: "'Poppins', sans-serif" },
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

        {/* Subsección: Identidad de Marca */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider block">
            Identidad Principal
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            <ColorPickerPopup
              label="Principal"
              align="left"
              color={biz.primaryColor || "#3B82F6"}
              onChange={(c) => setBiz((prev: any) => ({ ...prev, primaryColor: c }))}
            />
            <ColorPickerPopup
              label="Secundario"
              align="auto"
              color={biz.secondaryColor || "#1E293B"}
              onChange={(c) => setBiz((prev: any) => ({ ...prev, secondaryColor: c }))}
            />
            <ColorPickerPopup
              label="Acento"
              align="right"
              color={biz.accentColor || "#10B981"}
              onChange={(c) => setBiz((prev: any) => ({ ...prev, accentColor: c }))}
            />
          </div>
        </div>

        {/* Subsección: Superficies & Fondos */}
        <div className="space-y-1.5 pt-2 border-t border-border-subtle">
          <span className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider block">
            Superficies & Fondos
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            <ColorPickerPopup
              label="Fondo Web"
              align="left"
              color={layout.backgroundColor || "#0a0a0c"}
              onChange={(c) =>
                setBiz((prev: any) => ({
                  ...prev,
                  layoutConfig: { ...(prev.layoutConfig || {}), backgroundColor: c },
                }))
              }
            />
            <ColorPickerPopup
              label="Tarjetas"
              align="auto"
              color={layout.cardColor || "#14161f"}
              onChange={(c) =>
                setBiz((prev: any) => ({
                  ...prev,
                  layoutConfig: { ...(prev.layoutConfig || {}), cardColor: c, surfaceColor: c },
                }))
              }
            />
            <ColorPickerPopup
              label="Bordes"
              align="right"
              color={layout.borderColor || "#262b3d"}
              onChange={(c) =>
                setBiz((prev: any) => ({
                  ...prev,
                  layoutConfig: { ...(prev.layoutConfig || {}), borderColor: c },
                }))
              }
            />
          </div>
        </div>

        {/* Subsección: Textos & Contraste */}
        <div className="space-y-1.5 pt-2 border-t border-border-subtle">
          <span className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider block">
            Textos & Lectura
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <ColorPickerPopup
              label="Texto Principal"
              align="left"
              color={layout.textColor || "#f8fafc"}
              onChange={(c) =>
                setBiz((prev: any) => ({
                  ...prev,
                  layoutConfig: { ...(prev.layoutConfig || {}), textColor: c },
                }))
              }
            />
            <ColorPickerPopup
              label="Texto Subtítulo"
              align="right"
              color={layout.textMutedColor || "#94a3b8"}
              onChange={(c) =>
                setBiz((prev: any) => ({
                  ...prev,
                  layoutConfig: { ...(prev.layoutConfig || {}), textMutedColor: c },
                }))
              }
            />
          </div>
        </div>

        {/* Subsección: Botones & CTA */}
        <div className="space-y-1.5 pt-2 border-t border-border-subtle">
          <span className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider block">
            Botones & Llamadas a la Acción
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <ColorPickerPopup
              label="Fondo Botón"
              align="left"
              color={layout.buttonBgColor || biz.primaryColor || "#3B82F6"}
              onChange={(c) =>
                setBiz((prev: any) => ({
                  ...prev,
                  layoutConfig: { ...(prev.layoutConfig || {}), buttonBgColor: c },
                }))
              }
            />
            <ColorPickerPopup
              label="Texto Botón"
              align="right"
              color={layout.buttonTextColor || "#ffffff"}
              onChange={(c) =>
                setBiz((prev: any) => ({
                  ...prev,
                  layoutConfig: { ...(prev.layoutConfig || {}), buttonTextColor: c },
                }))
              }
            />
          </div>
        </div>
      </section>

      {/* ── 3. TIPOGRAFÍAS (TÍTULOS, SUBTÍTULOS Y CUERPO) ── */}
      <section className="p-4 rounded-xl bg-surface-2 border border-border-default space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
              Tipografías
            </h3>
          </div>
          <HelpTooltip
            title="Tipografías Personalizadas"
            description="Personaliza independientemente la fuente de títulos, subtítulos y párrafos para lograr una identidad visual única."
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-fg-subtle mb-1 block">
              Fuente de Títulos y Encabezados
            </label>
            <select
              value={layout.titleFontFamily || biz.fontFamily || "'Inter', sans-serif"}
              onChange={(e) =>
                setBiz((prev: any) =>
                  prev
                    ? {
                        ...prev,
                        layoutConfig: {
                          ...(prev.layoutConfig || {}),
                          titleFontFamily: e.target.value,
                        },
                      }
                    : prev
                )
              }
              className="w-full px-3 py-2 rounded-lg text-xs text-fg bg-surface-1 border border-border-default focus:border-accent focus:outline-none"
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-fg-subtle mb-1 block">
              Fuente de Subtítulos y Destacados
            </label>
            <select
              value={layout.subtitleFontFamily || biz.fontFamily || "'Inter', sans-serif"}
              onChange={(e) =>
                setBiz((prev: any) =>
                  prev
                    ? {
                        ...prev,
                        layoutConfig: {
                          ...(prev.layoutConfig || {}),
                          subtitleFontFamily: e.target.value,
                        },
                      }
                    : prev
                )
              }
              className="w-full px-3 py-2 rounded-lg text-xs text-fg bg-surface-1 border border-border-default focus:border-accent focus:outline-none"
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-fg-subtle mb-1 block">
              Fuente de Cuerpo y Párrafos
            </label>
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
          </div>
        </div>
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
