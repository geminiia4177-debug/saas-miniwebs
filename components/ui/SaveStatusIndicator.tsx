import React from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSavedAt?: Date | string | null;
  hasUnpublishedChanges?: boolean;
  className?: string;
  onClickPublish?: () => void;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSavedAt,
  hasUnpublishedChanges = false,
  className = "",
  onClickPublish,
}) => {
  const getStatusContent = () => {
    switch (status) {
      case "saving":
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />,
          label: "Guardando…",
          classes: "text-fg-muted bg-surface-2/80 border-border-subtle",
        };
      case "error":
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-danger" />,
          label: "Error al guardar",
          classes: "text-danger bg-danger/10 border-danger/20",
        };
      case "unsaved":
        return {
          icon: <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />,
          label: "Cambios pendientes",
          classes: "text-warning bg-warning/10 border-warning/20",
        };
      case "saved":
      default:
        if (hasUnpublishedChanges) {
          return {
            icon: <span className="w-2 h-2 rounded-full bg-warning" />,
            label: "Borrador guardado · Sin publicar",
            classes: "text-warning bg-warning/10 border-warning/25",
          };
        }
        return {
          icon: <Check className="w-3.5 h-3.5 text-success" />,
          label: "Guardado",
          classes: "text-fg-muted bg-surface-2 border-border-subtle",
        };
    }
  };

  const { icon, label, classes } = getStatusContent();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border select-none transition-all ${classes} ${className}`}
      title={
        lastSavedAt
          ? `Último guardado: ${
              typeof lastSavedAt === "string"
                ? lastSavedAt
                : lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            }`
          : undefined
      }
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className="tracking-tight">{label}</span>
      {hasUnpublishedChanges && onClickPublish && (
        <button
          type="button"
          onClick={onClickPublish}
          className="ml-1 text-[11px] underline underline-offset-2 text-warning hover:text-white transition-colors cursor-pointer"
        >
          Publicar
        </button>
      )}
    </div>
  );
};
