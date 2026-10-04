import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: "right" | "bottom";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  size = "md",
  className = "",
}) => {
  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const isBottomOnMobile = side === "bottom" || true; // Can adapt on mobile

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Panel"}
        className={`relative z-10 flex flex-col w-full bg-surface-1 border-t sm:border-t-0 sm:border-l border-border-default shadow-popover sm:h-full max-h-[90vh] sm:max-h-full rounded-t-2xl sm:rounded-none overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          side === "bottom"
            ? "max-h-[85vh] sm:max-h-[85vh] sm:rounded-t-2xl sm:border-t"
            : `sm:w-full ${sizeClasses[size]}`
        } ${className}`}
      >
        {/* Mobile handle indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-border-strong" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-border-subtle">
            <div className="flex flex-col gap-1 pr-6">
              {title && (
                <h2 className="text-base font-semibold text-fg tracking-tight leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-fg-muted leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -mr-1 -mt-1 rounded-lg text-fg-muted hover:text-fg hover:bg-white/5 transition-colors"
              aria-label="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="p-4 border-t border-border-subtle bg-surface-2/40 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
