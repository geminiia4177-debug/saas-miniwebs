"use client";

import React, { useState, useRef } from "react";
import { Biz, Ico } from "@/lib/constants";

interface OnboardingModalProps {
  biz: Biz;
  setBiz: (fn: (prev: any) => any) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warn") => void;
}

const uploadToImgBB = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`/api/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
};

export default function OnboardingModal({ biz, setBiz, saving, setSaving, showToast }: OnboardingModalProps) {
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({ name: biz.name || "", cbu: "", alias: "", phone: biz.phone || "" });
  const logoRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#070b12]/95 backdrop-blur-xl p-4">
      <div className="bg-[#111825] w-full max-w-xl rounded-3xl border border-indigo-500/20 shadow-2xl p-8 relative overflow-hidden animate-slideUp">
        {/* Decors */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-white">Configuración Inicial</h2>
              <p className="text-indigo-300 text-sm mt-1">Paso {onboardingStep} de 2</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Ico n={onboardingStep === 1 ? "image" : "check-circle"} s={24} c="text-indigo-400" />
            </div>
          </div>

          {onboardingStep === 1 && (
            <div className="space-y-6">
              <div className="text-center p-6 border border-white/10 rounded-2xl bg-white/5 border-dashed">
                <p className="text-sm font-bold text-white mb-4">Sube el logo de tu negocio</p>
                <div className="flex justify-center mb-4">
                  {biz.logoUrl ? (
                    <img src={biz.logoUrl} className="w-24 h-24 rounded-2xl object-cover shadow-lg" alt="logo" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                      {biz.name.charAt(0)}
                    </div>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  showToast("Subiendo logo...", "info");
                  try {
                    const url = await uploadToImgBB(file);
                    setBiz((prev: any) => prev ? { ...prev, logoUrl: url } : prev);
                    showToast("Logo subido con éxito", "success");
                  } catch {
                    showToast("Error al subir", "error");
                  }
                }} />
                <button onClick={() => logoRef.current?.click()} className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors" style={{ backgroundColor: "var(--primary-color)" }}>
                  Elegir Imagen
                </button>
              </div>
              <button onClick={() => setOnboardingStep(2)} className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-gray-100 font-bold transition-colors">
                Continuar
              </button>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Teléfono / WhatsApp</label>
                <input type="text" value={onboardingData.phone} onChange={e => setOnboardingData({ ...onboardingData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none" placeholder="Ej: 5512345678" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">CBU (Opcional)</label>
                  <input type="text" value={onboardingData.cbu} onChange={e => setOnboardingData({ ...onboardingData, cbu: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none" placeholder="00000..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Alias (Opcional)</label>
                  <input type="text" value={onboardingData.alias} onChange={e => setOnboardingData({ ...onboardingData, alias: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none" placeholder="MI.ALIAS" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setOnboardingStep(1)} className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors">
                  Atrás
                </button>
                <button onClick={async () => {
                  setSaving(true);
                  try {
                    const paymentData = { cbu: onboardingData.cbu, alias: onboardingData.alias, titular: "" };
                    await fetch(`/api/businesses/${biz.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ...biz,
                        phone: onboardingData.phone,
                        paymentData,
                        layoutConfig: { ...(biz.layoutConfig || {}), onboarded: true }
                      }),
                    });
                    setBiz((prev: any) => ({ ...prev, phone: onboardingData.phone, paymentData, layoutConfig: { ...prev.layoutConfig, onboarded: true } }));
                    showToast("¡Configuración completada! 🎉", "success");
                  } catch {
                    showToast("Error guardando datos", "error");
                  }
                  setSaving(false);
                }} disabled={saving} className="flex-1 py-3.5 rounded-xl text-white font-bold transition-colors shadow-lg" style={{ background: `linear-gradient(to right, var(--primary-color), var(--secondary-color))` }}>
                  {saving ? "Finalizando..." : "Finalizar y Entrar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
