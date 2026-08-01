import React, { LabelHTMLAttributes } from "react";

export const Label = ({ className = "", children, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => {
  return (
    <label
      className={`text-[9px] font-bold text-slate-500 uppercase mb-1 block ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};
