import React, { useState, useEffect, useRef } from "react";
import { Ico } from "@/lib/constants";
import { DropZone } from "./editor/DropZone";
import { HexColorPicker } from "react-colorful";
import { uploadToImgBB } from "@/lib/utils/upload";
import PremiumLinks from "../landings/PremiumLinks";
import { Sparkles, RefreshCw, BarChart2, Flame } from "lucide-react";

function ColorPickerPopup({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const popover = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
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
    "#6366f1", "#4f46e5", "#8b5cf6", "#ec4899", "#ef4444",
    "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#0f172a",
    "#1e293b", "#ffffff", "#000000",
  ];

  return (
    <div className="relative w-full">
      <div
        ref={triggerRef}
        className="w-full h-8 rounded-lg cursor-pointer border border-white/20 shadow-sm flex items-center justify-between px-2 text-xs font-mono group transition-all hover:border-white/40"
        style={{ backgroundColor: color || "#000" }}
        onClick={() => setOpen(!open)}
      >
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
          {color || "#000"}
        </span>
      </div>
      {open && (
        <div
          ref={popover}
          className="absolute z-[9999] mt-2 right-0 p-3 rounded-2xl bg-[#0f1523] border border-white/20 shadow-2xl animate-scale-in w-[240px]"
          style={{ backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="text-xs font-bold text-white">Color</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white text-xs p-1 rounded-md cursor-pointer"
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
  );
}

export default function BiolinksTab({ biz, setBiz, saveAll, saving, showToast, copyUrl, copiedUrl }: any) {
  const [subTab, setSubTab] = useState("diseno");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Initialize biolinks if it doesn't exist
  const biolinks = biz.layoutConfig?.biolinks || {
    active: false,
    title: biz.name || "Nuestros Enlaces",
    subtitle: "",
    coverUrl: "",
    profileUrl: biz.logoUrl || "",
    backgroundType: "color",
    backgroundImageUrl: "",
    buttonStyle: "rounded",
    primaryColor: biz.primaryColor || "#6366f1",
    secondaryColor: biz.secondaryColor || "#4f46e5",
    items: [],
  };

  const updateBiolinks = (updates: any) => {
    setBiz((prev: any) => ({
      ...prev,
      layoutConfig: {
        ...(prev.layoutConfig || {}),
        biolinks: { ...biolinks, ...updates },
      },
    }));
  };

  // BM2: Generar estructura de BioLinks con IA
  const handleGenerateAiBiolinks = async () => {
    setGeneratingAi(true);
    try {
      const res = await fetch("/api/biolinks/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar con IA");

      updateBiolinks({
        title: data.title || biolinks.title,
        subtitle: data.bio || biolinks.subtitle,
        items: data.items || biolinks.items,
        active: true,
      });

      setSubTab("enlaces");
      if (showToast) showToast("¡BioLinks optimizados creados con IA! ✨", "success");
    } catch (err: any) {
      if (showToast) showToast(err.message || "Error al generar BioLinks", "error");
    } finally {
      setGeneratingAi(false);
    }
  };

  // BM7: Presets de temas
  const applyThemePreset = (theme: "landing" | "darkGlass" | "neoBrutal" | "minimalLight" | "gradientMesh") => {
    if (theme === "landing") {
      updateBiolinks({
        primaryColor: biz.primaryColor || "#6366f1",
        secondaryColor: biz.secondaryColor || "#0f172a",
        fontFamily: biz.fontFamily || "Inter",
        backgroundType: "dark",
        buttonStyle: "rounded",
      });
      if (showToast) showToast("Tema sincronizado con tu landing ✓", "success");
    } else if (theme === "darkGlass") {
      updateBiolinks({
        primaryColor: "#6366f1",
        secondaryColor: "#0f172a",
        fontFamily: "Inter",
        backgroundType: "dark",
        buttonStyle: "rounded",
      });
    } else if (theme === "neoBrutal") {
      updateBiolinks({
        primaryColor: "#facc15",
        secondaryColor: "#000000",
        fontFamily: "Space Grotesk",
        backgroundType: "dark",
        buttonStyle: "square",
      });
    } else if (theme === "minimalLight") {
      updateBiolinks({
        primaryColor: "#0f172a",
        secondaryColor: "#f8fafc",
        fontFamily: "Outfit",
        backgroundType: "light",
        buttonStyle: "pill",
      });
    } else if (theme === "gradientMesh") {
      updateBiolinks({
        primaryColor: "#8b5cf6",
        secondaryColor: "#ec4899",
        fontFamily: "Outfit",
        backgroundType: "gradient",
        buttonStyle: "pill",
      });
    }
  };

  // Cómputo total de clics
  const totalClicks = (biolinks.items || []).reduce((acc: number, item: any) => acc + (Number(item.clicks) || 0), 0);

  return (
    <div className="flex h-screen animate-fadeIn bg-[#080a10]">
      {/* ──────────── LEFT PANEL ──────────── */}
      <div
        className="w-[460px] flex-shrink-0 flex flex-col border-r overflow-hidden relative z-10"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
      >
        {/* HEADER */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0a0f1c" }}
        >
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Ico n="link" s={16} c="text-indigo-400" /> Editor BioLinks
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Tus enlaces oficiales para Instagram, TikTok y WhatsApp</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => saveAll()}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? (
                <>
                  <Ico n="loader" s={12} c="animate-spin" /> Guardando
                </>
              ) : (
                <>
                  <Ico n="save" s={12} /> Guardar
                </>
              )}
            </button>
          </div>
        </div>

        {/* TOP TABS & AI BUTTON */}
        <div className="p-3 border-b flex items-center justify-between gap-2 flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex gap-1 p-1 rounded-xl flex-1" style={{ background: "rgba(0,0,0,0.2)" }}>
            <button
              onClick={() => setSubTab("diseno")}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer"
              style={
                subTab === "diseno"
                  ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }
                  : { color: "#475569" }
              }
            >
              Diseño
            </button>
            <button
              onClick={() => setSubTab("enlaces")}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer"
              style={
                subTab === "enlaces"
                  ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }
                  : { color: "#475569" }
              }
            >
              Botones ({biolinks.items?.length || 0})
            </button>
          </div>

          {/* BM2: Botón IA */}
          <button
            type="button"
            onClick={handleGenerateAiBiolinks}
            disabled={generatingAi}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="Armar automáticamente títulos y botones con Gemini"
          >
            {generatingAi ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>Armar con IA</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {/* GENERAL ACTIVATION & CLICKS STAT */}
          <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between bg-black/10">
            <div>
              <p className="text-xs font-bold text-white mb-0.5">Activar BioLinks</p>
              <p className="text-[10px] text-slate-500">Habilita la ruta pública /[subdominio]/links</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                <BarChart2 className="w-3 h-3" />
                <span>{totalClicks} clics</span>
              </div>
              <button
                onClick={() => updateBiolinks({ active: !biolinks.active })}
                className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${
                  biolinks.active ? "bg-indigo-500 shadow-lg shadow-indigo-500/30" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    biolinks.active ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ── DISEÑO ── */}
          {subTab === "diseno" && (
            <div className="animate-fadeIn pb-6">
              {/* BM7: TEMAS DE UN CLIC */}
              <div className="px-4 py-3.5 border-b border-white/5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                  Temas Rápidos de 1-Clic
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyThemePreset("landing")}
                    className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-left transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-sm">🎨</span>
                    <div>
                      <span className="text-[11px] font-bold block">Igual a mi Landing</span>
                      <span className="text-[9px] text-indigo-300/70">Mismos colores y fuentes</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyThemePreset("darkGlass")}
                    className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-white/10 text-slate-200 text-left transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-sm">🌑</span>
                    <div>
                      <span className="text-[11px] font-bold block">Dark Glass</span>
                      <span className="text-[9px] text-slate-400">Elegante y translúcido</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyThemePreset("neoBrutal")}
                    className="p-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-left transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-sm">⚡</span>
                    <div>
                      <span className="text-[11px] font-bold block">Neo Brutal</span>
                      <span className="text-[9px] text-yellow-300/70">Alto contraste y audaz</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyThemePreset("gradientMesh")}
                    className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-left transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-sm">🔮</span>
                    <div>
                      <span className="text-[11px] font-bold block">Gradient Mesh</span>
                      <span className="text-[9px] text-purple-300/70">Vibrante y moderno</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="px-4 py-4 border-b border-white/5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Título Principal
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500">Color:</span>
                      <div className="w-16">
                        <ColorPickerPopup
                          color={biolinks.titleColor}
                          onChange={(c) => updateBiolinks({ titleColor: c })}
                        />
                      </div>
                    </div>
                  </div>
                  <input
                    value={biolinks.title}
                    onChange={(e) => updateBiolinks({ title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs text-white bg-black/20 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                    Subtítulo / Biografía Corta
                  </label>
                  <input
                    value={biolinks.subtitle}
                    onChange={(e) => updateBiolinks({ subtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs text-white bg-black/20 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="px-4 py-4 border-b border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Imágenes</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1">Foto Perfil / Logo</span>
                    <DropZone
                      onFiles={async (f) => {
                        const url = await uploadToImgBB(f[0], biz.id);
                        updateBiolinks({ profileUrl: url });
                      }}
                      multiple={false}
                      compact
                    >
                      <div className="h-16 rounded-xl border border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group">
                        {biolinks.profileUrl ? (
                          <img src={biolinks.profileUrl} className="w-full h-full object-cover" />
                        ) : (
                          <Ico n="upload" s={14} c="text-slate-500" />
                        )}
                      </div>
                    </DropZone>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1">Cover (Portada)</span>
                    <DropZone
                      onFiles={async (f) => {
                        const url = await uploadToImgBB(f[0], biz.id);
                        updateBiolinks({ coverUrl: url });
                      }}
                      multiple={false}
                      compact
                    >
                      <div className="h-16 rounded-xl border border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group">
                        {biolinks.coverUrl ? (
                          <img src={biolinks.coverUrl} className="w-full h-full object-cover" />
                        ) : (
                          <Ico n="upload" s={14} c="text-slate-500" />
                        )}
                      </div>
                    </DropZone>
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 border-b border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Estilos</p>

                <div className="flex gap-4 mb-4">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-400">Color Botón</span>
                    <ColorPickerPopup
                      color={biolinks.primaryColor}
                      onChange={(c) => updateBiolinks({ primaryColor: c })}
                    />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-400">Color Acento</span>
                    <ColorPickerPopup
                      color={biolinks.secondaryColor}
                      onChange={(c) => updateBiolinks({ secondaryColor: c })}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-[9px] text-slate-400 block mb-2">Fondo de BioLinks</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: "color", label: "Colores" },
                      { val: "gradient", label: "Gradiente" },
                      { val: "dark", label: "Oscuro" },
                      { val: "light", label: "Claro" },
                      { val: "image", label: "Imagen" },
                      { val: "video", label: "Video" },
                    ].map((b) => (
                      <button
                        key={b.val}
                        onClick={() => updateBiolinks({ backgroundType: b.val })}
                        className="py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                        style={
                          biolinks.backgroundType === b.val
                            ? {
                                background: "rgba(99,102,241,0.2)",
                                color: "#a5b4fc",
                                border: "1px solid rgba(99,102,241,0.4)",
                              }
                            : {
                                background: "rgba(0,0,0,0.2)",
                                color: "#64748b",
                                border: "1px solid rgba(255,255,255,0.05)",
                              }
                        }
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                  {biolinks.backgroundType === "image" && (
                    <div className="mt-2">
                      <DropZone
                        onFiles={async (f) => {
                          const url = await uploadToImgBB(f[0], biz.id);
                          updateBiolinks({ backgroundImageUrl: url });
                        }}
                        multiple={false}
                        compact
                      >
                        <div className="h-10 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">
                          {biolinks.backgroundImageUrl ? "Cambiar Imagen de Fondo" : "Subir Imagen de Fondo"}
                        </div>
                      </DropZone>
                    </div>
                  )}
                  {biolinks.backgroundType === "video" && (
                    <div className="mt-2">
                      <input
                        value={biolinks.backgroundImageUrl || ""}
                        placeholder="URL de Video (mp4)..."
                        onChange={(e) => updateBiolinks({ backgroundImageUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl text-xs text-white bg-black/20 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-[9px] text-slate-400 block mb-2">Tipografía (Fuente)</span>
                  <select
                    value={biolinks.fontFamily || "Inter"}
                    onChange={(e) => updateBiolinks({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs text-white bg-black/20 border border-white/10 focus:border-indigo-500/50 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="Inter">Inter (Moderna)</option>
                    <option value="Roboto">Roboto (Clásica)</option>
                    <option value="Outfit">Outfit (Geométrica)</option>
                    <option value="Playfair">Playfair (Elegante/Serif)</option>
                    <option value="Space Grotesk">Space Grotesk (Tecnológica)</option>
                  </select>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <button
                    onClick={() => updateBiolinks({ showPoweredBy: !(biolinks.showPoweredBy !== false) })}
                    className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                      biolinks.showPoweredBy !== false ? "bg-indigo-500" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
                        biolinks.showPoweredBy !== false ? "left-[18px]" : "left-1"
                      }`}
                    />
                  </button>
                  <span className="text-[10px] text-slate-300">Mostrar marca de agua &quot;Powered by&quot;</span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 block mb-2">Forma de Botones</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: "rounded", label: "Curvos" },
                      { val: "square", label: "Cuadrados" },
                      { val: "pill", label: "Pastilla" },
                    ].map((b) => (
                      <button
                        key={b.val}
                        onClick={() => updateBiolinks({ buttonStyle: b.val })}
                        className="py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                        style={
                          biolinks.buttonStyle === b.val
                            ? {
                                background: "rgba(99,102,241,0.2)",
                                color: "#a5b4fc",
                                border: "1px solid rgba(99,102,241,0.4)",
                              }
                            : {
                                background: "rgba(0,0,0,0.2)",
                                color: "#64748b",
                                border: "1px solid rgba(255,255,255,0.05)",
                              }
                        }
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ENLACES (BM4 + BM5) ── */}
          {subTab === "enlaces" && (
            <div className="animate-fadeIn p-4 pb-12">
              <div className="space-y-3">
                {(biolinks.items || []).map((item: any, i: number) => (
                  <div
                    key={item.id || i}
                    className="p-3.5 rounded-xl border border-white/10 relative group"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <div className="flex gap-2">
                      {/* THUMBNAIL UPLOAD */}
                      <DropZone
                        onFiles={async (f) => {
                          const url = await uploadToImgBB(f[0], biz.id);
                          const items = [...biolinks.items];
                          items[i] = { ...items[i], thumbnail: url };
                          updateBiolinks({ items });
                        }}
                        multiple={false}
                        compact
                      >
                        <div
                          className="w-10 h-10 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden group bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
                          title="Subir miniatura"
                        >
                          {item.thumbnail ? (
                            <img src={item.thumbnail} className="w-full h-full object-cover" />
                          ) : (
                            <Ico n="image" s={14} c="text-slate-400" />
                          )}
                        </div>
                      </DropZone>

                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <select
                            value={item.icon || "link"}
                            onChange={(e) => {
                              const items = [...biolinks.items];
                              items[i] = { ...items[i], icon: e.target.value };
                              updateBiolinks({ items });
                            }}
                            className="w-[90px] px-2 py-2 rounded-lg text-[10px] text-slate-200 bg-black/20 border border-white/5 focus:border-indigo-500/50 focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="none">Sin Icono</option>
                            <option value="link">🔗 Link</option>
                            <option value="whatsapp">💬 Whats</option>
                            <option value="calendar">📅 Turno</option>
                            <option value="map-pin">📍 Mapa</option>
                            <option value="instagram">📷 Insta</option>
                            <option value="facebook">📘 Face</option>
                            <option value="tiktok">🎵 TikTok</option>
                            <option value="globe">🌐 Web</option>
                            <option value="phone">📞 Tel</option>
                            <option value="star">⭐ Star</option>
                          </select>
                          <select
                            value={item.type || "link"}
                            onChange={(e) => {
                              const items = [...biolinks.items];
                              items[i] = { ...items[i], type: e.target.value };
                              updateBiolinks({ items });
                            }}
                            className="w-[85px] px-2 py-2 rounded-lg text-[10px] text-emerald-300 bg-emerald-900/20 border border-emerald-500/30 focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="link">Enlace</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="turnos">Turnos</option>
                            <option value="map">Ubicación</option>
                            <option value="spotify">Spotify</option>
                            <option value="youtube">YouTube</option>
                          </select>
                          <input
                            value={item.label || ""}
                            placeholder="Título (Ej: Reservar Turno)"
                            onChange={(e) => {
                              const items = [...biolinks.items];
                              items[i] = { ...items[i], label: e.target.value };
                              updateBiolinks({ items });
                            }}
                            className="flex-1 px-3 py-2 rounded-lg text-[11px] text-white bg-black/20 border border-white/5 focus:border-indigo-500/50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            value={item.url || ""}
                            placeholder="https://..."
                            onChange={(e) => {
                              const items = [...biolinks.items];
                              items[i] = { ...items[i], url: e.target.value };
                              updateBiolinks({ items });
                            }}
                            className="w-full px-3 py-2 rounded-lg text-[11px] text-indigo-300 bg-black/20 border border-white/5 focus:border-indigo-500/50 focus:outline-none"
                          />
                        </div>

                        {/* BM5: PROGRAMACIÓN Y FECHAS + CLICS */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-2 pt-2 border-t border-white/5">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.featured || false}
                              onChange={(e) => {
                                const items = [...biolinks.items];
                                items[i] = { ...items[i], featured: e.target.checked };
                                updateBiolinks({ items });
                              }}
                              className="rounded border-white/10 bg-black/20 text-indigo-500 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-400" /> Destacar Botón
                            </span>
                          </label>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400" title="Programación por fecha">
                              Activo:
                            </span>
                            <input
                              type="date"
                              value={item.activeFrom ? item.activeFrom.split("T")[0] : ""}
                              onChange={(e) => {
                                const items = [...biolinks.items];
                                items[i] = {
                                  ...items[i],
                                  activeFrom: e.target.value ? new Date(e.target.value).toISOString() : null,
                                };
                                updateBiolinks({ items });
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] text-slate-400 bg-black/20 border border-white/5"
                              title="Mostrar desde (opcional)"
                            />
                            <span className="text-[9px] text-slate-500">hasta</span>
                            <input
                              type="date"
                              value={item.activeUntil ? item.activeUntil.split("T")[0] : ""}
                              onChange={(e) => {
                                const items = [...biolinks.items];
                                items[i] = {
                                  ...items[i],
                                  activeUntil: e.target.value ? new Date(e.target.value).toISOString() : null,
                                };
                                updateBiolinks({ items });
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] text-slate-400 bg-black/20 border border-white/5"
                              title="Ocultar después de (opcional)"
                            />
                          </div>

                          <div className="text-[9px] text-slate-400">
                            Clics: <strong className="text-white">{item.clicks || 0}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const items = biolinks.items.filter((_: any, idx: number) => idx !== i);
                        updateBiolinks({ items });
                      }}
                      className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
                      title="Eliminar botón"
                    >
                      <Ico n="trash" s={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const items = [
                      ...(biolinks.items || []),
                      { id: `link-${Date.now()}`, label: "Nuevo botón", url: "https://", type: "link", clicks: 0 },
                    ];
                    updateBiolinks({ items });
                  }}
                  className="w-full py-3 mt-2 rounded-xl text-xs font-bold text-indigo-400 hover:text-white transition-colors cursor-pointer"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}
                >
                  + Agregar Botón
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ──────────── RIGHT PANEL (PREVIEW) ──────────── */}
      <div className="flex-1 bg-[#050810] relative flex items-center justify-center p-4 sm:p-8">
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={copyUrl}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-semibold transition-all shadow-xl cursor-pointer"
          >
            <Ico n={copiedUrl ? "check" : "link"} s={14} c={copiedUrl ? "text-emerald-400" : "text-indigo-400"} />
            Copiar URL /links
          </button>
        </div>

        {/* MOCKUP CELULAR */}
        <div className="relative w-[340px] h-[720px] rounded-[40px] border-[8px] border-[#1e293b] overflow-hidden shadow-2xl flex flex-col bg-black">
          {/* Header notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1e293b] rounded-b-2xl z-50 flex justify-center">
            <div className="w-12 h-1.5 bg-black/20 rounded-full mt-2" />
          </div>

          <div className="flex-1 w-full h-full relative overflow-hidden bg-[#050810]">
            <PremiumLinks
              negocio={{
                ...biz,
                layoutConfig: {
                  ...biz?.layoutConfig,
                  biolinks: biolinks,
                },
              }}
              isPreview={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
