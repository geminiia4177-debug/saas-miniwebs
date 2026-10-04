"use client";

import React, { useMemo } from "react";
import { ArrowRight, MessageCircle, Calendar } from "lucide-react";
import { getScheduleStatus, BusinessHours } from "@/lib/utils/schedule";

export interface CTABlockProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  whatsapp?: string;
  primaryColor?: string;
  hours?: BusinessHours;
  onBookingClick?: () => void;
}

export const CTABlock: React.FC<CTABlockProps> = ({
  title = "¿Listo para reservar tu experiencia?",
  subtitle = "Comunícate directamente por WhatsApp o solicita tu turno en pocos pasos de forma online.",
  ctaText,
  whatsapp,
  primaryColor = "#6366F1",
  hours,
  onBookingClick,
}) => {
  const cleanPhone = whatsapp ? whatsapp.replace(/\D/g, "") : null;

  const schedule = useMemo(() => {
    return hours ? getScheduleStatus(hours) : null;
  }, [hours]);

  const resolvedCtaText = ctaText || schedule?.suggestedActionText || "Reservar Turno Ahora";

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto rounded-3xl p-8 sm:p-14 relative overflow-hidden bg-gradient-to-br from-indigo-950/70 via-[#0E1526] to-purple-950/50 border border-white/10 shadow-2xl text-center space-y-6">
        {/* Dynamic Schedule Badge */}
        {schedule && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border border-white/10 bg-white/5">
            <span className="relative flex h-2 w-2">
              {schedule.isOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  schedule.isOpen ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
            </span>
            <span className={schedule.isOpen ? "text-emerald-300" : "text-amber-200"}>
              {schedule.badgeText}
            </span>
          </div>
        )}

        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-2xl mx-auto">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={onBookingClick}
            className="px-7 py-4 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center gap-2 cursor-pointer hover:brightness-110"
            style={{ background: primaryColor }}
          >
            <Calendar className="w-4 h-4" />
            <span>{resolvedCtaText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-xl transition-all active:scale-95 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span>
                {schedule?.isOpen ? "Escribinos por WhatsApp" : "Dejar mensaje en WhatsApp"}
              </span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
};
