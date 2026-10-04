import React from "react";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = "md",
  className = "",
  id,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  const isSmall = size === "sm";

  return (
    <label
      className={`inline-flex items-start gap-2.5 cursor-pointer select-none group ${
        disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
      } ${className}`}
    >
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex flex-shrink-0 items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
          isSmall ? "w-7 h-4" : "w-10 h-5"
        } ${checked ? "bg-accent" : "bg-surface-3 border border-border-default"}`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isSmall
              ? `w-3 h-3 ${checked ? "translate-x-3.5" : "translate-x-0.5"}`
              : `w-4 h-4 ${checked ? "translate-x-5" : "translate-x-0.5"}`
          }`}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col text-left">
          {label && (
            <span
              className={`font-medium text-fg group-hover:text-fg transition-colors ${
                isSmall ? "text-xs" : "text-sm"
              }`}
            >
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-fg-subtle leading-tight">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};
