import React, { useState, useRef, useCallback } from "react";
import { Ico } from "@/lib/constants";

export const DropZone = ({
  onFiles,
  accept = "image/*",
  multiple = true,
  children,
  compact = false,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  children?: React.ReactNode;
  compact?: boolean;
}) => {
  const [hovering, setHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setHovering(false);
    const files = Array.from(e.dataTransfer.files).filter(f => {
      if (accept === "image/*") return f.type.startsWith("image/");
      return true;
    });
    if (files.length) onFiles(files);
  }, [onFiles, accept]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setHovering(true); }}
      onDragLeave={() => setHovering(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer transition-all duration-200 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 group ${compact ? "p-3" : "p-8"}`}
      style={{
        borderColor: hovering ? "rgba(99,102,241,0.7)" : "rgba(255,255,255,0.1)",
        background: hovering ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
      }}
    >
      <input
        ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      {children || (
        <>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors"
            style={{ background: hovering ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)" }}>
            <Ico n="upload" s={24} c={hovering ? "text-indigo-400" : "text-slate-500"} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">Arrastrá imágenes aquí</p>
            <p className="text-xs text-slate-500 mt-0.5">o hacé click para seleccionar</p>
          </div>
          <p className="text-[10px] text-slate-600">PNG, JPG, WebP — máx. 5 MB c/u</p>
        </>
      )}
    </div>
  );
};
