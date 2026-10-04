import React from "react";
import { BusinessHero, BusinessContact } from "@/lib/templates/contract";
import { ArrowRight, Sparkles, MessageCircle, Calendar } from "lucide-react";

export interface HeroBlockProps {
  hero: BusinessHero;
  contact?: BusinessContact;
  primaryColor?: string;
  variant?: "centered" | "split" | "minimal";
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export const HeroBlock: React.FC<HeroBlockProps> = ({
  hero,
  contact,
  primaryColor = "#6366F1",
  variant = "split",
  onPrimaryClick,
  onSecondaryClick,
}) => {
  const whatsappUrl = contact?.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`
    : null;

  if (variant === "centered") {
    return (
      <section className="relative overflow-hidden py-20 sm:py-32 px-4 sm:px-6 lg:px-8 text-center">
        {hero.image && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
            style={{ backgroundImage: `url(${hero.image})` }}
          />
        )}
        <div className="relative max-w-4xl mx-auto space-y-6">
          {hero.badge && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              {hero.badge}
            </span>
          )}
          <h1
            className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight"
            style={{ color: hero.titleColor || undefined }}
          >
            {hero.title}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {hero.subtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={onPrimaryClick}
              className="px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              style={{ background: primaryColor }}
            >
              <span>{hero.ctaText || "Reservar Turno"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Split layout (Default)
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-white/5">
      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          {hero.badge && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10">
              <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              {hero.badge}
            </span>
          )}
          <h1
            className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight"
            style={{ color: hero.titleColor || undefined }}
          >
            {hero.title}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            {hero.subtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              type="button"
              onClick={onPrimaryClick}
              className="px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              style={{ background: primaryColor }}
            >
              <Calendar className="w-4 h-4" />
              <span>{hero.ctaText || "Reservar Turno"}</span>
            </button>
            {hero.ctaSecondary && (
              <button
                type="button"
                onClick={onSecondaryClick}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 transition-all cursor-pointer"
              >
                {hero.ctaSecondary}
              </button>
            )}
          </div>
        </div>

        {hero.image && (
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-4/3 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={hero.image}
                alt={hero.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
