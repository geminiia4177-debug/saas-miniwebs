"use client";

import React from "react";
import Image from "next/image";
import { Ico } from "@/lib/constants";

function formatExternalUrl(url?: string): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (!trimmed) return "#";
  if (/^(https?:\/\/|mailto:|tel:|#)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function LinkButton({
  item,
  primaryColor,
  buttonStyle,
  textColor,
  businessId,
}: {
  item: any;
  primaryColor?: string;
  buttonStyle?: string;
  textColor: string;
  businessId: string;
}) {
  // PR-4: Scheduled links check
  const now = new Date();
  if (item.activeFrom && new Date(item.activeFrom) > now) return null;
  if (item.activeUntil && new Date(item.activeUntil) < now) return null;

  const btnClass =
    buttonStyle === "pill" ? "rounded-full" : buttonStyle === "square" ? "rounded-md" : "rounded-xl";

  const isDarkText = textColor === "#0f172a";
  const defaultColor = primaryColor || "#4f46e5";

  // PR-5: Analytics track
  const handleClick = () => {
    if (item.id && businessId) {
      fetch('/api/biolinks/click', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId: item.id, businessId }),
      }).catch(e => console.error(e));
    }
  };

  // PR-3: Embed logic
  if (item.type === "spotify") {
    let spotifyEmbedUrl = item.url;
    // Basic conversion if they paste standard url
    if (spotifyEmbedUrl && !spotifyEmbedUrl.includes("/embed/")) {
      spotifyEmbedUrl = spotifyEmbedUrl.replace("spotify.com/", "spotify.com/embed/");
    }
    return (
      <div className="w-full relative animate-slideUp motion-reduce:animate-none">
        <iframe 
          style={{ borderRadius: buttonStyle === "square" ? "8px" : "12px" }}
          src={spotifyEmbedUrl} 
          width="100%" 
          height="152" 
          frameBorder="0" 
          allowFullScreen 
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
          loading="lazy"
        ></iframe>
      </div>
    );
  }

  if (item.type === "youtube") {
    // Convert to embed url
    let youtubeId = "";
    if (item.url) {
      const match = item.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
      if (match && match[1]) youtubeId = match[1];
    }

    if (youtubeId) {
      return (
        <div className={`w-full relative overflow-hidden animate-slideUp motion-reduce:animate-none ${btnClass}`} style={{ paddingBottom: "56.25%", height: 0 }}>
          <iframe 
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeId}`} 
            title={item.label}
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      );
    }
  }

  return (
    <a
      href={formatExternalUrl(item.url)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.label}
      onClick={handleClick}
      className={`w-full relative overflow-hidden group transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] 
        hover:scale-[1.02] active:scale-95 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${item.featured ? "scale-[1.02] shadow-lg border animate-pulse-slow ring-1 ring-white/20" : "border"} ${btnClass}`}
      style={{
        background: isDarkText ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.12)",
        borderColor: item.featured ? defaultColor : isDarkText ? "rgba(0,0,0,0.15)" : "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: isDarkText ? "0 4px 30px rgba(0, 0, 0, 0.05)" : "0 4px 30px rgba(0, 0, 0, 0.1)",
        color: textColor,
      }}
    >
      {/* Button Hover Gradient (Shimmer effect) */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] motion-reduce:transition-none motion-reduce:opacity-0"
        style={{ background: `linear-gradient(110deg, transparent 20%, ${defaultColor}40 40%, ${defaultColor}40 60%, transparent 80%)` }}
      />
      
      <div className="px-5 py-4 flex items-center justify-between relative z-10 w-full">
        <div className="w-11 flex items-center justify-center shrink-0">
          {item.thumbnail ? (
            <div className="relative w-11 h-11 rounded-full overflow-hidden border border-black/10 shadow-sm transition-transform group-hover:scale-110 duration-500">
              <Image src={item.thumbnail} alt="" fill className="object-cover" sizes="44px" />
            </div>
          ) : item.icon && item.icon !== "none" ? (
            <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${isDarkText ? "bg-black/5" : "bg-white/10"}`}>
              <Ico n={item.icon} s={20} c="currentColor" />
            </div>
          ) : (
            <div className="w-11 h-11" />
          )}
        </div>
        
        <span className="font-semibold tracking-wide text-[15px] flex-1 text-center px-4 leading-snug drop-shadow-sm">
          {item.label}
        </span>
        
        <div className="w-11 flex justify-end shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isDarkText ? "group-hover:bg-black/5" : "group-hover:bg-white/10"}`}>
            <Ico
              n="chevronUp"
              s={18}
              style={{ transform: "rotate(90deg)" }}
              c="opacity-60 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </a>
  );
}
