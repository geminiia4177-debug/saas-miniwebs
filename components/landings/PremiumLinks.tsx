"use client";

import React from "react";
import { Biz } from "@/lib/constants";
import BackgroundLayer from "./biolinks/BackgroundLayer";
import ProfileHeader from "./biolinks/ProfileHeader";
import LinkButton from "./biolinks/LinkButton";
import VCardShare from "./biolinks/VCardShare";
import { getTextColor } from "./biolinks/utils";
import { getFontClass } from "./biolinks/fonts";
import { parseBiolinksConfig } from "./biolinks/schema";

export default function PremiumLinks({ negocio, isPreview = false }: { negocio: Biz, isPreview?: boolean }) {
  const rawConfig = negocio.layoutConfig?.biolinks;

  if (!rawConfig || (!rawConfig.active && !isPreview)) return null;

  // AR-3: Zod validation with safe defaults
  const config = parseBiolinksConfig(rawConfig);

  const {
    title,
    subtitle,
    items,
    coverUrl,
    profileUrl,
    backgroundType = "dark",
    backgroundImageUrl,
    buttonStyle = "rounded",
    primaryColor,
    secondaryColor,
    socialPosition = "top",
  } = config;

  const textColor = getTextColor(config);
  const fontClass = getFontClass(config.fontFamily);

  return (
    <div
      className={`relative z-0 isolate min-h-full h-full w-full overflow-hidden selection:bg-indigo-500/30 ${fontClass}`}
      style={{
        // Dynamically set CSS variables so children could use them if needed
        "--primary": primaryColor || "#4f46e5",
        "--secondary": secondaryColor || "#6366f1",
      } as React.CSSProperties}
    >
      <BackgroundLayer
        backgroundType={backgroundType as any}
        backgroundImageUrl={backgroundImageUrl || undefined}
        primaryColor={primaryColor || undefined}
        secondaryColor={secondaryColor || undefined}
      />

      {/* Scrollable Overlay */}
      <div className="absolute inset-0 w-full h-full overflow-x-hidden overflow-y-auto custom-scrollbar flex flex-col items-center p-0">
        {/* Main Content Wrapper */}
        <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col min-h-full pb-12 animate-slideUp motion-reduce:animate-none">
          
          <ProfileHeader
            coverUrl={coverUrl || undefined}
            profileUrl={profileUrl || undefined}
            title={title || undefined}
            subtitle={subtitle || undefined}
            primaryColor={primaryColor || undefined}
            secondaryColor={secondaryColor || undefined}
            titleColor={config.titleColor || undefined}
            textColor={textColor}
            negocioName={negocio.name}
          />

        {/* Content Body */}
        <div className="flex-1 w-full px-6 flex flex-col items-center">
          
          <VCardShare negocio={negocio} primaryColor={primaryColor || undefined} textColor={textColor} />

          {/* Links List */}
          <div className="w-full flex flex-col gap-4 mb-10">
            {(items || []).map((item: any, i: number) => (
              <LinkButton
                key={item.id || i}
                item={item}
                primaryColor={primaryColor || undefined}
                buttonStyle={buttonStyle}
                textColor={textColor}
                businessId={negocio.id}
              />
            ))}
          </div>

        </div>
        
        {/* Footer */}
        {config.showPoweredBy !== false && (
          <footer className="w-full py-8 text-center opacity-60">
            <p className="text-xs font-medium tracking-wide" style={{ color: textColor }}>
              Powered by <span className="font-bold">SaaS Miniwebs</span>
            </p>
          </footer>
        )}
      </div>
      </div>

      <style>{`
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(20px) } 
          to { opacity: 1; transform: translateY(0) } 
        }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1.02); }
          50% { opacity: 0.95; transform: scale(1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
