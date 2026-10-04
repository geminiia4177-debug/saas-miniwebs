import React, { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium select-none transition-all duration-150 rounded-lg outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]";

    const variants: Record<string, string> = {
      primary:
        "bg-accent hover:bg-accent-hover text-white shadow-sm shadow-accent/25 hover:shadow-accent/40 border border-white/10",
      secondary:
        "bg-surface-2 hover:bg-surface-3 text-fg border border-border-default hover:border-border-strong",
      danger:
        "bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 hover:border-danger/40",
      ghost:
        "text-fg-muted hover:text-fg hover:bg-white/5 active:bg-white/10",
      outline:
        "border border-border-default hover:border-border-strong text-fg bg-transparent hover:bg-surface-1",
      link:
        "text-accent hover:text-accent-hover underline-offset-4 hover:underline p-0 h-auto bg-transparent active:scale-100",
    };

    const sizes: Record<string, string> = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5 min-h-[30px]",
      md: "text-sm px-3.5 py-2 gap-2 min-h-[38px]",
      lg: "text-base px-5 py-2.5 gap-2.5 min-h-[46px]",
      icon: "w-9 h-9 p-0 min-h-[36px] flex items-center justify-center rounded-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {size !== "icon" && <span>{children}</span>}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
