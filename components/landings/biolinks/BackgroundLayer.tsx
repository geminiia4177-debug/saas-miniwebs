"use client";

import React from "react";

export default function BackgroundLayer({
  backgroundType,
  backgroundImageUrl,
  primaryColor,
  secondaryColor,
}: {
  backgroundType: "dark" | "image" | "gradient" | "light" | "video";
  backgroundImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const pColor = primaryColor || "#1e1b4b";
  const sColor = secondaryColor || "#312e81";

  return (
    <>
      {/* Base Background */}
      <div
        className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none"
        style={{
          background:
            backgroundType === "dark"
              ? "#050810"
              : backgroundType === "light"
              ? "#f8fafc"
              : backgroundType === "image" && backgroundImageUrl
              ? `url(${backgroundImageUrl}) center/cover no-repeat`
              : backgroundType === "gradient"
              ? `linear-gradient(135deg, ${pColor} 0%, ${sColor} 100%)`
              : pColor, // "color" or fallback
        }}
      >
        {/* If background is video, handle both direct mp4 and YouTube */}
        {backgroundType === "video" && backgroundImageUrl && (
          backgroundImageUrl.includes("youtube.com") || backgroundImageUrl.includes("youtu.be") ? (
            <iframe
              className="absolute top-1/2 left-1/2 w-[300vw] h-[300vh] min-w-[100vw] min-h-[100vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ border: 0 }}
              src={`https://www.youtube.com/embed/${
                backgroundImageUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]
              }?autoplay=1&mute=1&controls=0&loop=1&playlist=${
                backgroundImageUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]
              }&playsinline=1&rel=0`}
              allow="autoplay; encrypted-media"
            />
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover pointer-events-none"
              src={backgroundImageUrl}
            />
          )
        )}
      </div>

      {/* Overlays for contrast and texture */}
      {(backgroundType === "image" || backgroundType === "video") && (
        <div className="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-md z-0 pointer-events-none" />
      )}

      {/* Noise / Grain overlay for gradient and dark modes (Premium Texture) */}
      {(backgroundType === "gradient" || backgroundType === "dark") && (
        <div
          className="absolute inset-0 w-full h-full opacity-30 pointer-events-none z-0 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </>
  );
}
