import React, { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    
    let baseStyles = "inline-flex items-center justify-center font-bold transition-all rounded-lg outline-none disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20",
      secondary: "bg-white/10 hover:bg-white/15 text-white",
      danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500",
      ghost: "text-slate-400 hover:text-white hover:bg-white/5",
      outline: "border border-white/10 hover:border-white/20 text-white bg-transparent",
    };

    const sizes = {
      sm: "text-[10px] px-2.5 py-1.5 gap-1.5",
      md: "text-xs px-4 py-2 gap-2",
      lg: "text-sm px-5 py-2.5 gap-2",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
