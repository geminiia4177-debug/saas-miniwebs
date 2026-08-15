import React, { useState, useEffect, useRef } from "react";
import { Ico } from "@/lib/constants";
import { DropZone } from "./editor/DropZone";
import { HexColorPicker } from "react-colorful";
import { uploadToImgBB } from "@/lib/utils/upload";
import PremiumLinks from "../landings/PremiumLinks";

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
        className="w-full h-7 rounded-lg cursor-pointer border border-white/20 shadow-sm" 
        style={{ backgroundColor: color || "#000" }} 
        onClick={() => setOpen(true)}
      />
      {open && (
        <div className="absolute z-50 mt-2 right-0" ref={popover}>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="relative z-50 shadow-2xl rounded-xl overflow-hidden border border-white/10">
            <HexColorPicker color={color || "#000"} onChange={onChange} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function BiolinksTab({ biz, setBiz, saveAll, saving, showToast, copyUrl, copiedUrl }: any) {
  const [subTab, setSubTab] = useState("diseno");
  const [uploading, setUploading] = useState(false);

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
    items: []
  };

  const updateBiolinks = (updates: any) => {
    setBiz((prev: any) => ({
      ...prev,
      layoutConfig: {
        ...(prev.layoutConfig || {}),
        biolinks: { ...biolinks, ...updates }
      }
    }));
  };



  return (
    <div className="flex h-screen animate-fadeIn bg-[#080a10]">
      {/* ──────────── LEFT PANEL ──────────── */}
      <div className="w-[460px] flex-shrink-0 flex flex-col border-r overflow-hidden relative z-10"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
        
        {/* HEADER */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0a0f1c" }}>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Ico n="link" s={16} c="text-indigo-400" /> Editor BioLinks
            </h2>
            <p className="text-[10px] text-slate-500 mt-1">El linktree de tu negocio</p>
          </div>
          <button onClick={() => saveAll()} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5">
            {saving ? <><Ico n="loader" s={12} c="animate-spin" /> Guardando</> : <><Ico n="save" s={12} /> Guardar</>}
          </button>
        </div>

        {/* TOP TABS */}
        <div className="p-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
            <button onClick={() => setSubTab("diseno")}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
              style={subTab === "diseno" ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" } : { color: "#475569" }}>
              Diseño
            </button>
            <button onClick={() => setSubTab("enlaces")}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all"
              style={subTab === "enlaces" ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" } : { color: "#475569" }}>
              Botones
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {/* GENERAL ACTIVATION */}
          <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white mb-0.5">Activar BioLinks</p>
              <p className="text-[10px] text-slate-500">Habilita la ruta pública /links</p>
            </div>
            <button onClick={() => updateBiolinks({ active: !biolinks.active })}
              className={`w-10 h-6 rounded-full relative transition-colors ${biolinks.active ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-slate-700'}`}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${biolinks.active ? 'left-5' : 'left-1'}`} />
            </button>
          </div>

          {/* ── DISEÑO ── */}
          {subTab === "diseno" && (
            <div className="animate-fadeIn pb-6">
              <div className="px-4 py-4 border-b border-white/5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Título Principal</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500">Color:</span>
                      <div className="w-16">
                        <ColorPickerPopup color={biolinks.titleColor} onChange={c => updateBiolinks({ titleColor: c })} />
                      </div>
                    </div>
                  </div>
                  <input value={biolinks.title} onChange={e => updateBiolinks({ title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs text-white bg-black/20 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Subtítulo</label>
                  <input value={biolinks.subtitle} onChange={e => updateBiolinks({ subtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs text-white bg-black/20 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                </div>
              </div>

              <div className="px-4 py-4 border-b border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Imágenes</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1">Foto Perfil</span>
                    <DropZone onFiles={async f => { const url = await uploadToImgBB(f[0], biz.id); updateBiolinks({ profileUrl: url }); }} multiple={false} compact>
                      <div className="h-16 rounded-xl border border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group">
                        {biolinks.profileUrl ? (
                          <img src={biolinks.profileUrl} className="w-full h-full object-cover" />
                        ) : <Ico n="upload" s={14} c="text-slate-500" />}
                      </div>
                    </DropZone>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1">Cover (Portada)</span>
                    <DropZone onFiles={async f => { const url = await uploadToImgBB(f[0], biz.id); updateBiolinks({ coverUrl: url }); }} multiple={false} compact>
                      <div className="h-16 rounded-xl border border-dashed border-white/20 flex items-center justify-center relative overflow-hidden group">
                        {biolinks.coverUrl ? (
                          <img src={biolinks.coverUrl} className="w-full h-full object-cover" />
                        ) : <Ico n="upload" s={14} c="text-slate-500" />}
                      </div>
                    </DropZone>
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 border-b border-white/5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Estilos</p>
                
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-400">Color Primario</span>
                    <ColorPickerPopup color={biolinks.primaryColor} onChange={c => updateBiolinks({ primaryColor: c })} />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-slate-400">Color Secundario</span>
                    <ColorPickerPopup color={biolinks.secondaryColor} onChange={c => updateBiolinks({ secondaryColor: c })} />
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-[9px] text-slate-400 block mb-2">Fondo del Linktree</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: "color", label: "Colores" },
                      { val: "gradient", label: "Gradiente" },
                      { val: "dark", label: "Oscuro" },
                      { val: "light", label: "Claro" },
                      { val: "image", label: "Imagen" },
                      { val: "video", label: "Video" },
                    ].map(b => (
                      <button key={b.val} onClick={() => updateBiolinks({ backgroundType: b.val })}
                        className="py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                        style={biolinks.backgroundType === b.val ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.4)" } : { background: "rgba(0,0,0,0.2)", color: "#64748b", border: "1px solid rgba(255,255,255,0.05)" }}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                  {biolinks.backgroundType === "image" && (
                     <div className="mt-2">
                       <DropZone onFiles={async f => { const url = await uploadToImgBB(f[0], biz.id); updateBiolinks({ backgroundImageUrl: url }); }} multiple={false} compact>
                        <div className="h-10 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-xs text-slate-400 hover:text-white transition-colors">
                          {biolinks.backgroundImageUrl ? "Cambiar Imagen de Fondo" : "Subir Imagen de Fondo"}
                        </div>
                       </DropZone>
                     </div>
                  )}
                  {biolinks.backgroundType === "video" && (
                     <div className="mt-2">
                       <input value={biolinks.backgroundImageUrl || ""} placeholder="URL de Video (mp4)..."
                         onChange={e => updateBiolinks({ backgroundImageUrl: e.target.value })}
                         className="w-full px-3 py-2 rounded-xl text-xs text-white bg-black/20 border border-white/10 focus:border-indigo-500/50 focus:outline-none" />
                     </div>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-[9px] text-slate-400 block mb-2">Tipografía (Fuente)</span>
                  <select
                    value={biolinks.fontFamily || "Inter"}
                    onChange={e => updateBiolinks({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs text-white bg-black/20 border border-white/10 focus:border-indigo-500/50 focus:outline-none appearance-none"
                  >
                    <option value="Inter">Inter (Moderna)</option>
                    <option value="Roboto">Roboto (Clásica)</option>
                    <option value="Outfit">Outfit (Geométrica)</option>
                    <option value="Playfair">Playfair (Elegante/Serif)</option>
                    <option value="Space Grotesk">Space Grotesk (Tecnológica)</option>
                  </select>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <button onClick={() => updateBiolinks({ showPoweredBy: !(biolinks.showPoweredBy !== false) })}
                    className={`w-9 h-5 rounded-full relative transition-colors ${biolinks.showPoweredBy !== false ? 'bg-indigo-500' : 'bg-white/10'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${biolinks.showPoweredBy !== false ? 'left-[18px]' : 'left-1'}`} />
                  </button>
                  <span className="text-[10px] text-slate-300">Mostrar marca de agua "Powered by"</span>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 block mb-2">Forma de Botones</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: "rounded", label: "Curvos" },
                      { val: "square", label: "Cuadrados" },
                      { val: "pill", label: "Pastilla" },
                    ].map(b => (
                      <button key={b.val} onClick={() => updateBiolinks({ buttonStyle: b.val })}
                        className="py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                        style={biolinks.buttonStyle === b.val ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.4)" } : { background: "rgba(0,0,0,0.2)", color: "#64748b", border: "1px solid rgba(255,255,255,0.05)" }}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ENLACES ── */}
          {subTab === "enlaces" && (
            <div className="animate-fadeIn p-4 pb-12">
              <div className="space-y-3">
                {(biolinks.items || []).map((item: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl border border-white/10 relative group" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex gap-2">
                      {/* THUMBNAIL UPLOAD */}
                      <DropZone onFiles={async f => { const url = await uploadToImgBB(f[0], biz.id); const items = [...biolinks.items]; items[i] = { ...items[i], thumbnail: url }; updateBiolinks({ items }); }} multiple={false} compact>
                        <div className="w-10 h-10 rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden group bg-black/20 hover:bg-black/40 transition-colors cursor-pointer" title="Subir miniatura">
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
                            onChange={e => {
                              const items = [...biolinks.items];
                              items[i] = { ...items[i], icon: e.target.value };
                              updateBiolinks({ items });
                            }}
                            className="w-[90px] px-2 py-2 rounded-lg text-[10px] text-slate-200 bg-black/20 border border-white/5 focus:border-indigo-500/50 focus:outline-none appearance-none"
                          >
                            <option value="none">Sin Icono</option>
                            <option value="link">🔗 Link</option>
                            <option value="instagram">📷 Insta</option>
                            <option value="whatsapp">💬 Whats</option>
                            <option value="facebook">📘 Face</option>
                            <option value="tiktok">🎵 TikTok</option>
                            <option value="globe">🌐 Web</option>
                          </select>
                          <select
                            value={item.type || "link"}
                            onChange={e => {
                              const items = [...biolinks.items];
                              items[i] = { ...items[i], type: e.target.value };
                              updateBiolinks({ items });
                            }}
                            className="w-[85px] px-2 py-2 rounded-lg text-[10px] text-emerald-300 bg-emerald-900/20 border border-emerald-500/30 focus:outline-none appearance-none"
                          >
                            <option value="link">Normal</option>
                            <option value="spotify">Spotify</option>
                            <option value="youtube">YouTube</option>
                          </select>
                          <input value={item.label || ""} placeholder="Título (Ej: Mi Web)"
                            onChange={e => {
                              const items = [...biolinks.items];
                              items[i] = { ...items[i], label: e.target.value };
                              updateBiolinks({ items });
                            }}
                            className="flex-1 px-3 py-2 rounded-lg text-[11px] text-white bg-black/20 border border-white/5 focus:border-indigo-500/50 focus:outline-none" />
                        </div>
                        <div>
                          <input value={item.url || ""} placeholder="https://..."
                            onChange={e => {
                              const items = [...biolinks.items];
                              items[i] = { ...items[i], url: e.target.value };
                              updateBiolinks({ items });
                            }}
                            className="w-full px-3 py-2 rounded-lg text-[11px] text-indigo-300 bg-black/20 border border-white/5 focus:border-indigo-500/50 focus:outline-none" />
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={item.featured || false} onChange={e => {
                              const items = [...biolinks.items];
                              items[i] = { ...items[i], featured: e.target.checked };
                              updateBiolinks({ items });
                            }} className="rounded border-white/10 bg-black/20 text-indigo-500 focus:ring-0" />
                            <span className="text-[10px] text-amber-300 font-semibold">✨ Destacar Botón</span>
                          </label>

                          <div className="flex-1 flex gap-2">
                            <input type="date" value={item.activeFrom ? item.activeFrom.split('T')[0] : ""} onChange={e => {
                              const items = [...biolinks.items];
                              items[i] = { ...items[i], activeFrom: e.target.value ? new Date(e.target.value).toISOString() : null };
                              updateBiolinks({ items });
                            }} className="w-1/2 px-2 py-1 rounded text-[9px] text-slate-400 bg-black/20 border border-white/5" title="Mostrar desde (opcional)" />
                            <input type="date" value={item.activeUntil ? item.activeUntil.split('T')[0] : ""} onChange={e => {
                              const items = [...biolinks.items];
                              items[i] = { ...items[i], activeUntil: e.target.value ? new Date(e.target.value).toISOString() : null };
                              updateBiolinks({ items });
                            }} className="w-1/2 px-2 py-1 rounded text-[9px] text-slate-400 bg-black/20 border border-white/5" title="Ocultar después de (opcional)" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => {
                      const items = biolinks.items.filter((_: any, idx: number) => idx !== i);
                      updateBiolinks({ items });
                    }} className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors">
                      <Ico n="trash" s={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => {
                  const items = [...(biolinks.items || []), { id: Date.now().toString(), label: "Nuevo botón", url: "https://" }];
                  updateBiolinks({ items });
                }} className="w-full py-3 mt-2 rounded-xl text-xs font-bold text-indigo-400 hover:text-white transition-colors"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.3)" }}>
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
          <button onClick={copyUrl} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-semibold transition-all shadow-xl">
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
            {/* The actual Biolinks Preview rendered using the exact same component as the public page */}
            <PremiumLinks 
              negocio={{
                ...biz, 
                layoutConfig: { 
                  ...biz?.layoutConfig, 
                  biolinks: biolinks 
                } 
              }} 
              isPreview={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


