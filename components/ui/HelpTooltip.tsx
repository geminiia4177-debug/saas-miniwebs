"use client";

import React, { useState, useRef, useEffect } from "react";
import { Ico } from "@/lib/constants";

interface HelpTooltipProps {
  title: string;
  description: string;
  tip?: string;
  className?: string;
  size?: number;
}

export default function HelpTooltip({
  title,
  description,
  tip,
  className = "",
  size = 14,
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative inline-flex items-center align-middle ${className}`} ref={popoverRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="w-5 h-5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-400 hover:text-indigo-300 flex items-center justify-center transition-all border border-indigo-500/25 hover:border-indigo-500/50 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        title="¿Qué es esto? Clic para ver explicación"
        aria-label={`Ayuda: ${title}`}
      >
        <span className="text-[11px] font-bold leading-none select-none">?</span>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 max-w-[calc(100vw-2rem)] p-3.5 rounded-2xl bg-[#0f172a]/95 border border-indigo-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl text-left animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 rotate-45 bg-[#0f172a] border-r border-b border-indigo-500/30" />

          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              {title}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <Ico n="x" s={12} />
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {description}
          </p>

          {tip && (
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-start gap-1.5 text-[10px] text-indigo-300 bg-indigo-500/10 -mx-1 px-2 py-1.5 rounded-lg">
              <span className="font-bold shrink-0">💡 Tip:</span>
              <span className="leading-snug">{tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
