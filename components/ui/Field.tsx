import React from "react";
import HelpTooltip from "./HelpTooltip";

export interface FieldProps {
  label?: React.ReactNode;
  action?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  tooltip?: string;
  counter?: {
    current: number;
    max: number;
  };
  className?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  label,
  action,
  htmlFor,
  hint,
  error,
  required,
  tooltip,
  counter,
  className = "",
  children,
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {(label || tooltip || counter || action) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={htmlFor}
              className="text-xs font-medium text-fg flex items-center gap-1 select-none"
            >
              <span>{label}</span>
              {required && (
                <span className="text-danger" title="Requerido">
                  *
                </span>
              )}
              {tooltip && <HelpTooltip title="Información" description={tooltip} />}
            </label>
          )}

          <div className="flex items-center gap-2">
            {action}
            {counter && (
              <span
                className={`text-[11px] tabular-nums font-mono ${
                  counter.current > counter.max
                    ? "text-danger font-semibold"
                    : "text-fg-subtle"
                }`}
              >
                {counter.current}/{counter.max}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="relative w-full">{children}</div>

      {error ? (
        <p className="text-[11px] text-danger font-medium flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-[11px] text-fg-subtle leading-normal">{hint}</p>
      ) : null}
    </div>
  );
};
