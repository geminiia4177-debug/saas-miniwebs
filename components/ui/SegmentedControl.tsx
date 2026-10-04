import React from "react";

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  size?: "sm" | "md";
  variant?: "surface" | "accent";
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
  size = "md",
  variant = "surface",
  fullWidth = false,
  className = "",
}: SegmentedControlProps<T>) {
  const isSmall = size === "sm";

  return (
    <div
      role="tablist"
      className={`inline-flex items-center rounded-lg bg-surface-2 p-1 border border-border-subtle ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const isDisabled = option.disabled;

        const activeStyles =
          variant === "accent"
            ? "bg-accent text-white shadow-sm"
            : "bg-surface-3 text-fg shadow-card border border-border-default";

        const inactiveStyles =
          "text-fg-muted hover:text-fg hover:bg-white/5 border border-transparent";

        return (
          <button
            key={String(option.value)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(option.value)}
            className={`relative flex items-center justify-center gap-1.5 font-medium rounded-md select-none transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              fullWidth ? "flex-1" : ""
            } ${
              isSmall
                ? "text-xs py-1 px-2.5 min-h-[28px]"
                : "text-sm py-1.5 px-3 min-h-[34px]"
            } ${
              isSelected ? activeStyles : inactiveStyles
            } ${
              isDisabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer"
            }`}
          >
            {option.icon && (
              <span className="flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {option.badge && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
