import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "outline"
    | "accent";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className = "",
      variant = "default",
      size = "sm",
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center gap-1.5 font-medium rounded-full select-none tracking-tight transition-colors";

    const sizes = {
      sm: "text-[11px] leading-none px-2 py-1",
      md: "text-xs leading-none px-2.5 py-1.5",
    };

    const variants = {
      default: "bg-surface-3 text-fg border border-border-default",
      secondary: "bg-surface-2 text-fg-muted border border-border-subtle",
      accent: "bg-accent/15 text-accent border border-accent/25",
      success: "bg-success/15 text-success border border-success/30",
      warning: "bg-warning/15 text-warning border border-warning/30",
      danger: "bg-danger/15 text-danger border border-danger/30",
      info: "bg-info/15 text-info border border-info/30",
      outline: "bg-transparent text-fg-muted border border-border-default",
    };

    const dotColors = {
      default: "bg-fg-muted",
      secondary: "bg-fg-subtle",
      accent: "bg-accent animate-pulse",
      success: "bg-success animate-pulse",
      warning: "bg-warning animate-pulse",
      danger: "bg-danger animate-pulse",
      info: "bg-info animate-pulse",
      outline: "bg-fg-muted",
    };

    return (
      <span
        ref={ref}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      >
        {dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`}
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
      </span>
    );
  }
);
Badge.displayName = "Badge";
