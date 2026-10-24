"use client";

import React, { useState } from "react";
import { Biz } from "@/lib/constants";
import BackgroundLayer from "./biolinks/BackgroundLayer";
import ProfileHeader from "./biolinks/ProfileHeader";
import LinkButton from "./biolinks/LinkButton";
import VCardShare from "./biolinks/VCardShare";
import SocialBar from "./biolinks/SocialBar";
import { getTextColor } from "./biolinks/utils";
import { getFontClass } from "./biolinks/fonts";
import { parseBiolinksConfig } from "./biolinks/schema";
import { MessageCircle, Sparkles, ChevronDown, ChevronUp, Share2, Flame } from "lucide-react";

export default function PremiumLinks({ negocio, isPreview = false }: { negocio: Biz, isPreview?: boolean }) {
  const [showCatalog, setShowCatalog] = useState(false);
  const [sharedToast, setSharedToast] = useState(false);

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
  const phoneClean = (negocio.whatsapp || negocio.phone || "").replace(/\D/g, "");
  const services = (negocio.layoutConfig?.services || negocio.layoutConfig?.barberiaServices || []).slice(0, 3);

  const handleShare = async () => {
    const shareData = {
      title: negocio.name,
      text: `¡Mira los servicios de ${negocio.name}! Puedes agendar directo por WhatsApp aquí:`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 3000);
    }
  };

  return (
    <div
      className={`relative z-0 isolate min-h-[100dvh] h-[100dvh] w-full overflow-hidden selection:bg-indigo-500/30 ${fontClass}`}
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

      {/* Scrollable Overlay (100dvh dynamic viewport for iOS Safari) */}
      <div className="absolute inset-0 w-full h-full overflow-x-hidden overflow-y-auto custom-scrollbar flex flex-col items-center p-0">
        {/* Main Content Wrapper with safe-area-inset-bottom */}
        <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col min-h-full pb-[calc(3rem+env(safe-area-inset-bottom,0px))] animate-slideUp motion-reduce:animate-none">
          
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
          
          {/* ─── LIVE SOCIAL PROOF PILL ─── */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4 shadow-sm backdrop-blur-sm animate-pulse-slow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>🔥 28 personas agendaron esta semana</span>
            <span className="opacity-40">•</span>
            <span className="text-[11px] text-emerald-300 font-medium">🟢 Abierto hoy</span>
          </div>

          {/* ─── HERO PRIMARY WHATSAPP CTA ─── */}
          {phoneClean && (
            <a
              href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(`¡Hola ${negocio.name}! Vi su enlace en BioLinks y quiero agendar una cita.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 mb-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-110 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 group border border-emerald-400/30"
            >
              <MessageCircle className="w-5 h-5 fill-white shrink-0 group-hover:rotate-12 transition-transform" />
              <span>Agendar Cita por WhatsApp</span>
              <span className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold ml-1">1-Tap</span>
            </a>
          )}

          {/* ─── MICRO-CATÁLOGO DESPLEGABLE (ACCORDION) ─── */}
          {services.length > 0 && (
            <div className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden transition-all duration-300">
              <button
                type="button"
                onClick={() => setShowCatalog(!showCatalog)}
                className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold tracking-wide transition-colors hover:bg-white/5"
                style={{ color: textColor }}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Ver Servicios Destacados & Precios</span>
                </span>
                {showCatalog ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
              </button>
              {showCatalog && (
                <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5 border-t border-white/10 animate-fadeIn">
                  {services.map((s: any, idx: number) => (
                    <div
                      key={s.id || idx}
                      className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-white text-xs">{s.name}</p>
                        {s.price && <p className="text-emerald-400 font-extrabold">${s.price} MXN</p>}
                      </div>
                      {phoneClean && (
                        <a
                          href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(`Hola, quiero agendar el servicio: ${s.name}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[11px] shrink-0"
                        >
                          Agendar
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── BOTÓN VIRAL DE RECOMENDACIÓN NATIVO ─── */}
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-2.5 px-4 mb-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ color: textColor }}
          >
            <Share2 className="w-3.5 h-3.5 text-pink-400" />
            <span>{sharedToast ? "¡Enlace copiado al portapapeles! 🎉" : "Recomendar a un amigo (WhatsApp)"}</span>
          </button>

          <VCardShare negocio={negocio} primaryColor={primaryColor || undefined} textColor={textColor} />

          {/* Social Bar (Top) */}
          <SocialBar
            negocio={negocio}
            textColor={textColor}
            position="top"
            configuredPosition={socialPosition as any}
          />

          {/* Links List */}
          <div className="w-full flex flex-col gap-4 mb-6">
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

          {/* Social Bar (Bottom) */}
          <SocialBar
            negocio={negocio}
            textColor={textColor}
            position="bottom"
            configuredPosition={socialPosition as any}
          />

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
