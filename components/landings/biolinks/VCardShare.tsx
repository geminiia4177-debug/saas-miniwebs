"use client";

import React from "react";
import { Ico } from "@/lib/constants";

export default function VCardShare({
  negocio,
  primaryColor,
  textColor,
}: {
  negocio: any;
  primaryColor?: string;
  textColor: string;
}) {
  const isDarkText = textColor === "#0f172a";
  const defaultColor = primaryColor || "#4f46e5";

  const handleShare = async () => {
    const shareData = {
      title: negocio.name,
      text: `Mira los enlaces de ${negocio.name}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado al portapapeles");
    }
  };

  const handleVCard = () => {
    const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${negocio.name}
ORG:${negocio.name}
TEL;TYPE=WORK,VOICE:${negocio.phone || negocio.whatsapp || ""}
EMAIL;TYPE=WORK:${negocio.email || ""}
URL:${window.location.href}
END:VCARD`;

    const blob = new Blob([vCardData], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${negocio.name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-3 mb-8 w-full justify-center">
      <button
        onClick={handleVCard}
        className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95 shadow-md border"
        style={{
          background: isDarkText ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)",
          borderColor: isDarkText ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)",
          color: textColor,
          backdropFilter: "blur(8px)",
        }}
      >
        <Ico n="userPlus" s={16} />
        Guardar Contacto
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95 shadow-md border"
        style={{
          background: defaultColor,
          borderColor: "transparent",
          color: "#ffffff",
        }}
      >
        <Ico n="share" s={16} />
        Compartir
      </button>
    </div>
  );
}
