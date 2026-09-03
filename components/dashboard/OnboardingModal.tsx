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

const uploadToImgBB = async (file: File, businessId: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("businessId", businessId);
  const res = await fetch(`/api/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
};

import HelpTooltip from "@/components/ui/HelpTooltip";

export default function OnboardingModal({ biz, setBiz, saving, setSaving, showToast }: OnboardingModalProps) {
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [country, setCountry] = useState<"MX" | "AR">("MX");
  const [onboardingData, setOnboardingData] = useState({
    name: biz.name || "",
    phone: biz.phone || "",
    clabe: "",
    bank: "",
    cbu: "",
    alias: "",
    titular: "",
  });
  const logoRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#070b12]/95 backdrop-blur-xl p-3 sm:p-4 overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
      <div className="bg-[#111825] w-full max-w-xl rounded-3xl border border-indigo-500/20 shadow-2xl p-5 sm:p-8 relative overflow-hidden animate-slideUp max-h-[88dvh] overflow-y-auto custom-scrollbar my-auto">
        {/* Decors */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Configuración Inicial</h2>
              <p className="text-indigo-300 text-xs sm:text-sm mt-1">Paso {onboardingStep} de 2</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Ico n={onboardingStep === 1 ? "image" : "check-circle"} s={22} c="text-indigo-400" />
            </div>
          </div>

          {onboardingStep === 1 && (
            <div className="space-y-6">
              <div className="text-center p-5 sm:p-6 border border-white/10 rounded-2xl bg-white/5 border-dashed">
                <p className="text-sm font-bold text-white mb-4">Sube el logo de tu negocio</p>
                <div className="flex justify-center mb-4">
                  {biz.logoUrl ? (
                    <img src={biz.logoUrl} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-lg" alt="logo" />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-lg">
                      {biz.name ? biz.name.charAt(0) : "M"}
                    </div>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  showToast("Subiendo logo...", "info");
                  try {
                    const url = await uploadToImgBB(file, biz.id);
                    setBiz((prev: any) => prev ? { ...prev, logoUrl: url } : prev);
                    showToast("Logo subido con éxito", "success");
                  } catch {
                    showToast("Error al subir", "error");
                  }
                }} />
                <button onClick={() => logoRef.current?.click()} className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors min-h-[44px]" style={{ backgroundColor: "var(--primary-color)" }}>
                  Elegir Imagen
                </button>
              </div>
              <button onClick={() => setOnboardingStep(2)} className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-gray-100 font-bold transition-colors min-h-[48px]">
                Continuar
              </button>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Teléfono / WhatsApp</label>
                <input type="text" value={onboardingData.phone} onChange={e => setOnboardingData({ ...onboardingData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none text-[16px] sm:text-sm" placeholder="Ej: 5512345678" />
              </div>

              {/* País / Sistema Bancario */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Datos Bancarios para Cobros (Opcional)</label>
                    <HelpTooltip
                      title="Datos Bancarios para Cobros"
                      description="Permite que tus clientes te transfieran directamente para abonar sus turnos o servicios. En México se utiliza la CLABE interbancaria (18 dígitos) y el nombre de tu Banco."
                      tip="Si eres de México selecciona 🇲🇽 México para ingresar tu CLABE. Si eres de Argentina selecciona 🇦🇷 para CBU y Alias."
                    />
                  </div>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setCountry("MX")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${country === "MX" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                    >
                      🇲🇽 México
                    </button>
                    <button
                      type="button"
                      onClick={() => setCountry("AR")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${country === "AR" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                    >
                      🇦🇷 Argentina
                    </button>
                  </div>
                </div>

                {country === "MX" ? (
                  <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">CLABE Interbancaria (18 dígitos)</label>
                      <input
                        type="text"
                        maxLength={18}
                        value={onboardingData.clabe}
                        onChange={e => setOnboardingData({ ...onboardingData, clabe: e.target.value.replace(/\D/g, "") })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none text-sm font-mono"
                        placeholder="012180001234567890"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Banco Receptor</label>
                        <input
                          type="text"
                          value={onboardingData.bank}
                          onChange={e => setOnboardingData({ ...onboardingData, bank: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none text-sm"
                          placeholder="BBVA, Santander, Nu..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Nombre del Titular</label>
                        <input
                          type="text"
                          value={onboardingData.titular}
                          onChange={e => setOnboardingData({ ...onboardingData, titular: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none text-sm"
                          placeholder="Nombre y Apellido"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">CBU / CVU (22 dígitos)</label>
                        <input
                          type="text"
                          maxLength={22}
                          value={onboardingData.cbu}
                          onChange={e => setOnboardingData({ ...onboardingData, cbu: e.target.value.replace(/\D/g, "") })}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none text-sm font-mono"
                          placeholder="00000031000..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Alias</label>
                        <input
                          type="text"
                          value={onboardingData.alias}
                          onChange={e => setOnboardingData({ ...onboardingData, alias: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none text-sm uppercase"
                          placeholder="MI.ALIAS.MP"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Titular de la Cuenta</label>
                      <input
                        type="text"
                        value={onboardingData.titular}
                        onChange={e => setOnboardingData({ ...onboardingData, titular: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:outline-none text-sm"
                        placeholder="Nombre completo"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setOnboardingStep(1)} className="px-5 sm:px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors min-h-[48px]">
                  Atrás
                </button>
                <button onClick={async () => {
                  setSaving(true);
                  try {
                    const paymentData = {
                      country,
                      clabe: onboardingData.clabe,
                      bank: onboardingData.bank,
                      cbu: onboardingData.cbu,
                      alias: onboardingData.alias,
                      titular: onboardingData.titular
                    };
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
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  } catch {
                    showToast("Error guardando datos", "error");
                  }
                  setSaving(false);
                }} disabled={saving} className="flex-1 py-3.5 rounded-xl text-white font-bold transition-colors shadow-lg min-h-[48px]" style={{ background: `linear-gradient(to right, var(--primary-color), var(--secondary-color))` }}>
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
