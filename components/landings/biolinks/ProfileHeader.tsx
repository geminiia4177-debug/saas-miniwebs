"use client";

import React from "react";
import Image from "next/image";

export default function ProfileHeader({
  coverUrl,
  profileUrl,
  title,
  subtitle,
  primaryColor,
  secondaryColor,
  titleColor,
  textColor,
  negocioName,
}: {
  coverUrl?: string;
  profileUrl?: string;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  titleColor?: string;
  textColor: string;
  negocioName: string;
}) {
  const pColor = primaryColor || "#4f46e5";
  const sColor = secondaryColor || "#6366f1";

  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Cover Image */}
      {coverUrl && (
        <div className="w-full h-40 md:h-48 relative">
          <Image src={coverUrl} alt="Cover" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 500px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col items-center w-full mt-8 mb-6 z-10 px-6 relative">
        {profileUrl && (
          <div className={`relative mb-5 ${coverUrl ? "-mt-24" : ""}`}>
            {/* Glowing background aura */}
            <div 
              className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse-slow motion-reduce:animate-none"
              style={{ background: pColor, transform: 'scale(1.2)' }}
            />
            
            {/* Animated Conic Ring (Premium feature) */}
            <div
              className="absolute inset-0 rounded-full animate-spin-slow motion-reduce:animate-none"
              style={{
                background: `conic-gradient(from 0deg, ${pColor}, ${sColor}, ${pColor})`,
                margin: "-4px",
                zIndex: -1,
                opacity: 0.9,
              }}
            />
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/90 dark:border-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <Image src={profileUrl} alt={title || negocioName} fill className="object-cover" priority sizes="128px" />
            </div>
          </div>
        )}

        <h1 
          className="text-2xl md:text-3xl font-extrabold text-center tracking-tight mb-2 drop-shadow-sm" 
          style={{ color: titleColor || textColor }}
        >
          {title || negocioName}
        </h1>
        
        {subtitle && (
          <p 
            className="text-sm md:text-base text-center font-medium opacity-90 max-w-sm drop-shadow-sm" 
            style={{ color: titleColor || textColor }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
