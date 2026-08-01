"use client";

import React from "react";
import { Ico } from "@/lib/constants";

function formatSocialUrl(platform: "instagram" | "tiktok" | "facebook", handleOrUrl?: string | null): string {
  if (!handleOrUrl) return "#";
  const trimmed = handleOrUrl.trim();
  if (!trimmed) return "#";
  
  if (trimmed.includes(".com") || trimmed.includes("http://") || trimmed.includes("https://")) {
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  const cleanHandle = trimmed.replace("@", "");
  
  switch (platform) {
    case "instagram":
      return `https://instagram.com/${cleanHandle}`;
    case "tiktok":
      return `https://tiktok.com/@${cleanHandle}`;
    case "facebook":
      return `https://facebook.com/${cleanHandle}`;
    default:
      return `https://${trimmed}`;
  }
}

export default function SocialBar({
  negocio,
  textColor,
  position,
  configuredPosition = "top",
}: {
  negocio: {
    instagram?: string | null;
    whatsapp?: string | null;
    tiktok?: string | null;
    facebook?: string | null;
  };
  textColor: string;
  position: "top" | "bottom";
  configuredPosition?: "top" | "bottom";
}) {
  if (position !== configuredPosition) return null;

  const hasSocials = negocio.instagram || negocio.whatsapp || negocio.tiktok || negocio.facebook;
  if (!hasSocials) return null;

  const isDarkText = textColor === "#0f172a";

  const btnClass = `w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg border backdrop-blur-sm ${
    isDarkText
      ? "bg-black/5 hover:bg-black/10 text-slate-800 border-black/10"
      : "bg-white/10 hover:bg-white/20 text-white border-white/10"
  }`;

  return (
    <div className={`flex items-center justify-center gap-4 ${position === "top" ? "mb-8" : "mt-8"}`}>
      {negocio.instagram && (
        <a href={formatSocialUrl("instagram", negocio.instagram)} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="Instagram">
          <Ico n="instagram" s={20} />
        </a>
      )}
      {negocio.whatsapp && (
        <a href={`https://wa.me/${String(negocio.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="WhatsApp">
          <Ico n="whatsapp" s={20} />
        </a>
      )}
      {negocio.tiktok && (
        <a href={formatSocialUrl("tiktok", negocio.tiktok)} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="TikTok">
          <Ico n="tiktok" s={20} />
        </a>
      )}
      {negocio.facebook && (
        <a href={formatSocialUrl("facebook", negocio.facebook)} target="_blank" rel="noopener noreferrer" className={btnClass} aria-label="Facebook">
          <Ico n="facebook" s={20} />
        </a>
      )}
    </div>
  );
}
