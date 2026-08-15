"use client";

import React, { useState, useEffect, useRef } from "react";
import OpenNowBadge from "../ui/OpenNowBadge";
import WhatsAppFAB from "../ui/WhatsAppFAB";
import VideoSection from "../ui/VideoSection";
import styles from "./TallerTemplate.module.css";

// ─── HELPER COMPONENTS ───

function StatsCounter({ value, label, prefix = "", suffix = "" }: { value: number, label: string, prefix?: string, suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        let start = 0;
        const duration = 1200;
        const startTime = performance.now();
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // ease-out
          const easeOut = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(easeOut * value));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setCount(value);
          }
        };
        requestAnimationFrame(animate);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
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

function TrackingWidget({ businessId, accent }: { businessId?: string, accent: string }) {
  const [patente, setPatente] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patente) return;
    setTrackLoading(true);
    setTrackError("");
    setTrackResult(null);

    try {
      if (!businessId) {
        // Mock preview
        setTimeout(() => {
          setTrackResult({
            patente: patente.toUpperCase(),
            servicio: "Mantenimiento 60.000km",
            paso: 3,
            estimacion: "Mañana 16:00 hs",
            tecnico: "Carlos M.",
          });
          setTrackLoading(false);
        }, 800);
        return;
      }

      const res = await fetch(`/api/appointments?businessId=${businessId}&patente=${encodeURIComponent(patente)}`);
      if (!res.ok) throw new Error("Error fetching");
      const data = await res.json();
      if (data && data.length > 0) {
        const appointment = data[data.length - 1]; // latest
        let statusStep = 1;
        if (appointment.status === "CONFIRMED") statusStep = 2;
        if (appointment.status === "IN_PROGRESS" || appointment.status === "COMPLETED") statusStep = 3; // Simplified map
        // If it's a real integration you'd map custom states, we map standard states for now.
        
        setTrackResult({
          patente: appointment.patente || patente.toUpperCase(),
          servicio: appointment.serviceName || "Servicio General",
          paso: statusStep,
          notas: appointment.notes
        });
      } else {
        setTrackError("No encontramos vehículos activos con esa patente o número de orden.");
      }
    } catch (error) {
      setTrackError("No encontramos vehículos con esa patente.");
    } finally {
      if (businessId) setTrackLoading(false);
    }
  };

  const pasos = [
    { id: 1, label: "Recibido", icon: "🔑", color_activo: "#6B7280" },
    { id: 2, label: "En Diagnóstico", icon: "🔍", color_activo: "#F59E0B" },
    { id: 3, label: "En Reparación", icon: "🔧", color_activo: "#3B82F6" },
    { id: 4, label: "Listo para Retirar", icon: "✅", color_activo: "#10B981" },
    { id: 5, label: "Entregado", icon: "🏁", color_activo: "#8B5CF6" }
  ];

  return (
    <div className="bg-[#1A1F2E] border border-white/5 rounded-2xl p-6 sm:p-8 mt-12 w-full max-w-lg mx-auto shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🔍</div>
      <h3 className="font-['Rajdhani'] text-2xl font-bold uppercase tracking-wider mb-2">Estado de tu vehículo</h3>
      <p className="text-sm text-gray-400 mb-6 font-['Inter']">Ingresá tu patente para ver el estado en tiempo real.</p>
      
      <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
        <input 
          type="text" 
          value={patente}
          onChange={(e) => setPatente(e.target.value)}
          placeholder="EJ: AD123YZ" 
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-['JetBrains_Mono'] uppercase tracking-widest outline-none focus:border-[var(--accent)] transition-colors"
        />
        <button type="submit" disabled={trackLoading} className="bg-[var(--accent)] text-black font-['Rajdhani'] font-bold uppercase tracking-widest px-6 py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 shrink-0">
          {trackLoading ? "Buscando..." : "Consultar"}
        </button>
      </form>

      {trackError && <p className="text-red-400 text-sm mt-4">{trackError}</p>}

      {trackResult && (
        <div className={`mt-8 pt-6 border-t border-white/5 ${styles.animateFadeInUp}`}>
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-['Inter']">Vehículo</p>
              <p className="text-xl font-['JetBrains_Mono'] text-white tracking-widest">{trackResult.patente}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-['Inter']">Servicio</p>
              <p className="text-sm font-['Inter'] text-gray-300">{trackResult.servicio}</p>
            </div>
          </div>

          <div className="relative pl-4 mt-6">
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-white/10 rounded-full"></div>
            {pasos.map((paso, idx) => {
              const isPast = paso.id < trackResult.paso;
              const isActive = paso.id === trackResult.paso;
              return (
                <div key={paso.id} className={`relative flex items-center gap-4 mb-6 last:mb-0 ${isActive ? 'opacity-100' : isPast ? 'opacity-50' : 'opacity-20'}`}>
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500"
                    style={{ backgroundColor: isActive || isPast ? paso.color_activo : '#374151', boxShadow: isActive ? `0 0 15px ${paso.color_activo}` : 'none' }}
                  >
                    {isPast && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                    {isActive && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
                  </div>
                  <div>
                    <p className={`font-['Rajdhani'] font-bold text-lg ${isActive ? 'text-white' : 'text-gray-300'}`}>{paso.label}</p>
                    {isActive && trackResult.estimacion && <p className="text-xs text-[var(--accent)] font-['Inter'] mt-0.5">Estimado: {trackResult.estimacion}</p>}
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

function PresupuestoWizard({ businessId, servicios, accent, whatsapp, preselectedService }: { businessId?: string, servicios: any[], accent: string, whatsapp?: string, preselectedService?: string }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    marca: "", modelo: "", patente: "", km: "",
    servicio: "", descripcion: "", urgencia: "",
    nombre: "", telefono: "", email: ""
  });
  const [loading, setLoading] = useState(false);
  const [orden, setOrden] = useState("");

  useEffect(() => {
    if (preselectedService) {
      setFormData(prev => ({ ...prev, servicio: preselectedService }));
      // Optional: setStep(2) if you want it to jump, but sticking to step 1 is safer
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
            patente: formData.patente
          })
        });
        if (!res.ok) throw new Error("Failed to submit");
      }
      
      // Generate order number
      const orderNum = Math.random().toString(36).substring(2, 8).toUpperCase();
      setOrden(orderNum);
      setStep(4); // Confirmation
    } catch (e) {
      console.error(e);
      alert("Hubo un error al enviar el presupuesto. Por favor intentá por WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!whatsapp) return;
    const msg = `Hola! Solicito presupuesto. Orden: ${orden}\n*Vehículo:* ${formData.marca} ${formData.modelo} (${formData.patente})\n*Servicio:* ${formData.servicio}\n*Problema:* ${formData.descripcion}`;
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (step === 4) {
    return (
      <div className="bg-[#1A1F2E] rounded-2xl p-6 sm:p-8 border border-[var(--accent)]/20 shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_8%,transparent)] w-full text-center">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
        <h3 className="font-['Rajdhani'] text-2xl font-bold uppercase text-white mb-2">Solicitud Enviada</h3>
        <p className="text-gray-400 font-['Inter'] text-sm mb-6">Tu código de seguimiento es:</p>
        <div className="bg-black/30 border border-white/10 rounded-lg p-4 mb-6">
          <span className="font-['JetBrains_Mono'] text-3xl text-[var(--accent)] tracking-widest">{orden}</span>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigator.clipboard.writeText(orden)} className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg font-['Rajdhani'] uppercase tracking-widest font-bold transition-colors">
            Copiar Código
          </button>
          {whatsapp && (
            <button onClick={handleWhatsApp} className="bg-[#25D366] text-black py-3 rounded-lg font-['Rajdhani'] uppercase tracking-widest font-bold transition-colors flex justify-center items-center gap-2">
              Enviar por WhatsApp
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1F2E] rounded-2xl p-6 sm:p-8 border border-[var(--accent)]/20 shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_8%,transparent)] w-full flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-['Rajdhani'] text-xl font-bold text-white uppercase tracking-wider">Pedí tu presupuesto</h3>
        <div className="flex gap-1">
          {[1,2,3].map(i => (
            <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i === step ? 'bg-[var(--accent)]' : i < step ? 'bg-[var(--accent)]/40' : 'bg-white/10'}`}></div>
          ))}
        </div>
      </div>

      <div className="flex-1">
        {step === 1 && (
          <div className={`space-y-4 ${styles.animateFadeInUp}`}>
            <div>
              <label className="block text-xs font-['Inter'] text-gray-400 mb-1.5">Marca</label>
              <select value={formData.marca} onChange={e => updateForm('marca', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)] appearance-none">
                <option value="" className="bg-neutral-900">Seleccionar...</option>
                {["Volkswagen", "Ford", "Chevrolet", "Renault", "Fiat", "Toyota", "Honda", "Peugeot", "Citroen", "Otro"].map(m => (
                  <option key={m} value={m} className="bg-neutral-900">{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-['Inter'] text-gray-400 mb-1.5">Modelo y Año</label>
              <input type="text" value={formData.modelo} onChange={e => updateForm('modelo', e.target.value)} placeholder="Ej: Gol Trend 2019" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-['Inter'] text-gray-400 mb-1.5">Patente</label>
                <input type="text" value={formData.patente} onChange={e => updateForm('patente', e.target.value)} placeholder="AB123CD" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-['JetBrains_Mono'] uppercase tracking-widest outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-xs font-['Inter'] text-gray-400 mb-1.5">Kilometraje</label>
                <input type="text" value={formData.km} onChange={e => updateForm('km', e.target.value)} placeholder="75.000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-['JetBrains_Mono'] outline-none focus:border-[var(--accent)]" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={`space-y-4 ${styles.animateFadeInUp}`}>
            <div>
              <label className="block text-xs font-['Inter'] text-gray-400 mb-1.5">Tipo de servicio</label>
              <select value={formData.servicio} onChange={e => updateForm('servicio', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)] appearance-none">
                <option value="" className="bg-neutral-900">Seleccionar...</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.name} className="bg-neutral-900">{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-['Inter'] text-gray-400 mb-1.5">Describí el problema</label>
              <textarea value={formData.descripcion} onChange={e => updateForm('descripcion', e.target.value)} rows={3} placeholder="Ruido al frenar, vibra en las curvas..." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)] resize-none" />
            </div>
            <div>
              <label className="block text-xs font-['Inter'] text-gray-400 mb-2">¿Cuándo lo necesitás?</label>
              <div className="flex flex-col gap-2">
                {["Hoy o mañana", "Esta semana", "Sin urgencia"].map(u => (
                  <label key={u} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${formData.urgencia === u ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                    <input type="radio" name="urgencia" value={u} checked={formData.urgencia === u} onChange={e => updateForm('urgencia', e.target.value)} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.urgencia === u ? 'border-[var(--accent)]' : 'border-gray-500'}`}>
                      {formData.urgencia === u && <div className="w-2 h-2 rounded-full bg-[var(--accent)]"></div>}
                    </div>
                    <span className="text-sm font-['Inter'] text-white">{u}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={`space-y-4 ${styles.animateFadeInUp}`}>
            <div>
              <label className="block text-xs font-['Inter'] text-gray-400 mb-1.5">Nombre y Apellido</label>
              <input type="text" value={formData.nombre} onChange={e => updateForm('nombre', e.target.value)} placeholder="Juan García" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-['Inter'] text-gray-400 mb-1.5">WhatsApp / Teléfono</label>
              <input type="tel" value={formData.telefono} onChange={e => updateForm('telefono', e.target.value)} placeholder="+54 9 11..." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-['Inter'] text-gray-400 mb-1.5">Email (opcional)</label>
              <input type="email" value={formData.email} onChange={e => updateForm('email', e.target.value)} placeholder="juan@email.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-['Inter'] outline-none focus:border-[var(--accent)]" />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} className="px-4 py-2.5 text-sm font-['Rajdhani'] font-bold uppercase tracking-wider text-white border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
            Volver
          </button>
        )}
        <button 
          onClick={() => step < 3 ? setStep(s => s + 1) : handleSubmit()} 
          disabled={loading || (step === 1 && !formData.marca) || (step === 3 && !formData.nombre)}
          className="flex-1 bg-[var(--accent)] text-black px-4 py-2.5 text-sm font-['Rajdhani'] font-bold uppercase tracking-wider rounded-lg hover:brightness-110 transition-colors disabled:opacity-50"
        >
          {loading ? "Enviando..." : step < 3 ? "Siguiente" : "Solicitar Presupuesto"}
        </button>
      </div>
    </div>
  );
}

function BeforeAfterSlider({ before, after, titulo }: { before: string, after: string, titulo: string }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div className="flex flex-col gap-2">
      <div 
        ref={containerRef}
        className="relative w-full aspect-video rounded-xl overflow-hidden select-none cursor-ew-resize group border border-white/10 shadow-xl"
        onPointerMove={(e) => { if(e.buttons === 1) handleMove(e.clientX); }}
        onPointerDown={(e) => handleMove(e.clientX)}
      >
        <img src={after} alt={`${titulo} After`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        <div className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
          <img src={before} alt={`${titulo} Before`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        </div>
        <div className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10" style={{ left: `calc(${sliderPos}% - 2px)` }}>
          <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-md shadow-black/30 group-hover:scale-110 transition-transform">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180"><path d="M15 18l-6-6 6-6"/></svg>
          </div>
        </div>
      </div>
      <p className="text-center font-['Rajdhani'] font-bold tracking-widest uppercase text-white/80">{titulo}</p>
    </div>
  );
}

// ─── MAIN TEMPLATE ───

export default function TallerTemplate(props: { negocio: any; media?: any[]; businessId?: string; sections?: any[] }) {
  const { negocio, media = [], businessId } = props;
  const accent = negocio?.accentColor || negocio?.primaryColor || "#F59E0B";

  const servicios = negocio?.layoutConfig?.tallerServices || negocio?.layoutConfig?.barberiaServices || [];
  const categorias = Array.from(new Set(servicios.map((s: any) => s.categoria).filter(Boolean)));
  const [activeCategory, setActiveCategory] = useState<string>(categorias[0] as string || "Todos");
  const [preselectedService, setPreselectedService] = useState("");

  const stats = negocio?.layoutConfig?.stats || { anios: 10, clientes: 5000, trabajos: 15000 };
  const heroText = negocio?.layoutConfig?.heroText || "Especialistas en el cuidado y mantenimiento de tu vehículo. Diagnóstico preciso, reparaciones rápidas y con garantía total.";
  const badgeText = negocio?.layoutConfig?.badge || "🔧 Taller Certificado";
  const garantiaMeses = negocio?.layoutConfig?.garantiaMeses || 6;
  const repuestosMarcas = negocio?.layoutConfig?.marcasRepuestos || ['Bosch', 'NGK', 'SKF', 'Monroe', 'Valeo', 'LUK'];
  const certificaciones = negocio?.layoutConfig?.certificaciones || ['Mecánicos Certificados', 'Diagnóstico Computarizado', 'Garantía Escrita'];
  const beforeAfter = negocio?.layoutConfig?.beforeAfter || [];
  
  const address = negocio?.address || negocio?.layoutConfig?.address || "";
  const mapUrl = negocio?.mapUrl || negocio?.layoutConfig?.mapUrl || "";
  const hours = negocio?.layoutConfig?.hours;

  const handleReservarClick = (serviceName?: string) => {
    if (typeof serviceName === 'string') {
      setPreselectedService(serviceName);
    }
    document.getElementById("presupuesto")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Rajdhani:wght@400;500;600;700&display=swap');
        html { scroll-behavior: smooth; }
      `}</style>

      <div className="min-h-screen bg-[#0D0D0D] text-[#F3F4F6] font-['Inter'] relative overflow-x-hidden selection:bg-[var(--accent)] selection:text-black pb-20 md:pb-0" style={{ "--accent": accent } as React.CSSProperties}>
        {/* Navbar simplificado */}
        <nav className="fixed top-0 w-full z-50 px-4 sm:px-6 md:px-12 py-4 flex justify-between items-center bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            {negocio?.logoUrl && <img src={negocio.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-md" />}
            <span className="font-['Rajdhani'] text-xl font-bold uppercase tracking-widest text-white">
              {negocio?.name || "Taller Mecánico"}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-['Rajdhani'] font-bold tracking-widest uppercase text-sm">
            <button onClick={() => scrollToSection("servicios")} className="hover:text-[var(--accent)] transition-colors">Servicios</button>
            <button onClick={() => scrollToSection("tracking")} className="hover:text-[var(--accent)] transition-colors">Estado del Vehículo</button>
            {beforeAfter.length > 0 && <button onClick={() => scrollToSection("galeria")} className="hover:text-[var(--accent)] transition-colors">Galería</button>}
          </div>
          <button onClick={() => handleReservarClick()} className="bg-[var(--accent)] text-black font-['Rajdhani'] font-bold uppercase tracking-widest px-5 py-2 rounded shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:brightness-110 transition-all text-sm">
            Presupuesto
          </button>
        </nav>

        {/* HERO SECTION */}
        <section id="presupuesto" className="relative min-h-[100svh] pt-24 pb-12 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto flex flex-col justify-center">
          <div className={`absolute inset-0 pointer-events-none ${styles.hexPattern}`}></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 lg:gap-16 items-center relative z-10 w-full h-full">
            {/* Lado Izquierdo */}
            <div className="flex flex-col pt-12 lg:pt-0">
              <div className={`inline-flex items-center gap-2 bg-[#1A1F2E] border border-[var(--accent)]/30 rounded-full px-4 py-1.5 text-xs font-['Rajdhani'] font-bold uppercase tracking-widest text-[var(--accent)] w-fit mb-6 ${styles.animateFadeInUp}`}>
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse"></span>
                {badgeText}
              </div>

              <h1 className={`font-['Rajdhani'] text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-6 ${styles.animateFadeInUp} ${styles.delay100}`}>
                <span className="block text-white">TU AUTO /</span>
                <span className="block text-[var(--accent)]">{negocio?.name?.split(' ')[0] || "NUESTRO"} EXPERTO</span>
              </h1>

              <p className={`text-gray-400 font-['Inter'] text-lg sm:text-xl max-w-xl mb-10 leading-relaxed ${styles.animateFadeInUp} ${styles.delay200}`}>
                {heroText}
              </p>

              {/* Stats */}
              <div className={`grid grid-cols-3 gap-6 pt-8 border-t border-white/10 ${styles.animateFadeInUp} ${styles.delay300}`}>
                <StatsCounter value={stats.anios} label="Años Exp." prefix="+" />
                <StatsCounter value={stats.clientes} label="Clientes" prefix="+" />
                <StatsCounter value={stats.trabajos} label="Trabajos" prefix="+" />
              </div>
            </div>

            {/* Lado Derecho (Widget) */}
            <div className={`${styles.animateFadeInUp} ${styles.delay200} h-full`}>
              <PresupuestoWizard businessId={businessId} servicios={servicios} accent={accent} whatsapp={negocio?.whatsapp} preselectedService={preselectedService} />
            </div>
          </div>
        </section>

        {/* TRACKING SECTION */}
        <section id="tracking" className="relative py-20 px-4 sm:px-6 md:px-12 bg-[#111827] border-y border-white/5">
          <div className="max-w-7xl mx-auto text-center">
            <p className="font-['JetBrains_Mono'] text-[var(--accent)] uppercase tracking-widest text-sm mb-4">Módulo de Seguimiento</p>
            <h2 className="font-['Rajdhani'] text-4xl sm:text-5xl font-black uppercase tracking-wider text-white">¿En qué estado está <br/><span className="text-gray-500">mi vehículo?</span></h2>
            <TrackingWidget businessId={businessId} accent={accent} />
          </div>
        </section>

        {/* SERVICIOS SECTION */}
        <section id="servicios" className="relative py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-['Rajdhani'] text-4xl sm:text-5xl font-black uppercase tracking-wider text-white mb-6">Nuestros Servicios</h2>
            <div className={`${styles.railLine} max-w-md mx-auto opacity-50`}></div>
          </div>

          {/* Categorias Filtro */}
          {categorias.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide snap-x">
              <button 
                onClick={() => setActiveCategory("Todos")}
                className={`snap-start whitespace-nowrap px-6 py-2 rounded-full font-['Rajdhani'] font-bold uppercase tracking-widest text-sm border transition-all ${activeCategory === "Todos" ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-transparent text-white border-white/20 hover:border-[var(--accent)]/50'}`}
              >
                Todos
              </button>
              {categorias.map(cat => (
                <button 
                  key={cat as string}
                  onClick={() => setActiveCategory(cat as string)}
                  className={`snap-start whitespace-nowrap px-6 py-2 rounded-full font-['Rajdhani'] font-bold uppercase tracking-widest text-sm border transition-all ${activeCategory === cat ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-transparent text-white border-white/20 hover:border-[var(--accent)]/50'}`}
                >
                  {cat as string}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {servicios
              .filter((s: any) => activeCategory === "Todos" || s.categoria === activeCategory)
              .map((srv: any, idx: number) => (
              <div key={srv.id || idx} className="group flex flex-col sm:flex-row gap-5 p-6 bg-[#1A1F2E] border border-white/5 rounded-2xl hover:border-[var(--accent)]/40 hover:-translate-y-1 transition-all duration-300 shadow-lg relative overflow-hidden">
                {srv.badge && (
                  <div className="absolute top-4 right-4 bg-[var(--accent)] text-black text-[10px] font-['Rajdhani'] font-bold uppercase tracking-widest px-3 py-1 rounded-full z-10">
                    {srv.badge.replace('-', ' ')}
                  </div>
                )}
                <div className="w-16 h-16 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] text-3xl flex items-center justify-center shrink-0 shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_10%,transparent)] group-hover:scale-110 transition-transform">
                  {srv.emoji || "🔧"}
                </div>
                <div className="flex-1">
                  <h3 className="font-['Rajdhani'] text-2xl font-bold text-white uppercase tracking-wider pr-16 leading-tight mb-2">{srv.name}</h3>
                  <p className="text-sm text-gray-400 font-['Inter'] mb-4 line-clamp-2">{srv.desc}</p>
                  
                  {srv.items && srv.items.length > 0 && (
                    <details className="mb-4 text-sm font-['Inter'] group/details">
                      <summary className="text-[var(--accent)] cursor-pointer hover:underline font-medium list-none flex items-center gap-2">
                        Ver detalles
                        <svg className="w-4 h-4 transition-transform group-open/details:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </summary>
                      <ul className="mt-2 space-y-1 pl-2 border-l-2 border-[var(--accent)]/30">
                        {srv.items.map((item: string, i: number) => (
                          <li key={i} className="text-gray-300 text-xs flex items-center gap-2">
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
                      {srv.duration && <span className="font-['JetBrains_Mono'] text-xs text-gray-500 uppercase tracking-widest">{srv.duration} Min</span>}
                      <button onClick={() => handleReservarClick(srv.name)} className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg transition-colors" title="Solicitar Presupuesto">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* GARANTÍAS SECTION */}
        <section className="bg-[#111827] py-20 px-4 border-y border-white/5">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-[#1A1F2E] rounded-2xl border border-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-3xl mb-4 border border-[var(--accent)]/30 text-[var(--accent)]">🛡️</div>
              <h3 className="font-['Rajdhani'] text-xl font-bold uppercase tracking-wider text-white mb-2">Garantía Escrita</h3>
              <p className="text-sm text-gray-400 font-['Inter']">Todos nuestros trabajos cuentan con <strong>{garantiaMeses} meses</strong> de garantía escrita.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-[#1A1F2E] rounded-2xl border border-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-3xl mb-4 border border-[var(--accent)]/30 text-[var(--accent)]">⚙️</div>
              <h3 className="font-['Rajdhani'] text-xl font-bold uppercase tracking-wider text-white mb-2">Repuestos Originales</h3>
              <p className="text-sm text-gray-400 font-['Inter']">Trabajamos con primeras marcas: {repuestosMarcas.join(', ')}.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-[#1A1F2E] rounded-2xl border border-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-3xl mb-4 border border-[var(--accent)]/30 text-[var(--accent)]">🎓</div>
              <h3 className="font-['Rajdhani'] text-xl font-bold uppercase tracking-wider text-white mb-2">Certificaciones</h3>
              <p className="text-sm text-gray-400 font-['Inter']">{certificaciones.join(' • ')}</p>
            </div>
          </div>
        </section>

        {/* GALERÍA / ANTES Y DESPUÉS */}
        {beforeAfter && beforeAfter.length > 0 && (
          <section id="galeria" className="py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
             <div className="text-center mb-16">
              <p className="font-['JetBrains_Mono'] text-[var(--accent)] uppercase tracking-widest text-sm mb-4">Resultados Comprobables</p>
              <h2 className="font-['Rajdhani'] text-4xl sm:text-5xl font-black uppercase tracking-wider text-white mb-6">Nuestros Trabajos</h2>
              <div className={`${styles.railLine} max-w-md mx-auto opacity-50`}></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {beforeAfter.map((ba: any, idx: number) => (
                <BeforeAfterSlider key={ba.id || idx} before={ba.before} after={ba.after} titulo={ba.titulo} />
              ))}
            </div>
          </section>
        )}

        {/* ─── VIDEO ─── */}
        <VideoSection
          videoUrl={negocio?.layoutConfig?.videoUrl || (props.sections?.find((s: any) => s.id === "video")?.config?.youtubeUrl)}
          accentColor={accent}
          theme="dark"
        />

        {/* FOOTER */}
        <footer className="bg-[#0D0D0D] border-t border-white/10 pt-16 pb-8 px-4 sm:px-6 md:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                {negocio?.logoUrl && <img src={negocio.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-md grayscale opacity-80" />}
                <span className="font-['Rajdhani'] text-xl font-bold uppercase tracking-widest text-white">
                  {negocio?.name || "Taller Mecánico"}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-['Inter'] mb-6">{negocio?.description || heroText}</p>
              <div className="flex gap-4">
                {/* Redes simplificadas */}
                {negocio?.instagram && <a href={`https://instagram.com/${negocio.instagram}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[var(--accent)] transition-colors">IG</a>}
                {negocio?.facebook && <a href={`https://facebook.com/${negocio.facebook}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[var(--accent)] transition-colors">FB</a>}
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
                  <div key={dia} className="flex justify-between text-sm font-['JetBrains_Mono'] border-b border-white/5 py-2">
                    <span className="capitalize text-gray-400">{dia}</span>
                    <span className="text-white">{h.from} - {h.to}</span>
                  </div>
                );
              })}
            </div>

            <div>
              <h4 className="font-['Rajdhani'] text-lg font-bold uppercase tracking-widest text-white mb-6">Ubicación</h4>
              <p className="text-sm text-gray-400 font-['Inter'] mb-6 flex items-start gap-2">
                <span className="text-[var(--accent)]">📍</span> {address || "Av. Siempre Viva 123, Ciudad"}
              </p>
              {mapUrl && (
                <div className="w-full h-40 rounded-xl overflow-hidden border border-white/10 opacity-80 hover:opacity-100 transition-opacity">
                   <iframe src={mapUrl} className="w-full h-full border-none" loading="lazy"></iframe>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center border-t border-white/5 pt-8">
            <p className="font-['JetBrains_Mono'] text-xs text-gray-600 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} {negocio?.name}. Todos los derechos reservados.
            </p>
          </div>
        </footer>

        {negocio?.whatsapp && <WhatsAppFAB phone={negocio.whatsapp} message="Hola! Quisiera hacer una consulta por mi vehículo." />}

        {/* ── MOBILE STICKY BUTTON ── */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0D0D0D] border-t border-white/10 p-4">
          <button 
            onClick={() => handleReservarClick()}
            className="w-full bg-[var(--accent)] text-black font-['Rajdhani'] font-bold text-lg uppercase tracking-widest py-3 rounded-lg hover:brightness-110 active:scale-95 transition-all"
          >
            Solicitar Presupuesto
          </button>
        </div>
      </div>
    </>
  );
}