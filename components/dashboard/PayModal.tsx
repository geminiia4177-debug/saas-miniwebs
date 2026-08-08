"use client";

import React, { useState } from "react";
import { Biz, Ico } from "@/lib/constants";

interface PayModalProps {
  biz: Biz;
  open: boolean;
  onClose: () => void;
}

export default function PayModal({ biz, open, onClose }: PayModalProps) {
  const [payStatus, setPayStatus] = useState<"idle" | "sending" | "sent">("idle");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#131929] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative" style={{ animation: "slideUp 0.3s ease" }}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0b1020]">
          <div>
            <h3 className="text-xl font-extrabold text-white mb-1">Pago de Suscripción</h3>
            <p className="text-xs text-slate-400">Transferí para mantener tu servicio activo</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
            <Ico n="x" s={16} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-[#050810] border border-white/5 rounded-xl p-5 mb-6 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Datos de Transferencia</p>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">CBU / CVU</p>
                <p className="text-lg font-mono text-white font-medium select-all">{biz?.paymentData?.cbu || "No configurado"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Alias</p>
                <p className="text-lg font-mono text-emerald-400 font-bold select-all">{biz?.paymentData?.alias || "No configurado"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Titular</p>
                <p className="text-sm font-medium text-white">{biz?.paymentData?.titular || "No configurado"}</p>
              </div>
            </div>
          </div>

          {payStatus === "idle" && (
            <div>
              <p className="text-sm font-semibold text-white mb-3 text-center">Ya transferí, enviar comprobante:</p>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-500/30 rounded-xl cursor-pointer hover:bg-indigo-500/5 transition-colors bg-[#050810]">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Ico n="upload-cloud" s={24} c="text-indigo-400 mb-2" />
                  <p className="mb-1 text-sm text-slate-300 font-semibold">Click para subir comprobante</p>
                  <p className="text-xs text-slate-500">PNG, JPG o PDF</p>
                </div>
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                  if (e.target.files?.length) {
                    setPayStatus("sending");
                    setTimeout(() => setPayStatus("sent"), 2000);
                  }
                }} />
              </label>
            </div>
          )}

          {payStatus === "sending" && (
            <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-[#050810]">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium text-slate-300 animate-pulse">Enviando comprobante...</p>
            </div>
          )}

          {payStatus === "sent" && (
            <div className="h-32 flex flex-col items-center justify-center border border-emerald-500/30 rounded-xl bg-emerald-500/5">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                <Ico n="check" s={24} />
              </div>
              <p className="text-sm font-bold text-emerald-400">¡Comprobante enviado!</p>
              <p className="text-xs text-slate-400 mt-1">Lo verificaremos a la brevedad.</p>
            </div>
          )}
        </div>
        {payStatus === "sent" && (
          <div className="p-4 border-t border-white/10 bg-[#0b1020]">
            <button onClick={() => { onClose(); setTimeout(() => setPayStatus("idle"), 300); }} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors">
              Cerrar ventana
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
