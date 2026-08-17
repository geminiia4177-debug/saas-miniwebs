"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Biz, Section, MediaItem, ServiceItem, BookingField,
  DEFAULT_BOOKING_FIELDS, DEFAULT_HOURS, Ico
} from "@/lib/constants";
import {
  TemplateLevel,
  ThreePresetId,
  AnimationIntensity,
  switchTemplateLevel,
} from "@/lib/templates/contract";
import {
  TEMPLATE_LEVEL_METADATA,
  THEME_REGISTRY,
} from "@/lib/templates/themes";
import { ConfiguradorAvanzado } from "./editor/ConfiguradorAvanzado";
import { LandingPreview } from "./editor/LandingPreview";
import ConfiguradorTaller from "@/components/dashboard/cartuchos/ConfiguradorTaller";
import ConfiguradorMenu   from "@/components/dashboard/cartuchos/ConfiguradorMenu";

import { useBusinessEditor } from "./editor/useBusinessEditor";
import { HexColorPicker } from "react-colorful";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { DropZone } from "./editor/DropZone";
import { FieldRow } from "./editor/FieldRow";
import { uploadToImgBB } from "@/lib/utils/upload";

function ColorPickerPopup({ color, onChange }: { color: string, onChange: (c: string) => void }) {
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
    <div className="relative w-full">
      <div 
        className="w-full h-7 rounded-lg cursor-pointer border border-white/20" 
        style={{ backgroundColor: color || "#000" }} 
        onClick={() => setOpen(true)}
      />
      {open && (
        <div className="absolute z-50 mt-2" ref={popover}>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="relative z-50">
            <HexColorPicker color={color || "#000"} onChange={onChange} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: EDITOR TAB
// ─────────────────────────────────────────────────────────────
export default function EditorTab({
  biz, setBiz, sections, setSections, media, setMedia,
  saveAll, saving, showToast, setTab,
}: any) {
  const { updateRoot, updateLayoutConfig } = useBusinessEditor(biz, setBiz);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionSubTab, setSectionSubTab] = useState("content");
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [uploadingServiceIdx, setUploadingServiceIdx] = useState<number | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);

  // Undo / Redo
  const [history, setHistory] = useState<{ biz: any, sections: any }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    if (!biz || !sections) return;
    if (isUndoing) {
      setIsUndoing(false);
      return;
    }
    const timer = setTimeout(() => {
      setHistory(prev => {
        const past = prev.slice(0, historyIndex + 1);
        const latest = past[past.length - 1];
        if (latest && JSON.stringify(latest.biz) === JSON.stringify(biz) && JSON.stringify(latest.sections) === JSON.stringify(sections)) {
          return prev;
        }
        past.push({ biz: JSON.parse(JSON.stringify(biz)), sections: JSON.parse(JSON.stringify(sections)) });
        setHistoryIndex(past.length - 1);
        return past;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [biz, sections]);

  // Escuchar clics desde el iframe (Click-to-Edit)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'EDIT_SECTION') {
        const { section } = e.data;
        
        // 1. Si estamos usando el constructor visual (Default Template) o temas dinámicos
        if (biz.type === 'general' || biz.type === 'personalizado' || !biz.type || ['modern', 'dark', 'list'].includes(biz.layoutConfig?.themeVariant)) {
          const sec = sections?.find((s: any) => s.id === section);
          if (sec) {
            setMainTab("generalConfig"); // Asumiendo que el constructor está aquí
            openSectionEditor(sec);
            showToast(`Editando: ${sec.label || section}`);
            return;
          }
        }
        
        // 2. Fallback: Si no se encontró como sección dinámica, mapear a pestañas estáticas
        if (section === 'hero' || section === 'header') {
          setMainTab('diseno');
        } else if (section === 'services') {
          if (biz.type === 'barberia' || biz.type === 'estetica' || biz.type === 'gimnasio') setMainTab('servicios');
          else if (biz.type === 'cancha') setMainTab('canchas');
          else if (biz.type === 'clinica') setMainTab('especialidades');
          else if (biz.type === 'taller') setMainTab('tallerServices');
          else if (biz.type === 'lavadero') setMainTab('vehiculos');
          else if (biz.type === 'menu' || biz.type === 'restaurante') setMainTab('menuCategorias');
        } else if (section === 'gallery' || section === 'video') {
          setMainTab('video'); // o galeria si existiera
        } else if (section === 'contact') {
          setMainTab('generalConfig');
        }
        
        showToast("Modo edición activo");
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [biz, sections]);

  const undo = () => {
    if (historyIndex > 0) {
      setIsUndoing(true);
      const past = history[historyIndex - 1];
      setBiz(past.biz);
      setSections(past.sections);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoing(true);
      const future = history[historyIndex + 1];
      setBiz(future.biz);
      setSections(future.sections);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleBgUpload = async (files: File[]) => {
    setUploadingBg(true);
    try {
      const url = await uploadToImgBB(files[0], biz.id);
      setBiz((prev: any) => prev ? { ...prev, backgroundImageUrl: url, backgroundType: "image" } : prev);
      showToast("Fondo actualizado ✓");
    } catch {
      showToast("Error al subir la imagen", "error");
    }
    setUploadingBg(false);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    setSections((prev: Section[]) => {
      const next = Array.from(prev);
      const [removed] = next.splice(result.source.index, 1);
      next.splice(result.destination!.index, 0, removed);
      return next;
    });
  };

  const toggleSection = (id: string) =>
    setSections((prev: Section[]) => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));

  const updateSectionConfig = (id: string, config: any) =>
    setSections((prev: Section[]) => prev.map(s => s.id === id ? { ...s, config: { ...s.config, ...config } } : s));

  const openSectionEditor = (section: Section) => {
    setSectionSubTab("content");
    setEditingSection(section);
  };

  const copyUrl = () => {
    if (!biz) return;
    navigator.clipboard.writeText(biz.customDomain ? `https://${biz.customDomain}` : `https://${biz.subdomain}.saas-miniwebs.vercel.app`);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    showToast("URL copiada al portapapeles");
  };

  const uploadServiceImage = async (file: File, sectionId: string, serviceIdx: number) => {
    if (!editingSection) return;
    setUploadingServiceIdx(serviceIdx);
    showToast("Subiendo imagen del servicio...", "info");
    try {
      const url = await uploadToImgBB(file, biz.id);
      const items = [...editingSection.config.items];
      items[serviceIdx] = { ...items[serviceIdx], imageUrl: url };
      setEditingSection({ ...editingSection, config: { ...editingSection.config, items } });
      showToast("Imagen del servicio actualizada ✓");
    } catch {
      showToast("Error al subir la imagen", "error");
    }
    setUploadingServiceIdx(null);
  };

  const getTabs = () => {
    const base = [
      { id: "diseno", label: "Diseño", icon: "palette" }
    ];
    const end = [
      { id: "video", label: "Video", icon: "video" },
    ];
    const genericEnd = [...end, { id: "generalConfig", label: "Config.", icon: "settings" }];

    switch (biz.type) {
      case "cancha": return [...base, { id: "canchas", label: "Canchas", icon: "star" }, ...genericEnd];
      case "clinica": return [...base, { id: "especialidades", label: "Espec.", icon: "star" }, { id: "profesionales", label: "Prof.", icon: "user" }, ...genericEnd];
      case "gimnasio": return [...base, { id: "planes", label: "Planes", icon: "star" }, { id: "clases", label: "Clases", icon: "calendar" }, { id: "servicios", label: "Servicios", icon: "star" }, { id: "productos", label: "Productos", icon: "box" }, ...genericEnd];
      case "estetica": return [...base, { id: "categorias", label: "Categorías", icon: "folder" }, { id: "servicios", label: "Servicios", icon: "star" }, ...genericEnd];
      case "menu": 
      case "restaurante": return [...base, { id: "menuCategorias", label: "Menú", icon: "menu" }, { id: "menuConfig", label: "Ajustes", icon: "settings" }, ...genericEnd];
      case "barberia": return [...base, { id: "servicios", label: "Servicios", icon: "star" }, { id: "productos", label: "Productos", icon: "box" }, ...genericEnd];
      case "taller": return [...base, { id: "tallerServices", label: "Servicios", icon: "star" }, { id: "tallerSettings", label: "Ajustes", icon: "settings" }, ...genericEnd];
      case "lavadero": return [...base, { id: "vehiculos", label: "Vehículos", icon: "folder" }, ...genericEnd];
      default: return [...base, { id: "servicios", label: "Servicios", icon: "star" }, { id: "productos", label: "Productos", icon: "box" }, ...genericEnd];
    }
  };
  const tabs = getTabs();

  const [mainTab, setMainTab] = useState<string>("diseno");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-8rem)] animate-fadeIn relative">
      {/* ── MOBILE VIEW TOGGLE ── */}
      <div className="md:hidden flex items-center justify-between p-2 bg-[#0a0f1c] border-b border-white/10 shrink-0">
        <div className="flex gap-1 w-full bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setMobileView("edit")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mobileView === "edit"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Ico n="edit" s={14} /> Controles de Edición
          </button>
          <button
            onClick={() => setMobileView("preview")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mobileView === "preview"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Ico n="eye" s={14} /> Ver cómo queda
          </button>
        </div>
      </div>

      {/* ──────────── LEFT PANEL ──────────── */}
      <div className={`w-full md:w-72 flex-shrink-0 flex-col border-r overflow-hidden ${mobileView === "edit" ? "flex" : "hidden md:flex"}`}
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>

        {/* TOP TABS */}
        <div className="p-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0a0f1c" }}>
          {(!biz.type || biz.type === "general") ? (
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              <button onClick={() => setMainTab("diseno")}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
                style={mainTab === "diseno" ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.35)" } : { color: "#475569" }}>
                Diseño
              </button>
              <button onClick={() => setMainTab("config")}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
                style={mainTab === "config" ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.35)" } : { color: "#475569" }}>
                Secciones
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setMainTab(t.id)}
                  className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all"
                  style={mainTab === t.id
                    ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.35)" }
                    : { color: "#475569", border: "1px solid transparent" }}>
                  <Ico n={t.icon} s={14} />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto flex flex-col">

          {/* ── DISEÑO ── */}
          {mainTab === "diseno" && (
            <div className="animate-fadeIn pb-6">
              
              {/* ── Título Principal ── */}
              <div className="px-3 pt-4 pb-2 border-b border-white/5">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-0.5 mb-2">Título Principal</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={biz.layoutConfig?.heroTitle || biz.name}
                    onChange={e => setBiz((prev: any) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, heroTitle: e.target.value } }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Ej: La Gorda"
                  />
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-slate-600">Color</span>
                      <ColorPickerPopup 
                        color={biz.layoutConfig?.heroTitleColor || "#ffffff"} 
                        onChange={c => setBiz((prev: any) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, heroTitleColor: c } }))} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-3 pt-3 pb-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-0.5 mb-2">Colores rápidos</p>
                <div className="flex gap-2 items-center">
                  {[
                    { key: "primaryColor",   label: "P" },
                    { key: "secondaryColor", label: "S" },
                    { key: "accentColor",    label: "A" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-slate-600">{label}</span>
                      <ColorPickerPopup 
                        color={(biz as any)[key] || "#000"} 
                        onChange={c => setBiz((prev: any) => prev ? { ...prev, [key]: c } : prev)} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-3 pt-3 pb-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-0.5 mb-2">Colores Adicionales</p>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-600 text-center">Fondo<br/>Contacto</span>
                    <ColorPickerPopup 
                      color={biz.layoutConfig?.footerBgColor || "#050505"} 
                      onChange={c => setBiz((prev: any) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, footerBgColor: c } }))} 
                    />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-600 text-center">Texto<br/>Contacto</span>
                    <ColorPickerPopup 
                      color={biz.layoutConfig?.footerTextColor || "#888888"} 
                      onChange={c => setBiz((prev: any) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, footerTextColor: c } }))} 
                    />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-600 text-center">Caja<br/>Reservas</span>
                    <ColorPickerPopup 
                      color={biz.layoutConfig?.bookingBgColor || "#111111"} 
                      onChange={c => setBiz((prev: any) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, bookingBgColor: c } }))} 
                    />
                  </div>
                </div>
              </div>

              <div className="px-3 pt-2 pb-2">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Fuente de Letra (Google Fonts)</p>
                <select
                  value={biz.fontFamily || "sans"}
                  onChange={e => setBiz((prev: any) => prev ? { ...prev, fontFamily: e.target.value } : prev)}
                  className="w-full px-3 py-2 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
                  style={{ background: "#0a0f1c" }}
                >
                  <option value="sans">Sans (Defecto)</option>
                  <option value="'Inter', sans-serif">Inter</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Playfair Display', serif">Playfair Display</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="'Oswald', sans-serif">Oswald</option>
                </select>
              </div>

              <div className="px-3 pt-2 pb-2 border-t border-white/5 mt-2">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Tamaño Base del Texto</p>
                <div className="flex bg-white/5 rounded-lg p-1">
                  {[
                    { label: "Pequeño", val: 85 },
                    { label: "Normal", val: 100 },
                    { label: "Grande", val: 115 }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setBiz((prev: any) => prev ? { ...prev, layoutConfig: { ...prev.layoutConfig, fontSizeHero: preset.val, fontSizeTitles: preset.val, fontSizeBody: preset.val } } : prev)}
                      className="flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all"
                      style={(biz.layoutConfig?.fontSizeBody || 100) === preset.val ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" } : { color: "#64748b" }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-3 pt-2 pb-2 border-t border-white/5 mt-2">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Sombreado de Portada</p>
                <div className="flex bg-white/5 rounded-lg p-1">
                  {[
                    { label: "Claro", val: 40 },
                    { label: "Medio", val: 70 },
                    { label: "Oscuro", val: 95 }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setBiz((prev: any) => prev ? { ...prev, layoutConfig: { ...prev.layoutConfig, bannerOpacity: preset.val } } : prev)}
                      className="flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all"
                      style={(biz.layoutConfig?.bannerOpacity ?? 70) === preset.val ? { background: "rgba(99,102,241,0.25)", color: "#a5b4fc" } : { color: "#64748b" }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-3 pt-2 pb-2 border-t border-white/5 mt-2">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Foto de Portada</p>
                <DropZone onFiles={async (files) => {
                  try {
                    const url = await uploadToImgBB(files[0], biz.id);
                    setBiz((prev: any) => prev ? { ...prev, bannerUrl: url } : prev);
                    showToast("Foto de portada actualizada");
                  } catch { showToast("Error al subir portada", "error"); }
                }} multiple={false} compact>
                  {biz.bannerUrl ? (
                    <div className="relative w-full h-20 rounded-lg overflow-hidden group">
                      <img src={biz.bannerUrl} className="w-full h-full object-cover" alt="Portada" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] text-white font-bold">Cambiar foto</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 p-2">
                      <Ico n="upload" s={16} c="text-slate-400" />
                      <span className="text-[9px] text-slate-400">Subir portada</span>
                    </div>
                  )}
                </DropZone>
              </div>

              <div className="px-3 pt-2 pb-2 border-t border-white/5 mt-2">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Estilo de Fondo</p>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {[
                    { val: "color",    label: "Liso" },
                    { val: "gradient", label: "Degradado" },
                    { val: "image",    label: "Imagen" },
                  ].map(b => (
                    <button key={b.val} onClick={() => setBiz((prev: any) => prev ? { ...prev, backgroundType: b.val } : prev)}
                      className="py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                      style={biz.backgroundType === b.val || (!biz.backgroundType && b.val === "color")
                        ? { background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)" }
                        : { background: "rgba(255,255,255,0.03)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {b.label}
                    </button>
                  ))}
                </div>

                {biz.backgroundType === "image" && (
                  <div className="mb-3">
                    <DropZone onFiles={handleBgUpload} multiple={false} compact>
                      {uploadingBg ? (
                        <div className="flex flex-col items-center gap-1 p-2">
                          <Ico n="loader" s={16} c="text-indigo-400 animate-spin" />
                          <span className="text-[9px] text-slate-400">Subiendo...</span>
                        </div>
                      ) : biz.backgroundImageUrl ? (
                        <div className="relative w-full h-16 rounded-lg overflow-hidden group">
                          <img src={biz.backgroundImageUrl} className="w-full h-full object-cover" alt="Fondo" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] text-white font-bold">Cambiar imagen</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 p-2">
                          <Ico n="upload" s={16} c="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                          <span className="text-[9px] text-slate-400 group-hover:text-indigo-300">Subir imagen</span>
                        </div>
                      )}
                    </DropZone>
                  </div>
                )}

                {/* ── MULTI-LEVEL VISUAL TEMPLATE SELECTOR ── */}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                    <span>Nivel de Plantilla</span>
                    <span className="text-[9px] text-indigo-400 font-bold">4 estilos</span>
                  </p>

                  <div className="space-y-2">
                    {(["classic", "motion", "premium", "immersive"] as TemplateLevel[]).map((levelKey) => {
                      const meta = TEMPLATE_LEVEL_METADATA[levelKey];
                      const currentLvl = biz.layoutConfig?.templateLevel || (
                        biz.layoutConfig?.themeVariant === "modern" || biz.layoutConfig?.themeVariant === "dynamic" ? "motion" :
                        biz.layoutConfig?.themeVariant === "dark" || biz.layoutConfig?.themeVariant === "luxury" || biz.layoutConfig?.themeVariant === "editorial" || biz.layoutConfig?.themeVariant === "minimal_luxury" ? "premium" :
                        biz.layoutConfig?.themeVariant === "flow" || biz.layoutConfig?.themeVariant === "particles" || biz.layoutConfig?.themeVariant === "organic" || biz.layoutConfig?.themeVariant === "immersive_dark" ? "immersive" :
                        "classic"
                      );
                      const isSelected = currentLvl === levelKey;

                      return (
                        <button
                          key={levelKey}
                          onClick={() => {
                            const updated = switchTemplateLevel(biz, levelKey);
                            setBiz(updated);
                          }}
                          className={`w-full p-2.5 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                            isSelected
                              ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                              : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              {levelKey === "classic" && "⚡"}
                              {levelKey === "motion" && "🌊"}
                              {levelKey === "premium" && "👑"}
                              {levelKey === "immersive" && "🌌"}
                              {meta.marketingName}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                isSelected
                                  ? "bg-indigo-500 text-white shadow-sm"
                                  : "bg-white/10 text-slate-400"
                              }`}
                            >
                              {meta.badge}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-tight">
                            {meta.description}
                          </p>

                          <div className="flex flex-wrap gap-1 mt-1">
                            {meta.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-white/5 text-slate-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── THEME SELECTOR FOR CURRENT LEVEL ── */}
                {(() => {
                  const currentLvl = (biz.layoutConfig?.templateLevel || (
                    biz.layoutConfig?.themeVariant === "modern" || biz.layoutConfig?.themeVariant === "dynamic" ? "motion" :
                    biz.layoutConfig?.themeVariant === "dark" || biz.layoutConfig?.themeVariant === "luxury" || biz.layoutConfig?.themeVariant === "editorial" || biz.layoutConfig?.themeVariant === "minimal_luxury" ? "premium" :
                    biz.layoutConfig?.themeVariant === "flow" || biz.layoutConfig?.themeVariant === "particles" || biz.layoutConfig?.themeVariant === "organic" || biz.layoutConfig?.themeVariant === "immersive_dark" ? "immersive" :
                    "classic"
                  )) as TemplateLevel;
                  const allowedThemes = TEMPLATE_LEVEL_METADATA[currentLvl]?.allowedThemes || ["clean", "essential"];

                  return (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Tema Visual ({TEMPLATE_LEVEL_METADATA[currentLvl]?.marketingName})
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {allowedThemes.map((thId) => {
                          const th = THEME_REGISTRY[thId];
                          if (!th) return null;
                          const isSelected =
                            biz.layoutConfig?.themeVariant === thId ||
                            biz.layoutConfig?.themeId === thId ||
                            (!biz.layoutConfig?.themeVariant && thId === allowedThemes[0]);

                          return (
                            <button
                              key={thId}
                              onClick={() =>
                                setBiz((prev: any) =>
                                  prev
                                    ? {
                                        ...prev,
                                        layoutConfig: {
                                          ...prev.layoutConfig,
                                          themeVariant: thId,
                                          themeId: thId,
                                          templateLevel: currentLvl,
                                          ...(th.defaultPreset ? { visualPreset: th.defaultPreset } : {}),
                                        },
                                      }
                                    : prev
                                )
                              }
                              className={`p-2 rounded-xl text-left border transition-all flex flex-col gap-1 ${
                                isSelected
                                  ? "bg-indigo-500/20 border-indigo-500 text-white"
                                  : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.04]"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: th.visuals.defaultPrimary }}
                                />
                                <span className="text-[10px] font-bold truncate text-white">
                                  {th.name}
                                </span>
                              </div>
                              <span className="text-[8px] text-slate-400 line-clamp-2 leading-tight">
                                {th.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── ANIMATION INTENSITY (Level 2 & 3) ── */}
                {(() => {
                  const currentLvl = biz.layoutConfig?.templateLevel || (
                    biz.layoutConfig?.themeVariant === "modern" || biz.layoutConfig?.themeVariant === "dynamic" ? "motion" :
                    biz.layoutConfig?.themeVariant === "dark" || biz.layoutConfig?.themeVariant === "luxury" || biz.layoutConfig?.themeVariant === "editorial" || biz.layoutConfig?.themeVariant === "minimal_luxury" ? "premium" :
                    "classic"
                  );
                  if (currentLvl !== "motion" && currentLvl !== "premium") return null;

                  return (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Intensidad de Animación
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { val: "subtle", label: "Sutil", desc: "Elegante" },
                          { val: "balanced", label: "Equilibrado", desc: "Fluido" },
                          { val: "dynamic", label: "Dinámico", desc: "Activo" },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            onClick={() =>
                              setBiz((prev: any) =>
                                prev
                                  ? {
                                      ...prev,
                                      layoutConfig: {
                                        ...prev.layoutConfig,
                                        animationIntensity: opt.val,
                                      },
                                    }
                                  : prev
                              )
                            }
                            className={`py-1.5 px-2 rounded-lg text-center border transition-all ${
                              (biz.layoutConfig?.animationIntensity || "balanced") === opt.val
                                ? "bg-indigo-500/30 border-indigo-500 text-white"
                                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            <div className="text-[9px] font-bold">{opt.label}</div>
                            <div className="text-[7px] text-slate-500">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ── 3D VISUAL PRESET SELECTOR (Level 4) ── */}
                {(() => {
                  const currentLvl = biz.layoutConfig?.templateLevel || (
                    ["flow", "particles", "organic", "immersive_dark"].includes(biz.layoutConfig?.themeVariant) ? "immersive" : "classic"
                  );
                  if (currentLvl !== "immersive") return null;

                  return (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Estilo Visual Inmersivo
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: "flow", name: "Ondas Fluidas", desc: "Movimiento suave y orgánico" },
                          { id: "particles", name: "Partículas", desc: "Constelación cósmica sutil" },
                          { id: "luxury", name: "Lujo Geométrico", desc: "Reflejos y facetas premium" },
                          { id: "organic", name: "Curvas Botánicas", desc: "Formas naturales ondulantes" },
                        ].map((p) => {
                          const isSelected = (biz.layoutConfig?.visualPreset || "flow") === p.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() =>
                                setBiz((prev: any) =>
                                  prev
                                    ? {
                                        ...prev,
                                        layoutConfig: {
                                          ...prev.layoutConfig,
                                          visualPreset: p.id,
                                        },
                                      }
                                    : prev
                                )
                              }
                              className={`p-2 rounded-xl text-left border transition-all ${
                                isSelected
                                  ? "bg-cyan-500/20 border-cyan-500 text-white"
                                  : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.04]"
                              }`}
                            >
                              <div className="text-[10px] font-bold text-white">{p.name}</div>
                              <div className="text-[8px] text-slate-400 leading-tight">{p.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 mt-3">Forma de Botones</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: "rounded", label: "Curvos" },
                    { val: "square",  label: "Cuadrados" },
                    { val: "pill",    label: "Pastilla" },
                  ].map(b => (
                    <button key={b.val} onClick={() => setBiz((prev: any) => prev ? { ...prev, buttonStyle: b.val } : prev)}
                      className="py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                      style={biz.buttonStyle === b.val || (!biz.buttonStyle && b.val === "rounded")
                        ? { background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)" }
                        : { background: "rgba(255,255,255,0.03)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* ── Secciones genéricas o Reordenamiento Barberia ── */}
          {(mainTab === "config" || mainTab === "generalConfig") && (
            <div className="p-3 space-y-1.5 animate-fadeIn">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-0.5 mb-3">Orden de Secciones</p>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="sections-list">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1.5">
                      {sections.map((section: Section, index: number) => (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="rounded-xl p-3 transition-all"
                              style={{
                                background: snapshot.isDragging ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${snapshot.isDragging ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
                                ...provided.draggableProps.style,
                              }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="text-slate-600 flex-shrink-0"><Ico n="drag" s={14} /></div>
                                <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${section.visible ? "text-indigo-400" : "text-slate-600"}`}
                                  style={{ background: section.visible ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)" }}>
                                  <Ico n={section.icon} s={13} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold truncate ${section.visible ? "text-white" : "text-slate-600"}`}>{section.label}</p>
                                  {!section.visible && <p className="text-[10px] text-slate-600">Oculta</p>}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button onClick={(e) => { e.preventDefault(); toggleSection(section.id); }}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${section.visible ? "text-indigo-400 hover:bg-indigo-500/20" : "text-slate-600 hover:bg-white/5"}`}>
                                    <Ico n={section.visible ? "eye" : "eyeOff"} s={11} />
                                  </button>
                                  <button onClick={(e) => { e.preventDefault(); openSectionEditor(section); }}
                                    className="w-6 h-6 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors">
                                    <Ico n="edit" s={11} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}

          {/* ── ADVANCED configurador ── */}
          {mainTab !== "diseno" && mainTab !== "config" && (
            <div className="animate-fadeIn pb-6">
              {biz.type === "taller" && (mainTab === "tallerServices" || mainTab === "tallerSettings") ? (
                <ConfiguradorTaller biz={biz} setBiz={setBiz} media={media} setMedia={setMedia} showToast={showToast} activeTab={mainTab} />
              ) : (biz.type === "menu" || biz.type === "restaurante") && mainTab === "menuConfig" ? (
                <ConfiguradorMenu biz={biz} setBiz={setBiz} media={media} setMedia={setMedia} showToast={showToast} activeTab={mainTab} />
              ) : (
                <ConfiguradorAvanzado
                  biz={biz}
                  setBiz={setBiz}
                  media={media}
                  setMedia={setMedia}
                  showToast={showToast}
                  activeTab={mainTab}
                />
              )}
            </div>
          )}
        </div>

        {/* Sticky footer — Guardar */}
        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0a0f1c" }}>
          <button disabled={saving} onClick={saveAll}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
            {saving ? <><Ico n="loader" s={14} c="animate-spin" /> Guardando...</> : <><Ico n="check" s={14} /> Guardar Diseño</>}
          </button>
        </div>
      </div>

      {/* ──────────── RIGHT PANEL — PREVIEW ──────────── */}
      <div className={`flex-1 flex-col overflow-hidden ${mobileView === "preview" ? "flex" : "hidden md:flex"}`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-b flex-shrink-0 gap-2 overflow-x-auto" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {([["desktop", "monitor", "Escritorio"], ["mobile", "smartphone", "Móvil"]] as const).map(([d, ic, lbl]) => (
              <button key={d} onClick={() => setPreviewDevice(d as any)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={previewDevice === d
                  ? { background: "rgba(99,102,241,0.25)", color: "#fff", border: "1px solid rgba(99,102,241,0.3)" }
                  : { color: "#64748b", border: "1px solid transparent" }}>
                <Ico n={ic} s={12} />{lbl}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={undo} disabled={historyIndex <= 0} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30" style={{ background: "rgba(255,255,255,0.05)" }}><Ico n="undo" s={14} /></button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30" style={{ background: "rgba(255,255,255,0.05)" }}><Ico n="redo" s={14} /></button>
            
            <button onClick={() => setTab("gallery")}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors ml-2"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <Ico n="image" s={12} /> Galería
            </button>
            <button onClick={saveAll} disabled={saving}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-opacity disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
              <Ico n={saving ? "loader" : "check"} s={12} c={saving ? "animate-spin" : ""} />
              {saving ? "..." : "Guardar"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-10 flex items-start justify-center"
          style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(99,102,241,0.06) 0%,transparent 70%), #050810" }}>
          <div className={`transition-all duration-300 ${previewDevice === "mobile" ? "w-full max-w-[390px]" : "w-full"}`}>
            <div className="relative" style={{ transform: 'translateZ(0)' }}>
              {previewDevice === "mobile" && (
                <div className="hidden sm:block absolute -inset-4 rounded-[48px] pointer-events-none z-50"
                  style={{ border: "8px solid rgba(255,255,255,0.08)", boxShadow: "0 0 0 1px rgba(255,255,255,0.04)" }} />
              )}
              <LandingPreview biz={biz} sections={sections} media={media} />
            </div>
          </div>
        </div>
      </div>

      {/* ── FLOATING SWITCH BUTTON (Mobile Only) ── */}
      <button
        onClick={() => setMobileView(mobileView === "edit" ? "preview" : "edit")}
        className="md:hidden fixed bottom-16 right-4 z-40 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl font-bold text-xs flex items-center gap-2 border border-white/20 active:scale-95 transition-all"
      >
        {mobileView === "edit" ? (
          <><Ico n="eye" s={15} /> Ver cómo queda</>
        ) : (
          <><Ico n="edit" s={15} /> Volver al editor</>
        )}
      </button>

      {/* ── MODAL: EDIT SECTION (solo para tipos genéricos) ── */}
      {editingSection && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
          <div className="w-full max-w-2xl rounded-2xl animate-slideUp flex flex-col"
            style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(99,102,241,0.3)", boxShadow: "0 40px 100px rgba(0,0,0,0.7)", maxHeight: "90vh" }}>

            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h3 className="font-extrabold text-white text-lg">Editar: {editingSection.label}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Los cambios se ven en la vista previa al aplicar</p>
              </div>
              <button onClick={() => setEditingSection(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                <Ico n="x" s={16} />
              </button>
            </div>

            {(editingSection.id === "services" || editingSection.id === "booking") && (
              <div className="px-6 pt-4">
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {editingSection.id === "services" && [
                    { id: "content", label: "Servicios", icon: "star" },
                    { id: "design",  label: "Diseño",    icon: "palette" },
                  ].map(st => (
                    <button key={st.id} onClick={() => setSectionSubTab(st.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={sectionSubTab === st.id
                        ? { background: "rgba(99,102,241,0.25)", color: "#fff", border: "1px solid rgba(99,102,241,0.3)" }
                        : { color: "#64748b", border: "1px solid transparent" }}>
                      <Ico n={st.icon} s={12} /> {st.label}
                    </button>
                  ))}
                  {editingSection.id === "booking" && [
                    { id: "content", label: "Textos",         icon: "type" },
                    { id: "fields",  label: "Campos del form", icon: "fields" },
                    { id: "hours",   label: "Horarios",        icon: "clock" },
                  ].map(st => (
                    <button key={st.id} onClick={() => setSectionSubTab(st.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={sectionSubTab === st.id
                        ? { background: "rgba(99,102,241,0.25)", color: "#fff", border: "1px solid rgba(99,102,241,0.3)" }
                        : { color: "#64748b", border: "1px solid transparent" }}>
                      <Ico n={st.icon} s={12} /> {st.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* ── HERO ── */}
              {editingSection.id === "hero" && (
                <>
                  {[
                    { key: "title",        label: "Título principal",              ph: "Tu eslogan aquí" },
                    { key: "subtitle",     label: "Subtítulo",                     ph: "Una descripción breve" },
                    { key: "ctaText",      label: "Texto del botón principal",     ph: "Reservar Turno" },
                    { key: "ctaSecondary", label: "Texto del botón secundario",    ph: "Ver Servicios" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">{f.label}</label>
                      <input value={editingSection.config[f.key] || ""} placeholder={f.ph}
                        onChange={e => setEditingSection({ ...editingSection, config: { ...editingSection.config, [f.key]: e.target.value } })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                    </div>
                  ))}
                </>
              )}

              {/* ── SERVICES — content ── */}
              {editingSection.id === "services" && sectionSubTab === "content" && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Servicios</p>
                  {(editingSection.config.items || []).map((item: ServiceItem, i: number) => (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="relative h-28 flex items-center justify-center overflow-hidden" style={{ background: "rgba(99,102,241,0.07)" }}>
                        {item.imageUrl
                          ? <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                          : <span className="text-5xl">{item.emoji || "⭐"}</span>
                        }
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.6)" }}>
                          <DropZone onFiles={files => uploadServiceImage(files[0], editingSection.id, i)} multiple={false} compact>
                            <div className="flex flex-col items-center gap-1 pointer-events-none">
                              {uploadingServiceIdx === i
                                ? <Ico n="loader" s={20} c="text-indigo-400 animate-spin" />
                                : <Ico n="upload" s={20} c="text-white" />
                              }
                              <span className="text-[10px] text-white font-semibold">Subir foto</span>
                            </div>
                          </DropZone>
                          {item.imageUrl && (
                            <button onClick={() => {
                              const items = [...editingSection.config.items];
                              items[i] = { ...items[i], imageUrl: "" };
                              setEditingSection({ ...editingSection, config: { ...editingSection.config, items } });
                            }} className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.7)" }}>
                              <Ico n="trash" s={16} c="text-white" />
                              <span className="text-[10px] text-white">Quitar</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {[
                          { key: "emoji",    label: "Emoji (si no hay foto)", ph: "✂️",         col: 1 },
                          { key: "name",     label: "Nombre del servicio",    ph: "Corte Clásico", col: 2 },
                          { key: "price",    label: "Precio",                 ph: "$2500",         col: 1 },
                          { key: "duration", label: "Duración (min)",         ph: "30",            col: 1 },
                        ].map(f => (
                          <div key={f.key} className={f.col === 2 ? "col-span-2" : ""}>
                            <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">{f.label}</label>
                            <input
                              type={f.key === "duration" ? "number" : "text"}
                              value={(item as any)[f.key] || ""} placeholder={f.ph}
                              onChange={e => {
                                const items = [...editingSection.config.items];
                                items[i] = { ...items[i], [f.key]: f.key === "duration" ? Number(e.target.value) : e.target.value };
                                setEditingSection({ ...editingSection, config: { ...editingSection.config, items } });
                              }}
                              className="w-full px-3 py-2 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none" />
                          </div>
                        ))}
                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Descripción breve</label>
                          <input value={item.description || ""} placeholder="Describe el servicio..."
                            onChange={e => {
                              const items = [...editingSection.config.items];
                              items[i] = { ...items[i], description: e.target.value };
                              setEditingSection({ ...editingSection, config: { ...editingSection.config, items } });
                            }}
                            className="w-full px-3 py-2 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none" />
                        </div>
                      </div>
                      <div className="px-4 pb-3">
                        <button onClick={() => {
                          const items = editingSection.config.items.filter((_: any, idx: number) => idx !== i);
                          setEditingSection({ ...editingSection, config: { ...editingSection.config, items } });
                        }} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors">
                          Eliminar servicio
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => {
                    const items = [...(editingSection.config.items || []), { emoji: "⭐", name: "Nuevo Servicio", price: "$0", duration: 30, imageUrl: "", description: "" }];
                    setEditingSection({ ...editingSection, config: { ...editingSection.config, items } });
                  }} className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors"
                    style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>
                    + Agregar servicio
                  </button>
                </div>
              )}



              {/* ── SERVICES — design ── */}
              {editingSection.id === "services" && sectionSubTab === "design" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Layout de la grilla</label>
                    <div className="flex gap-2">
                      {[
                        { val: "grid",  label: "Grilla" },
                        { val: "list",  label: "Lista" },
                        { val: "cards", label: "Cards grandes" },
                      ].map(l => (
                        <button key={l.val} onClick={() => setEditingSection({ ...editingSection, config: { ...editingSection.config, layout: l.val } })}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={editingSection.config.layout === l.val
                            ? { background: "rgba(99,102,241,0.25)", color: "#fff", border: "1px solid rgba(99,102,241,0.4)" }
                            : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── BOOKING — content ── */}
              {editingSection.id === "booking" && sectionSubTab === "content" && (
                <div className="space-y-3">
                  {[
                    { key: "title",    label: "Título de la sección", ph: "Reservá tu turno" },
                    { key: "subtitle", label: "Subtítulo",            ph: "Fácil y rápido" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">{f.label}</label>
                      <input value={editingSection.config[f.key] || ""} placeholder={f.ph}
                        onChange={e => setEditingSection({ ...editingSection, config: { ...editingSection.config, [f.key]: e.target.value } })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Duración del slot por defecto (minutos)
                    </label>
                    <div className="flex gap-2">
                      {[15, 20, 30, 45, 60, 90].map(d => (
                        <button key={d} onClick={() => setEditingSection({ ...editingSection, config: { ...editingSection.config, slotDuration: d } })}
                          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                          style={editingSection.config.slotDuration === d
                            ? { background: "rgba(99,102,241,0.25)", color: "#fff", border: "1px solid rgba(99,102,241,0.4)" }
                            : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── BOOKING — fields ── */}
              {editingSection.id === "booking" && sectionSubTab === "fields" && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500">Personalizá qué campos aparecen en el formulario de reserva.</p>
                  {(editingSection.config.fields || DEFAULT_BOOKING_FIELDS).map((field: BookingField, i: number) => (
                    <FieldRow
                      key={field.id}
                      field={field}
                      onUpdate={updated => {
                        const fields = [...(editingSection.config.fields || DEFAULT_BOOKING_FIELDS)];
                        fields[i] = updated;
                        setEditingSection({ ...editingSection, config: { ...editingSection.config, fields } });
                      }}
                      onDelete={() => {
                        const fields = (editingSection.config.fields || DEFAULT_BOOKING_FIELDS).filter((_: any, idx: number) => idx !== i);
                        setEditingSection({ ...editingSection, config: { ...editingSection.config, fields } });
                      }}
                      canDelete={!["name","service"].includes(field.id)}
                    />
                  ))}
                  <button onClick={() => {
                    const newField: BookingField = { id: `field_${Date.now()}`, label: "Nuevo campo", type: "text", placeholder: "", required: false };
                    const fields = [...(editingSection.config.fields || DEFAULT_BOOKING_FIELDS), newField];
                    setEditingSection({ ...editingSection, config: { ...editingSection.config, fields } });
                  }} className="w-full py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-white transition-colors"
                    style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>
                    + Agregar campo
                  </button>
                </div>
              )}

              {/* ── BOOKING — hours ── */}
              {editingSection.id === "booking" && sectionSubTab === "hours" && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500 mb-4">Los horarios de atención se configuran ahora desde la pestaña de Gestión general.</p>
                </div>
              )}

              {/* ── CONTACT ── */}
              {editingSection.id === "contact" && (
                <>
                  {[
                    { key: "address", label: "Dirección",                         ph: "Av. Corrientes 1234, CABA" },
                    { key: "mapUrl",  label: "URL de Google Maps (embed)",         ph: "https://maps.google.com/..." },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">{f.label}</label>
                      <input value={editingSection.config[f.key] || ""} placeholder={f.ph}
                        onChange={e => setEditingSection({ ...editingSection, config: { ...editingSection.config, [f.key]: e.target.value } })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                    </div>
                  ))}
                  <div className="p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                    <p className="text-[10px] text-indigo-400 font-semibold">
                      💡 Las redes sociales se configuran en{" "}
                      <button className="underline" onClick={() => { setEditingSection(null); setTab("config"); }}>
                        Configuración General
                      </button>
                    </p>
                  </div>
                </>
              )}

              {/* ── GALLERY ── */}
              {editingSection.id === "gallery" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Columnas</label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map(c => (
                      <button key={c} onClick={() => setEditingSection({ ...editingSection, config: { ...editingSection.config, columns: c } })}
                        className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                        style={editingSection.config.columns === c
                          ? { background: "rgba(99,102,241,0.25)", color: "#fff", border: "1px solid rgba(99,102,241,0.4)" }
                          : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {c} col
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── VIDEO ── */}
              {editingSection.id === "video" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">URL de YouTube</label>
                  <input value={editingSection.config.youtubeUrl || ""} placeholder="https://youtube.com/watch?v=..."
                    onChange={e => setEditingSection({ ...editingSection, config: { ...editingSection.config, youtubeUrl: e.target.value } })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <button onClick={() => setEditingSection(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Cancelar
              </button>
              <button onClick={() => {
                updateSectionConfig(editingSection.id, editingSection.config);
                setEditingSection(null);
                showToast("Sección actualizada");
              }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                Aplicar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}