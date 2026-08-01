import React from "react";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const Toggle = ({ checked, onChange, label, className = "" }: ToggleProps) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <div
        onClick={() => onChange(!checked)}
        className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
        style={{ background: checked ? "#6366f1" : "rgba(255,255,255,0.08)" }}
      >
        <div
          className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all"
          style={{ left: checked ? "18px" : "3px" }}
        />
      </div>
      {label && <span className="text-[11px] text-slate-400">{label}</span>}
    </label>
  );
};
