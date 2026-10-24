"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { Rajdhani, JetBrains_Mono, Inter } from "next/font/google";
import OpenNowBadge from "../ui/OpenNowBadge";
import WhatsAppFAB from "../ui/WhatsAppFAB";
import VideoSection from "../ui/VideoSection";
import styles from "./TallerTemplate.module.css";
import { formatSocialUrl } from "@/components/landings/biolinks/utils";

const fontRajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-taller-heading",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-taller-mono",
  display: "swap",
});

const fontInter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-taller-sans",
  display: "swap",
});

// ─── SVG ICONS ───
function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// ─── STRICT TYPES ───
export interface TallerService {
  id?: string;
  name: string;
  desc?: string;
  price: string | number;
  duration?: string | number;
  categoria?: string;
  badge?: string;
  emoji?: string;
  items?: string[];
}

// ─── HELPER COMPONENTS ───

function StatsCounter({ value, label, prefix = "", suffix = "" }: { value: number; label: string; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check reduced motion preference
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(value);
      return;
    }

    let rafId: number | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const duration = 1200;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutCubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOut * value));

            if (progress < 1) {
              rafId = requestAnimationFrame(animate);
            } else {
              setCount(value);
            }
          };
          rafId = requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [value]);

  return (
    <div ref={ref} className="flex flex-col">
      <span className="font-['Rajdhani'] text-3xl sm:text-4xl font-bold text-white tracking-tight">
        {prefix}{count}{suffix}
      </span>
      <span className="font-['Inter'] text-xs text-white/50 uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );
}

interface TrackData {
  patente: string;
  servicio: string;
  paso: number;
  estimacion?: string;
  tecnico?: string;
  notas?: string;
}

