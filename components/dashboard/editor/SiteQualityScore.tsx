"use client";

import React, { useMemo } from "react";
import { Biz } from "@/lib/constants";
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export interface SiteQualityScoreProps {
  biz: Biz;
  onNavigatePanel?: (panel: string) => void;
}

interface AuditCriterion {
  id: string;
  label: string;
  weight: number;
  passed: boolean;
  panel: string;
  fixLabel: string;
}

export const SiteQualityScore: React.FC<SiteQualityScoreProps> = ({
  biz,
  onNavigatePanel,
}) => {
  const layout = biz.layoutConfig || {};
  const isTienda = biz.type === "tienda";

  const criteria: AuditCriterion[] = useMemo(() => {
    const hasItems = isTienda
      ? (layout.tiendaProductos || []).length >= 2
      : (layout.services || layout.barberiaServices || []).length >= 2;

    return [
      {
        id: "logo",
        label: "Logotipo de marca cargado",
        weight: 15,
        passed: !!biz.logoUrl,
        panel: "design",
        fixLabel: "Subir logo",
      },
      {
        id: "desc",
        label: "Descripción clara del negocio",
        weight: 15,
        passed: !!biz.description && biz.description.length >= 20,
        panel: "content",
        fixLabel: "Redactar bio",
      },
      {
        id: "items",
        label: isTienda ? "Al menos 2 productos en tienda" : "Al menos 2 servicios en carta",
        weight: 20,
        passed: hasItems,
        panel: "content",
        fixLabel: "Agregar items",
      },
      {
        id: "whatsapp",
        label: "WhatsApp para pedidos o turnos",
        weight: 15,
        passed: !!biz.whatsapp || !!layout.whatsapp,
        panel: "settings",
        fixLabel: "Conectar WA",
      },
      {
        id: "hours",
        label: "Horarios comerciales definidos",
        weight: 15,
        passed: !!layout.hours,
        panel: "settings",
        fixLabel: "Fijar horarios",
      },
      {
        id: "visuals",
        label: "Fondo hero o fotos en galería",
        weight: 10,
        passed: !!layout.backgroundImageUrl || (layout.media || []).length > 0,
        panel: "design",
        fixLabel: "Subir portada",
      },
      {
        id: "social",
        label: "Red social (Instagram / TikTok)",
        weight: 10,
        passed: !!layout.instagram || !!layout.tiktok || !!biz.instagram,
        panel: "settings",
        fixLabel: "Añadir red",
      },
    ];
  }, [biz, layout, isTienda]);

  const score = criteria.reduce((acc, c) => acc + (c.passed ? c.weight : 0), 0);
  const pendingCriteria = criteria.filter((c) => !c.passed);

  const getScoreColor = () => {
    if (score >= 80) return { text: "text-emerald-400", stroke: "#2DD4A4", bg: "bg-emerald-500/10 border-emerald-500/20" };
    if (score >= 50) return { text: "text-amber-400", stroke: "#F5B544", bg: "bg-amber-500/10 border-amber-500/20" };
    return { text: "text-red-400", stroke: "#F2637E", bg: "bg-red-500/10 border-red-500/20" };
  };

  const colors = getScoreColor();
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface-2 border border-border-default space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
            Calidad de la Web (Lighthouse)
          </h3>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text}`}>
          {score >= 80 ? "Excelente" : score >= 50 ? "En Progreso" : "Requiere Atención"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Circular Gauge */}
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-20 h-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={colors.stroke}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-fg tabular-nums leading-none">
              {score}
            </span>
            <span className="text-[9px] text-fg-subtle">/100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-xs">
          <p className="text-fg font-semibold leading-tight">
            {score === 100
              ? "¡Sitio optimizado al máximo para conversión!"
              : `${pendingCriteria.length} mejoras sugeridas para potenciar ventas.`}
          </p>
          <p className="text-[11px] text-fg-muted mt-1 leading-relaxed">
            Medimos presencia de marca, información de contacto, catálogo y experiencia móvil.
          </p>
        </div>
      </div>

      {/* Actionable recommendations */}
      {pendingCriteria.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border-subtle">
          {pendingCriteria.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-2 rounded-xl bg-surface-1 border border-border-subtle flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-fg-muted truncate">{item.label}</span>
              </div>
              {onNavigatePanel && (
                <button
                  type="button"
                  onClick={() => onNavigatePanel(item.panel)}
                  className="px-2.5 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent font-bold text-[10px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <span>{item.fixLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
