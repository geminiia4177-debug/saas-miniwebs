"use client";

import React from "react";

interface SectionHeaderProps {
  overline?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  theme?: "light" | "dark";
  className?: string;
}

export default function SectionHeader({
  overline,
  title,
  description,
  align = "center",
  theme = "light",
  className = "",
}: SectionHeaderProps) {
  const isDark = theme === "dark";
  
  return (
    <div className={`mb-12 ${align === "center" ? "text-center" : "text-left"} ${className}`}>
      {overline && (
        <p className={`text-[10px] tracking-[0.25em] uppercase font-bold mb-3 text-[var(--accent)]`}>
          {overline}
        </p>
      )}
      <h2 className={`font-['Playfair_Display',serif] text-3xl md:text-5xl font-bold leading-tight mb-4 ${isDark ? "text-white" : "text-[#1C1410]"}`}>
        {title}
      </h2>
      {description && (
        <p className={`max-w-2xl text-sm md:text-base leading-relaxed ${align === "center" ? "mx-auto" : ""} ${isDark ? "text-white/60" : "text-[#8B7355]"}`}>
          {description}
        </p>
      )}
    </div>
  );
}
