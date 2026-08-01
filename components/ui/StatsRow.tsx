"use client";

import React from "react";

interface StatItem {
  value: string;
  label: string;
}

interface StatsRowProps {
  stats: StatItem[];
  theme?: "light" | "dark";
  className?: string;
}

export default function StatsRow({ stats, theme = "light", className = "" }: StatsRowProps) {
  const isDark = theme === "dark";

  if (!stats || stats.length === 0) return null;

  return (
    <div className={`inline-flex items-center rounded-sm overflow-hidden backdrop-blur-md ${isDark ? "bg-white/5 border border-white/10" : "bg-white/65 border border-black/5 shadow-sm"} ${className}`}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`px-6 sm:px-10 py-4 text-center ${
            i > 0 ? (isDark ? "border-l border-white/10" : "border-l border-black/5") : ""
          }`}
        >
          <div className="font-['Playfair_Display',serif] text-xl md:text-2xl font-bold text-[var(--accent)]">
            {s.value}
          </div>
          <div className={`text-[10px] uppercase tracking-wider mt-1 font-semibold ${isDark ? "text-white/50" : "text-gray-500"}`}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
