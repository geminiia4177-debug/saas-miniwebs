"use client";

import React, { useState } from "react";

export function extractYouTubeId(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  
  // Handles youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/..., youtube.com/shorts/...
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+?&v=))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) return match[1];
  
  const fallback = trimmed.match(/[?&]v=([^&#\s]+)/);
  if (fallback && fallback[1] && fallback[1].length === 11) return fallback[1];

  return "";
}

interface VideoSectionProps {
  videoUrl?: string | null;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  theme?: "dark" | "light";
  className?: string;
}

export default function VideoSection({
  videoUrl,
  title = "Conocenos en Video",
  subtitle = "Descubre nuestras instalaciones y servicios",
  accentColor = "#6366f1",
  theme = "dark",
  className = "",
}: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = extractYouTubeId(videoUrl);

  if (!videoId) return null;

  const isDark = theme === "dark";

  return (
    <section className={`py-16 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto w-full relative z-10 ${className}`}>
      <div className="text-center mb-8">
        {subtitle && (
          <p
            className="text-xs uppercase tracking-widest font-bold mb-2"
            style={{ color: accentColor }}
          >
            {subtitle}
          </p>
        )}
        <h2
          className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          {title}
        </h2>
      </div>

      <div
        className="aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-2xl transition-all duration-300 group"
        style={{
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
          boxShadow: `0 20px 50px -10px ${accentColor}25`,
          backgroundColor: isDark ? "#0a0a0a" : "#f1f5f9",
        }}
      >
        {!isPlaying ? (
          <div
            onClick={() => setIsPlaying(true)}
            className="w-full h-full cursor-pointer relative flex items-center justify-center group"
          >
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt="Video Thumbnail"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // Fallback to hqdefault if maxresdefault doesn't exist
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors flex items-center justify-center">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center pl-1 shadow-2xl transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: accentColor, color: "#fff" }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        )}
      </div>
    </section>
  );
}
