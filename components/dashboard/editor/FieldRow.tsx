import React, { useState } from "react";
import { BookingField, Ico } from "@/lib/constants";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Toggle } from "@/components/ui/Toggle";

export const FieldRow = ({
  field, onUpdate, onDelete, canDelete,
}: {
  field: BookingField;
  onUpdate: (f: BookingField) => void;
  onDelete: () => void;
  canDelete: boolean;
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <Ico n="drag" s={13} c="text-slate-600" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-white">{field.label}</p>
          <p className="text-[10px] text-slate-500">{field.type}{field.required ? " · requerido" : " · opcional"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${field.required ? "bg-amber-500/15 text-amber-400" : "bg-slate-700/50 text-slate-500"}`}>
            {field.required ? "REQ" : "OPC"}
          </span>
          <Ico n={open ? "chevronUp" : "chevronDown"} s={13} c="text-slate-500" />
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="pt-2.5 grid grid-cols-2 gap-2">
            <div>
              <Label>Label</Label>
              <Input value={field.label} onChange={e => onUpdate({ ...field, label: e.target.value })} />
            </div>
            <div>
              <Label>Tipo</Label>
              <select value={field.type} onChange={e => onUpdate({ ...field, type: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none"
                style={{ background: "#1a2235" }}>
                {["text","tel","email","select","textarea"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Placeholder</Label>
              <Input value={field.placeholder || ""} onChange={e => onUpdate({ ...field, placeholder: e.target.value })} />
            </div>
            {field.type === "select" && (
              <div className="col-span-2">
                <Label>Opciones (separadas por coma)</Label>
                <Input value={(field.options || []).join(", ")}
                  onChange={e => onUpdate({ ...field, options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                  placeholder="Opción 1, Opción 2, Opción 3" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            <Toggle checked={field.required} onChange={(c) => onUpdate({ ...field, required: c })} label="Campo requerido" />
            {canDelete && (
              <button onClick={onDelete} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors">
                Eliminar campo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
