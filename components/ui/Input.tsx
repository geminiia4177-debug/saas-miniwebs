import React, { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-white/5 border ${
          error ? "border-red-500/50" : "border-white/10"
        } focus:border-indigo-500/50 focus:outline-none transition-colors ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
