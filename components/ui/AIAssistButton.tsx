"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Check, RefreshCw, X } from "lucide-react";

export interface AIAssistButtonProps {
  businessId: string;
  fieldType: "heroTitle" | "heroSubtitle" | "description" | "service" | "tagline";
  currentText?: string;
  context?: string;
  onSelect: (suggestedText: string) => void;
  className?: string;
  compact?: boolean;
}

export const AIAssistButton: React.FC<AIAssistButtonProps> = ({
  businessId,
  fieldType,
  currentText = "",
  context = "",
  onSelect,
  className = "",
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intelligence/copywriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          fieldType,
          currentText,
          context,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudieron obtener sugerencias");
      }
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      setError(err.message || "Error al conectar con la IA");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (suggestions.length === 0) {
        fetchSuggestions();
      }
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      <button
        type="button"
        onClick={handleToggle}
        title="Mejorar redacción con IA"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
          isOpen
            ? "bg-accent text-white border-accent shadow-sm"
            : "bg-surface-2 hover:bg-surface-3 text-fg-muted hover:text-accent border-border-default hover:border-accent/40"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 text-accent" />
        {!compact && <span>Mejorar con IA</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[295px] sm:w-[320px] max-w-[calc(100vw-2.5rem)] rounded-2xl bg-surface-1 border border-border-strong p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-fg">Sugerencias con IA</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={fetchSuggestions}
                disabled={loading}
                title="Generar nuevas opciones"
                className="p-1 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-2.5 space-y-2">
            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-fg-muted">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
                <span className="text-xs">Redactando sugerencias con IA...</span>
              </div>
            ) : error ? (
              <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger break-words">
                {error}
              </div>
            ) : (
              suggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelect(sug);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-surface-2 hover:bg-accent/10 border border-border-subtle hover:border-accent/40 transition-all text-xs text-fg group flex items-start justify-between gap-2.5 cursor-pointer"
                >
                  <span className="leading-relaxed flex-1 text-[11px]">{sug}</span>
                  <span className="text-[10px] font-bold text-accent opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 pt-0.5 transition-opacity">
                    <Check className="w-3 h-3" />
                    <span>Usar</span>
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] text-fg-subtle">
            <span className="truncate">⚡ Asistente de IA Activo</span>
            <span className="shrink-0">Clic para aplicar</span>
          </div>
        </div>
      )}
    </div>
  );
};
