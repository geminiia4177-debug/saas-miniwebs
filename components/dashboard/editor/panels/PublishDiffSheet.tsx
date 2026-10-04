import React, { useMemo } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { Biz } from "@/lib/constants";
import { SiteQualityScore } from "../SiteQualityScore";

export interface PublishDiffSheetProps {
  isOpen: boolean;
  onClose: () => void;
  biz: Biz | null;
  onConfirmPublish: () => Promise<void> | void;
  isPublishing?: boolean;
  onNavigatePanel?: (panel: string) => void;
}

export const PublishDiffSheet: React.FC<PublishDiffSheetProps> = ({
  isOpen,
  onClose,
  biz,
  onConfirmPublish,
  isPublishing = false,
  onNavigatePanel,
}) => {
  // Compute change differences between draft and published configs
  const changes = useMemo(() => {
    if (!biz) return [];
    const list: string[] = [];
    const draft = (biz.layoutConfig as any) || {};
    const published = ((biz as any).publishedConfig) || {};

    // 1. Template level or theme
    if (draft.templateLevel !== published.templateLevel && draft.templateLevel) {
      list.push(`Nivel de plantilla cambiado a "${draft.templateLevel}"`);
    }
    if (draft.themeVariant !== published.themeVariant && draft.themeVariant) {
      list.push(`Estilo visual actualizado a "${draft.themeVariant}"`);
    }

    // 2. Colors
    if (biz.primaryColor && biz.primaryColor !== published.primaryColor) {
      list.push("Paleta de color principal actualizada");
    }

    // 3. Products
    const draftProds = draft.tiendaProductos || draft.products || [];
    const pubProds = published.tiendaProductos || published.products || [];
    if (draftProds.length !== pubProds.length) {
      list.push(`Catálogo modificado (${draftProds.length} productos en borrador vs ${pubProds.length} publicados)`);
    }

    // 4. Services
    const draftServ = draft.services || draft.barberiaServices || [];
    const pubServ = published.services || published.barberiaServices || [];
    if (draftServ.length !== pubServ.length) {
      list.push(`Lista de servicios actualizada (${draftServ.length} servicios)`);
    }

    // 5. Sections
    const draftSections = draft.sections || [];
    const pubSections = published.sections || [];
    const visibleDraft = draftSections.filter((s: any) => s.visible !== false).length;
    const visiblePub = pubSections.filter((s: any) => s.visible !== false).length;
    if (visibleDraft !== visiblePub) {
      list.push(`Visibilidad de bloques modificada (${visibleDraft} secciones visibles)`);
    }

    // Fallback if small or deep changes occurred
    if (list.length === 0) {
      list.push("Ajustes generales de diseño y textos actualizados");
    }

    return list;
  }, [biz]);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Revisar y Publicar"
      description="Verificá los cambios realizados antes de hacerlos visibles a tus clientes."
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isPublishing}>
            Seguir editando
          </Button>
          <Button
            variant="primary"
            size="md"
            isLoading={isPublishing}
            onClick={onConfirmPublish}
            className="gap-2"
          >
            <span>Confirmar y Publicar</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Site Quality Score (Lighthouse Gauge) */}
        {biz && (
          <SiteQualityScore
            biz={biz}
            onNavigatePanel={(panel) => {
              onClose();
              onNavigatePanel?.(panel);
            }}
          />
        )}

        {/* Changes summary */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-fg-subtle mb-3">
            Resumen de cambios pendientes
          </h4>
          <div className="space-y-2">
            {changes.map((change, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-2/60 border border-border-subtle text-xs text-fg leading-relaxed"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                <span>{change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
};