function TrackingWidget({ businessId }: { businessId?: string }) {
  const [patente, setPatente] = useState("");
  const [trackResult, setTrackResult] = useState<TrackData | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPatente = patente.trim().toUpperCase();
    if (!cleanPatente) return;
    setTrackLoading(true);
    setTrackError("");
    setTrackResult(null);

    try {
      if (!businessId) {
        // Mock preview
        setTimeout(() => {
          setTrackResult({
            patente: cleanPatente,
            servicio: "Mantenimiento 60.000km & Frenos",
            paso: 3,
            estimacion: "Mañana 16:00 hs",
            tecnico: "Carlos M.",
          });
          setTrackLoading(false);
        }, 600);
        return;
      }

      const res = await fetch(`/api/appointments?businessId=${businessId}&patente=${encodeURIComponent(cleanPatente)}`);
      if (!res.ok) throw new Error("Error fetching");
      const data = await res.json();
      if (data && data.length > 0) {
        const appointment = data[data.length - 1];
        let statusStep = 1;
        if (appointment.status === "CONFIRMED") statusStep = 2;
        if (appointment.status === "IN_PROGRESS") statusStep = 3;
        if (appointment.status === "COMPLETED") statusStep = 4;
        
        setTrackResult({
          patente: appointment.patente || cleanPatente,
          servicio: appointment.serviceName || "Servicio General",
          paso: statusStep,
          notas: appointment.notes,
        });
      } else {
        setTrackError("No encontramos vehículos activos con esa patente o número de orden.");
      }
    } catch {
      setTrackError("No encontramos vehículos activos con esa patente.");
    } finally {
      if (businessId) setTrackLoading(false);
    }
  };

  const pasos = [
    { id: 1, label: "Recibido", color_activo: "#94A3B8" },
    { id: 2, label: "En Diagnóstico", color_activo: "#F59E0B" },
    { id: 3, label: "En Reparación", color_activo: "#3B82F6" },
    { id: 4, label: "Listo para Retirar", color_activo: "#10B981" },
    { id: 5, label: "Entregado", color_activo: "#8B5CF6" },
  ];

  return (
    <div className="bg-[#11141E] border border-white/10 rounded-2xl p-6 sm:p-8 mt-12 w-full max-w-lg mx-auto shadow-2xl relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 p-4 opacity-5 text-7xl select-none pointer-events-none font-bold">PIT</div>
      <h3 className="font-['Rajdhani'] text-2xl font-bold uppercase tracking-wider mb-2 text-white">Estado de tu vehículo</h3>
      <p className="text-sm text-slate-400 mb-6 font-['Inter']">Ingresá tu patente o código para consultar el avance en tiempo real.</p>
      
      <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
        <input 
          type="text" 
          value={patente}
          onChange={(e) => setPatente(e.target.value.toUpperCase())}
          placeholder="EJ: AD123YZ" 
          inputMode="text"
          autoCapitalize="characters"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-['JetBrains_Mono'] uppercase tracking-widest outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all text-sm"
        />
        <button 
          type="submit" 
          disabled={trackLoading} 
          className="bg-[var(--accent)] text-black font-['Rajdhani'] font-bold uppercase tracking-widest px-6 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 shrink-0 text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)]"
        >
          {trackLoading ? "Buscando..." : "Consultar"}
        </button>
      </form>

      {trackError && <p className="text-red-400 text-sm mt-4 font-['Inter']">{trackError}</p>}

      {trackResult && (
        <div className={`mt-8 pt-6 border-t border-white/10 ${styles.animateFadeInUp}`}>
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-['Inter']">Vehículo</p>
              <p className="text-2xl font-['JetBrains_Mono'] font-bold text-white tracking-widest">{trackResult.patente}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-['Inter']">Servicio</p>
              <p className="text-sm font-['Inter'] text-slate-300 font-medium">{trackResult.servicio}</p>
            </div>
          </div>

          <div className="relative pl-4 mt-6">
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-white/10 rounded-full"></div>
            {pasos.map((paso) => {
              const isPast = paso.id < trackResult.paso;
              const isActive = paso.id === trackResult.paso;
              return (
                <div key={paso.id} className={`relative flex items-center gap-4 mb-6 last:mb-0 transition-opacity duration-300 ${isActive ? 'opacity-100' : isPast ? 'opacity-60' : 'opacity-25'}`}>
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500"
                    style={{ 
                      backgroundColor: isActive || isPast ? paso.color_activo : '#374151', 
                      boxShadow: isActive ? `0 0 16px ${paso.color_activo}` : 'none' 
                    }}
                  >
                    {isPast && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isActive && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
                  </div>
                  <div>
                    <p className={`font-['Rajdhani'] font-bold text-base sm:text-lg ${isActive ? 'text-white' : 'text-slate-300'}`}>{paso.label}</p>
                    {isActive && trackResult.estimacion && (
                      <p className="text-xs text-[var(--accent)] font-['JetBrains_Mono'] mt-0.5">Estimado: {trackResult.estimacion}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PresupuestoWizard({ 
  businessId, 
  servicios, 
  whatsapp, 
  preselectedService 
}: { 
  businessId?: string; 
  servicios: TallerService[]; 
  whatsapp?: string; 
  preselectedService?: string;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    patente: "",
    km: "",
    servicio: "",
    descripcion: "",
    urgencia: "Esta semana",
    nombre: "",
    telefono: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [orden, setOrden] = useState("");
  const formId = useId();

  useEffect(() => {
    if (preselectedService) {
      setFormData(prev => ({ ...prev, servicio: preselectedService }));
    }
  }, [preselectedService]);

  const updateForm = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (businessId) {
        const notes = `PATENTE:${formData.patente}|KM:${formData.km}|MARCA:${formData.marca} ${formData.modelo}|URGENCIA:${formData.urgencia}|DESC:${formData.descripcion}`;
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            clientName: formData.nombre,
            clientPhone: formData.telefono,
            clientEmail: formData.email,
            date: new Date(),
            serviceName: formData.servicio,
            notes,
            patente: formData.patente,
          }),
        });
        if (!res.ok) throw new Error("Failed to submit");
      }
      
      const orderNum = Math.random().toString(36).substring(2, 8).toUpperCase();
      setOrden(orderNum);
      setStep(4);
    } catch (e) {
      console.error(e);
      alert("Hubo un error al enviar el presupuesto. Por favor intentá directamente por WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!whatsapp) return;
    const msg = `Hola! Solicito presupuesto. Orden: #${orden}\n*Vehículo:* ${formData.marca} ${formData.modelo} (${formData.patente || 'S/D'})\n*Servicio:* ${formData.servicio || 'General'}\n*Problema:* ${formData.descripcion || 'Revisión general'}`;
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  if (step === 4) {
    return (
      <div className="bg-[#11141E] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full text-center relative overflow-hidden">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl border border-emerald-500/20">
          ✓
        </div>
        <h3 className="font-['Rajdhani'] text-2xl font-bold uppercase text-white mb-2">Solicitud Enviada</h3>
        <p className="text-slate-400 font-['Inter'] text-sm mb-6">Tu código de seguimiento técnico es:</p>
        <div className="bg-[#080A0F] border border-white/10 rounded-xl p-4 mb-6">
          <span className="font-['JetBrains_Mono'] text-3xl text-[var(--accent)] tracking-widest font-bold">{orden}</span>
        </div>
        <div className="flex flex-col gap-3">
          <button 
            type="button"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(orden);
                alert("Código copiado al portapapeles");
              }
            }} 
            className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-['Rajdhani'] uppercase tracking-widest font-bold text-sm border border-white/10 transition-colors"
          >
            Copiar Código
          </button>
          {whatsapp && (
            <button 
              type="button"
              onClick={handleWhatsApp} 
              className="bg-[#25D366] text-black py-3 rounded-xl font-['Rajdhani'] uppercase tracking-widest font-bold text-sm transition-all hover:brightness-110 flex justify-center items-center gap-2 shadow-lg"
            >
              Enviar por WhatsApp
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#11141E] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full flex flex-col h-full backdrop-blur-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-['JetBrains_Mono'] text-[var(--accent)] uppercase tracking-wider block">Paso {step} de 3</span>
          <h3 className="font-['Rajdhani'] text-xl font-bold text-white uppercase tracking-wider">Pedí tu presupuesto</h3>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i === step ? 'bg-[var(--accent)] w-8' : i < step ? 'bg-[var(--accent)]/50' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1">
        {step === 1 && (
          <div className={`space-y-4 ${styles.animateFadeInUp}`}>
            <div>
              <label htmlFor={`${formId}-marca`} className="block text-xs font-['Inter'] text-slate-400 mb-1.5 uppercase tracking-wider">Marca</label>
              <select 
                id={`${formId}-marca`}
                value={formData.marca} 
                onChange={(e) => updateForm('marca', e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm"
              >
                <option value="" className="bg-[#11141E]">Seleccionar marca...</option>
                {["Volkswagen", "Ford", "Chevrolet", "Renault", "Fiat", "Toyota", "Honda", "Peugeot", "Citroën", "Nissan", "Audi", "BMW", "Mercedes-Benz", "Otro"].map((m) => (
                  <option key={m} value={m} className="bg-[#11141E]">{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-modelo`} className="block text-xs font-['Inter'] text-slate-400 mb-1.5 uppercase tracking-wider">Modelo y Año</label>
              <input 
                id={`${formId}-modelo`}
                type="text" 
                value={formData.modelo} 
                onChange={(e) => updateForm('modelo', e.target.value)} 
                placeholder="Ej: Golf GTI 2020" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${formId}-patente`} className="block text-xs font-['Inter'] text-slate-400 mb-1.5 uppercase tracking-wider">Patente</label>
                <input 
                  id={`${formId}-patente`}
                  type="text" 
                  value={formData.patente} 
                  onChange={(e) => updateForm('patente', e.target.value.toUpperCase())} 
                  placeholder="AB123CD" 
                  inputMode="text"
                  autoCapitalize="characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-['JetBrains_Mono'] uppercase tracking-widest outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm" 
                />
              </div>
              <div>
                <label htmlFor={`${formId}-km`} className="block text-xs font-['Inter'] text-slate-400 mb-1.5 uppercase tracking-wider">Kilometraje</label>
                <input 
                  id={`${formId}-km`}
                  type="text" 
                  value={formData.km} 
                  onChange={(e) => updateForm('km', e.target.value)} 
                  placeholder="75.000" 
                  inputMode="numeric"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-['JetBrains_Mono'] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm" 
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={`space-y-4 ${styles.animateFadeInUp}`}>
            <div>
              <label htmlFor={`${formId}-servicio`} className="block text-xs font-['Inter'] text-slate-400 mb-1.5 uppercase tracking-wider">Tipo de servicio</label>
              <select 
                id={`${formId}-servicio`}
                value={formData.servicio} 
                onChange={(e) => updateForm('servicio', e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)] text-sm"
              >
                <option value="" className="bg-[#11141E]">Seleccionar servicio...</option>
                {servicios.map((s) => (
                  <option key={s.id || s.name} value={s.name} className="bg-[#11141E]">{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${formId}-descripcion`} className="block text-xs font-['Inter'] text-slate-400 mb-1.5 uppercase tracking-wider">Describí el problema o síntoma</label>
              <textarea 
                id={`${formId}-descripcion`}
                value={formData.descripcion} 
                onChange={(e) => updateForm('descripcion', e.target.value)} 
                rows={3} 
                placeholder="Ruido al frenar, luz de check engine encendida, etc..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)] resize-none text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-['Inter'] text-slate-400 mb-2 uppercase tracking-wider">¿Cuándo lo necesitás?</label>
              <div className="flex flex-col gap-2">
                {["Hoy o mañana", "Esta semana", "Sin urgencia"].map((u) => (
                  <label 
                    key={u} 
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                      formData.urgencia === u 
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-white' 
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="urgencia" 
                      value={u} 
                      checked={formData.urgencia === u} 
                      onChange={(e) => updateForm('urgencia', e.target.value)} 
                      className="sr-only" 
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.urgencia === u ? 'border-[var(--accent)]' : 'border-slate-500'}`}>
                      {formData.urgencia === u && <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
                    </div>
                    <span className="text-sm font-['Inter'] font-medium">{u}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={`space-y-4 ${styles.animateFadeInUp}`}>
            <div>
              <label htmlFor={`${formId}-nombre`} className="block text-xs font-['Inter'] text-slate-400 mb-1.5 uppercase tracking-wider">Nombre y Apellido *</label>
              <input 
                id={`${formId}-nombre`}
                type="text" 
                value={formData.nombre} 
                onChange={(e) => updateForm('nombre', e.target.value)} 
                placeholder="Juan Pérez" 
                autoComplete="name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)] text-sm" 
              />
            </div>
            <div>
              <label htmlFor={`${formId}-telefono`} className="block text-xs font-['Inter'] text-slate-400 mb-1.5 uppercase tracking-wider">WhatsApp / Teléfono *</label>
              <input 
                id={`${formId}-telefono`}
                type="tel" 
                value={formData.telefono} 
                onChange={(e) => updateForm('telefono', e.target.value)} 
                placeholder="+54 9 11 5555-5555" 
                inputMode="tel"
                autoComplete="tel"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)] text-sm" 
              />
            </div>
            <div>
              <label htmlFor={`${formId}-email`} className="block text-xs font-['Inter'] text-slate-400 mb-1.5 uppercase tracking-wider">Email (opcional)</label>
              <input 
                id={`${formId}-email`}
                type="email" 
                value={formData.email} 
                onChange={(e) => updateForm('email', e.target.value)} 
                placeholder="juan@email.com" 
                autoComplete="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)] text-sm" 
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
        {step > 1 && (
          <button 
            type="button"
            onClick={() => setStep((s) => s - 1)} 
            className="px-4 py-2.5 text-sm font-['Rajdhani'] font-bold uppercase tracking-wider text-slate-300 border border-white/20 rounded-xl hover:bg-white/5 transition-colors"
          >
            Volver
          </button>
        )}
        <button 
          type="button"
          onClick={() => (step < 3 ? setStep((s) => s + 1) : handleSubmit())} 
          disabled={loading || (step === 1 && !formData.marca) || (step === 3 && (!formData.nombre || !formData.telefono))}
          className="flex-1 bg-[var(--accent)] text-black px-4 py-2.5 text-sm font-['Rajdhani'] font-bold uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
        >
          {loading ? "Enviando..." : step < 3 ? "Siguiente" : "Solicitar Presupuesto"}
        </button>
      </div>
    </div>
  );
}

function BeforeAfterSlider({ before, after, titulo }: { before: string; after: string; titulo: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div className="flex flex-col gap-3">
      <div 
        ref={containerRef}
        className="relative w-full aspect-video rounded-2xl overflow-hidden select-none cursor-ew-resize group border border-white/10 shadow-2xl touch-none"
        onPointerMove={(e) => { if (e.buttons === 1) handleMove(e.clientX); }}
        onPointerDown={(e) => handleMove(e.clientX)}
      >
        <img src={after} alt={`${titulo} Después`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        <div className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
          <img src={before} alt={`${titulo} Antes`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        </div>
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_12px_rgba(0,0,0,0.8)] z-10" 
          style={{ left: `calc(${sliderPos}% - 2px)` }}
        >
          <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </div>
        </div>
      </div>
      <p className="text-center font-['Rajdhani'] font-bold tracking-widest uppercase text-white/90 text-sm">{titulo}</p>
    </div>
  );
}

// ─── MAIN TEMPLATE ───

export default function TallerTemplate(props: { negocio: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, businessId } = props;
  const accent = negocio?.accentColor || negocio?.primaryColor || "#F59E0B";

  const servicios: TallerService[] = negocio?.layoutConfig?.tallerServices || negocio?.layoutConfig?.barberiaServices || [];
  const categorias = Array.from(new Set(servicios.map((s) => s.categoria).filter(Boolean)));
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [preselectedService, setPreselectedService] = useState("");

  const stats = negocio?.layoutConfig?.stats || { anios: 10, clientes: 5000, trabajos: 15000 };
  const heroText = negocio?.layoutConfig?.heroText || "Especialistas en el cuidado y mantenimiento de tu vehículo. Diagnóstico de precisión, repuestos originales y garantía técnica por escrito.";
  const badgeText = negocio?.layoutConfig?.badge || "⚡ Taller Mecánico de Precisión";
  const garantiaMeses = negocio?.layoutConfig?.garantiaMeses || 6;
  const repuestosMarcas: string[] = negocio?.layoutConfig?.marcasRepuestos || ['Bosch', 'Brembo', 'NGK', 'SKF', 'Monroe', 'Valeo', 'Motul'];
  const certificaciones: string[] = negocio?.layoutConfig?.certificaciones || ['Técnicos Certificados ASE', 'Diagnóstico Computarizado OBD-II', 'Garantía Escrita'];
  const beforeAfter = negocio?.layoutConfig?.beforeAfter || [];
  
  const address = negocio?.address || negocio?.layoutConfig?.address || "";
  const mapUrl = negocio?.mapUrl || negocio?.layoutConfig?.mapUrl || "";
  const hours = negocio?.layoutConfig?.hours;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleReservarClick = (serviceName?: string) => {
    if (typeof serviceName === 'string') {
      setPreselectedService(serviceName);
    }
    scrollToSection("presupuesto");
  };

  return (
    <div 
      className={`${fontRajdhani.variable} ${fontMono.variable} ${fontInter.variable} min-h-screen bg-[#080A0F] text-[#F8FAFC] font-['Inter'] relative overflow-x-hidden selection:bg-[var(--accent)] selection:text-black pb-28 md:pb-0`} 
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 w-full z-50 px-4 sm:px-6 md:px-12 py-4 flex justify-between items-center bg-[#080A0F]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          {negocio?.logoUrl ? (
            <img src={negocio.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg border border-white/10" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg">
              ⚙️
            </div>
          )}
          <span className="font-['Rajdhani'] text-xl font-bold uppercase tracking-widest text-white">
            {negocio?.name || "Taller Mecánico"}
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 font-['Rajdhani'] font-bold tracking-widest uppercase text-sm">
          <button type="button" onClick={() => scrollToSection("servicios")} className="hover:text-[var(--accent)] transition-colors">Servicios</button>
          <button type="button" onClick={() => scrollToSection("tracking")} className="hover:text-[var(--accent)] transition-colors">Estado del Vehículo</button>
          {beforeAfter.length > 0 && (
            <button type="button" onClick={() => scrollToSection("galeria")} className="hover:text-[var(--accent)] transition-colors">Trabajos</button>
          )}
        </div>

        <button 
          type="button"
          onClick={() => handleReservarClick()} 
          className="bg-[var(--accent)] text-black font-['Rajdhani'] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:brightness-110 active:scale-95 transition-all text-sm"
        >
          Presupuesto
        </button>
      </nav>

      {/* ── HERO SECTION ── */}
      <section id="presupuesto" className="relative min-h-[100svh] pt-28 pb-16 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto flex flex-col justify-center">
        <div className={`absolute inset-0 pointer-events-none opacity-40 ${styles.hexPattern}`}></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-16 items-center relative z-10 w-full h-full">
          {/* Lado Izquierdo */}
          <div className="flex flex-col pt-8 lg:pt-0">
            <div className={`inline-flex items-center gap-2 bg-[#11141E] border border-[var(--accent)]/30 rounded-full px-4 py-1.5 text-xs font-['Rajdhani'] font-bold uppercase tracking-widest text-[var(--accent)] w-fit mb-6 ${styles.animateFadeInUp}`}>
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
              {badgeText}
            </div>

            <h1 className={`font-['Rajdhani'] text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.92] mb-6 ${styles.animateFadeInUp} ${styles.delay100}`}>
              <span className="block text-white">TU VEHÍCULO /</span>
              <span className="block text-[var(--accent)]">{negocio?.name?.split(' ')[0] || "NUESTRO"} ATELIER</span>
            </h1>

            <p className={`text-slate-400 font-['Inter'] text-lg sm:text-xl max-w-xl mb-10 leading-relaxed ${styles.animateFadeInUp} ${styles.delay200}`}>
              {heroText}
            </p>

            {/* Stats */}
            <div className={`grid grid-cols-3 gap-6 pt-8 border-t border-white/10 ${styles.animateFadeInUp} ${styles.delay300}`}>
              <StatsCounter value={stats.anios} label="Años Exp." prefix="+" />
              <StatsCounter value={stats.clientes} label="Clientes" prefix="+" />
              <StatsCounter value={stats.trabajos} label="Trabajos" prefix="+" />
            </div>
          </div>

          {/* Lado Derecho (Widget Presupuesto) */}
          <div className={`${styles.animateFadeInUp} ${styles.delay200} h-full`}>
            <PresupuestoWizard 
              businessId={businessId} 
              servicios={servicios} 
              whatsapp={negocio?.whatsapp} 
              preselectedService={preselectedService} 
            />
          </div>
        </div>
      </section>

      {/* ── TRACKING SECTION ── */}
      <section id="tracking" className="relative py-24 px-4 sm:px-6 md:px-12 bg-[#0C0F17] border-y border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-['JetBrains_Mono'] text-[var(--accent)] uppercase tracking-widest text-xs sm:text-sm mb-4">Módulo de Seguimiento</p>
          <h2 className="font-['Rajdhani'] text-4xl sm:text-5xl font-black uppercase tracking-wider text-white">
            ¿En qué estado está <br/><span className="text-slate-500">mi vehículo?</span>
          </h2>
          <TrackingWidget businessId={businessId} />
        </div>
      </section>

      {/* ── SERVICIOS SECTION ── */}
      <section id="servicios" className="relative py-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-['JetBrains_Mono'] text-[var(--accent)] uppercase tracking-widest text-xs sm:text-sm mb-3">Catálogo Especializado</p>
          <h2 className="font-['Rajdhani'] text-4xl sm:text-5xl font-black uppercase tracking-wider text-white mb-6">Nuestros Servicios</h2>
          <div className={`${styles.railLine} max-w-md mx-auto opacity-40`}></div>
        </div>

        {/* Categorías Filtro */}
        {categorias.length > 0 && (
          <div className="flex gap-2.5 overflow-x-auto pb-6 mb-10 scrollbar-hide snap-x">
            <button 
              type="button"
              onClick={() => setActiveCategory("Todos")}
              className={`snap-start whitespace-nowrap px-6 py-2.5 rounded-xl font-['Rajdhani'] font-bold uppercase tracking-widest text-sm border transition-all ${activeCategory === "Todos" ? 'bg-[var(--accent)] text-black border-[var(--accent)] shadow-[0_0_15px_rgba(245,158,11,0.25)]' : 'bg-[#11141E] text-slate-300 border-white/10 hover:border-[var(--accent)]/50'}`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button 
                type="button"
                key={cat as string}
                onClick={() => setActiveCategory(cat as string)}
                className={`snap-start whitespace-nowrap px-6 py-2.5 rounded-xl font-['Rajdhani'] font-bold uppercase tracking-widest text-sm border transition-all ${activeCategory === cat ? 'bg-[var(--accent)] text-black border-[var(--accent)] shadow-[0_0_15px_rgba(245,158,11,0.25)]' : 'bg-[#11141E] text-slate-300 border-white/10 hover:border-[var(--accent)]/50'}`}
              >
                {cat as string}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {servicios
            .filter((s) => activeCategory === "Todos" || s.categoria === activeCategory)
            .map((srv, idx) => (
              <div 
                key={srv.id || idx} 
                className="group flex flex-col sm:flex-row gap-5 p-6 bg-[#11141E] border border-white/10 rounded-2xl hover:border-[var(--accent)]/40 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden"
              >
                {srv.badge && (
                  <div className="absolute top-4 right-4 bg-[var(--accent)] text-black text-[10px] font-['Rajdhani'] font-bold uppercase tracking-widest px-3 py-1 rounded-full z-10 shadow-sm">
                    {srv.badge.replace('-', ' ')}
                  </div>
                )}
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-[var(--accent)] text-3xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:border-[var(--accent)]/30 transition-all">
                  {srv.emoji || "⚙️"}
                </div>
                <div className="flex-1 flex flex-col">
                  <h3 className="font-['Rajdhani'] text-2xl font-bold text-white uppercase tracking-wider pr-16 leading-tight mb-2">
                    {srv.name}
                  </h3>
                  <p className="text-sm text-slate-400 font-['Inter'] mb-4 line-clamp-2">
                    {srv.desc}
                  </p>
                  
                  {srv.items && srv.items.length > 0 && (
                    <details className="mb-4 text-sm font-['Inter'] group/details">
                      <summary className="text-[var(--accent)] cursor-pointer hover:underline font-medium list-none flex items-center gap-1.5 text-xs uppercase tracking-wider">
                        Ver detalles técnicos
                        <svg className="w-3.5 h-3.5 transition-transform group-open/details:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <ul className="mt-2.5 space-y-1.5 pl-3 border-l-2 border-[var(--accent)]/30">
                        {srv.items.map((item, i) => (
                          <li key={i} className="text-slate-300 text-xs flex items-center gap-2">
                            <span className="text-[var(--accent)] font-bold">✓</span> {item}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div className="flex items-end justify-between mt-auto border-t border-white/5 pt-4">
                    <div className="font-['Rajdhani'] text-3xl font-bold text-[var(--accent)]">
                      ${srv.price}
                    </div>
                    <div className="flex items-center gap-4">
                      {srv.duration && (
                        <span className="font-['JetBrains_Mono'] text-xs text-slate-500 uppercase tracking-widest">
                          {srv.duration} Min
                        </span>
                      )}
                      <button 
                        type="button"
                        onClick={() => handleReservarClick(srv.name)} 
                        className="bg-white/5 hover:bg-[var(--accent)] hover:text-black text-white p-2.5 rounded-xl transition-all border border-white/10" 
                        title="Solicitar Presupuesto para este servicio"
                        aria-label={`Solicitar presupuesto para ${srv.name}`}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* ── GARANTÍAS Y MARCAS ── */}
      <section className="bg-[#0C0F17] py-24 px-4 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-8 bg-[#11141E] rounded-2xl border border-white/5 hover:border-[var(--accent)]/20 transition-colors">
            <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-[var(--accent)]/30 text-[var(--accent)]">
              🛡️
            </div>
            <h3 className="font-['Rajdhani'] text-xl font-bold uppercase tracking-wider text-white mb-2">Garantía Escrita</h3>
            <p className="text-sm text-slate-400 font-['Inter']">Todos nuestros trabajos cuentan con <strong>{garantiaMeses} meses</strong> de garantía escrita certificada.</p>
          </div>
          <div className="flex flex-col items-center text-center p-8 bg-[#11141E] rounded-2xl border border-white/5 hover:border-[var(--accent)]/20 transition-colors">
            <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-[var(--accent)]/30 text-[var(--accent)]">
              ⚙️
            </div>
            <h3 className="font-['Rajdhani'] text-xl font-bold uppercase tracking-wider text-white mb-2">Repuestos Originales</h3>
            <p className="text-sm text-slate-400 font-['Inter']">Trabajamos exclusivamente con primeras marcas oficiales: {repuestosMarcas.join(', ')}.</p>
          </div>
          <div className="flex flex-col items-center text-center p-8 bg-[#11141E] rounded-2xl border border-white/5 hover:border-[var(--accent)]/20 transition-colors">
            <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-[var(--accent)]/30 text-[var(--accent)]">
              🎖️
            </div>
            <h3 className="font-['Rajdhani'] text-xl font-bold uppercase tracking-wider text-white mb-2">Certificaciones</h3>
            <p className="text-sm text-slate-400 font-['Inter']">{certificaciones.join(' • ')}</p>
          </div>
        </div>
      </section>

      {/* ── GALERÍA / ANTES Y DESPUÉS ── */}
      {beforeAfter && beforeAfter.length > 0 && (
        <section id="galeria" className="py-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-['JetBrains_Mono'] text-[var(--accent)] uppercase tracking-widest text-xs sm:text-sm mb-3">Resultados Comprobables</p>
            <h2 className="font-['Rajdhani'] text-4xl sm:text-5xl font-black uppercase tracking-wider text-white mb-6">Nuestros Trabajos</h2>
            <div className={`${styles.railLine} max-w-md mx-auto opacity-40`}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {beforeAfter.map((ba: any, idx: number) => (
              <BeforeAfterSlider key={ba.id || idx} before={ba.before} after={ba.after} titulo={ba.titulo} />
            ))}
          </div>
        </section>
      )}

      {/* ── VIDEO SECTION ── */}
      <VideoSection
        videoUrl={negocio?.layoutConfig?.videoUrl || (props.sections?.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
        accentColor={accent}
        theme="dark"
      />

      {/* ── FOOTER ── */}
      <footer className="bg-[#05070A] border-t border-white/10 pt-20 pb-28 md:pb-16 px-4 sm:px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-6">
              {negocio?.logoUrl ? (
                <img src={negocio.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg border border-white/10" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                  ⚙️
                </div>
              )}
              <span className="font-['Rajdhani'] text-xl font-bold uppercase tracking-widest text-white">
                {negocio?.name || "Taller Mecánico"}
              </span>
            </div>
            <p className="text-sm text-slate-400 font-['Inter'] mb-6 leading-relaxed">
              {negocio?.description || heroText}
            </p>
            <div className="flex gap-3">
              {negocio?.instagram && (
                <a 
                  href={formatSocialUrl("instagram", negocio.instagram)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-black hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
              )}
              {negocio?.facebook && (
                <a 
                  href={formatSocialUrl("facebook", negocio.facebook)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-black hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all"
                  aria-label="Facebook"
                >
                  <FacebookIcon />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-['Rajdhani'] text-lg font-bold uppercase tracking-widest text-white mb-6">Horarios de Atención</h4>
            <div className="mb-4">
              <OpenNowBadge hours={hours} />
            </div>
            {hours && Object.entries(hours).map(([dia, h]: [string, any]) => {
              if (!h?.open) return null;
              return (
                <div key={dia} className="flex justify-between text-sm font-['JetBrains_Mono'] border-b border-white/5 py-2.5">
                  <span className="capitalize text-slate-400">{dia}</span>
                  <span className="text-white font-medium">{h.from} - {h.to}</span>
                </div>
              );
            })}
          </div>

          <div>
            <h4 className="font-['Rajdhani'] text-lg font-bold uppercase tracking-widest text-white mb-6">Ubicación</h4>
            <p className="text-sm text-slate-400 font-['Inter'] mb-6 flex items-start gap-2">
              <span className="text-[var(--accent)]">📍</span> {address || "Av. Principal 1234, Ciudad"}
            </p>
            {mapUrl && (
              <div className="w-full h-44 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                <iframe 
                  src={mapUrl} 
                  title="Ubicación del taller"
                  className="w-full h-full border-none" 
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center border-t border-white/5 pt-8">
          <p className="font-['JetBrains_Mono'] text-xs text-slate-500 uppercase tracking-widest">
            © {new Date().getFullYear()} {negocio?.name || "Taller Mecánico"}. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {negocio?.whatsapp && <WhatsAppFAB phone={negocio.whatsapp} message="Hola! Quisiera hacer una consulta por mi vehículo." />}

      {/* ── MOBILE STICKY BUTTON ── */}
      <div 
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#080A0F]/95 backdrop-blur-xl border-t border-white/10 p-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button 
          type="button"
          onClick={() => handleReservarClick()}
          className="w-full bg-[var(--accent)] text-black font-['Rajdhani'] font-bold text-lg uppercase tracking-widest py-3.5 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        >
          Solicitar Presupuesto
        </button>
      </div>
    </div>
  );
}