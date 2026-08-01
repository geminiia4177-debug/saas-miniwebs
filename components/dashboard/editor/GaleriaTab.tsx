import React, { useRef, useState } from "react";
import { MediaItem } from "@/lib/types";
import { Ico } from "@/lib/constants";
import { DropZone } from "./DropZone";
import { uploadToImgBB } from "@/lib/utils/upload";

export const GaleriaTab = ({
  media,
  setMedia,
  showToast,
}: {
  media: MediaItem[];
  setMedia: (fn: (prev: MediaItem[]) => MediaItem[]) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}) => {
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const dragFromRef = useRef<{ idx: number } | null>(null);

  const galleryImages = media.filter(m => m.type === "image" || (!m.type && m.url));

  const uploadGalleryImages = async (files: File[]) => {
    setUploadingGallery(true);
    showToast(`Subiendo ${files.length} imagen(es)...`, "info");
    let ok = 0;
    for (const file of files) {
      try {
        const url = await uploadToImgBB(file);
        setMedia(prev => [...prev, { id: `img_${Date.now()}_${Math.random()}`, url, type: "image", name: file.name }]);
        ok++;
      } catch {
        showToast("Error al subir una imagen", "error");
      }
    }
    if (ok > 0) showToast(`${ok} imagen(es) subida(s) ✓`, "success");
    setUploadingGallery(false);
  };

  const removeGalleryImage = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const moveGalleryImage = (from: number, to: number) => {
    const itemToMove = galleryImages[from];
    if (!itemToMove) return;
    
    const fromIdx = media.findIndex(m => m.id === itemToMove.id);
    const targetItem = galleryImages[to];
    const toIdx = targetItem ? media.findIndex(m => m.id === targetItem.id) : media.length;
    
    if (fromIdx === -1 || toIdx === -1) return;

    setMedia(prev => {
      const current = [...prev];
      const [removed] = current.splice(fromIdx, 1);
      current.splice(toIdx, 0, removed);
      return current;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Galería</p>
        <span className="text-[10px] text-slate-600">{galleryImages.length} imagen(es)</span>
      </div>

      <DropZone onFiles={uploadGalleryImages} multiple accept="image/*">
        {uploadingGallery ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Ico n="loader" s={20} c="text-indigo-400 animate-spin" />
            <span className="text-sm text-white">Subiendo imágenes...</span>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-500/10">
              <svg width="24" height="24" fill="none" stroke="#818cf8" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Subir fotos del trabajo</p>
              <p className="text-xs text-slate-500 mt-0.5">o hacé click para seleccionar</p>
            </div>
            <p className="text-[10px] text-slate-600">Se mostrarán en un carrusel</p>
          </>
        )}
      </DropZone>

      {galleryImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-bold text-slate-600 uppercase">Orden del carrusel — arrastrá para reordenar</p>
          {galleryImages.map((img, i) => (
            <div
              key={img.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", i.toString());
                dragFromRef.current = { idx: i };
              }}
              onDragEnter={e => e.preventDefault()}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFromRef.current !== null) {
                  moveGalleryImage(dragFromRef.current.idx, i);
                }
                dragFromRef.current = null;
              }}
              className="flex items-center gap-3 p-2.5 rounded-xl cursor-grab"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span className="text-slate-600">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M4 8h16M4 16h16"/>
                </svg>
              </span>
              <span className="text-slate-500 text-xs font-bold w-5">{i + 1}</span>
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img src={img.url} alt={`Foto ${i+1}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/60 truncate">{img.url?.split("/").pop() || `Foto ${i+1}`}</p>
              </div>
              <button
                onClick={() => removeGalleryImage(img.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Ico n="trash" s={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
