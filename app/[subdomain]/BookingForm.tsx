"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, User, Phone, Check } from "lucide-react";

interface BookingFormProps {
  businessId: string;
  primaryColor?: string;
  secondaryColor?: string;
  services: string[];
  categories?: { name: string; items: string[] }[];
  theme?: "light" | "dark";
  staff?: any[];
  preselectedService?: string;
  variant?: string;
}

const VARIANT_CONFIG: Record<string, { step1Title: string; step1Label: string; step2Title: string; step3Title: string; confirmBtn: string; successMsg: string; icon: string }> = { 
  barberia: { step1Title: '¿Qué servicio querés?', step1Label: 'Elegí el corte o tratamiento', step2Title: '¿Cuándo venís?', step3Title: 'Tus datos', confirmBtn: 'Confirmar turno ✂️', successMsg: '¡Tu turno está confirmado!', icon: '✂️' }, 
  lavadero: { step1Title: '¿Qué lavado para tu vehículo?', step1Label: 'Seleccioná el servicio', step2Title: '¿Cuándo traés el auto?', step3Title: 'Confirmá tu reserva', confirmBtn: 'Reservar lugar 🚗', successMsg: '¡Reserva confirmada! Tu auto queda en las mejores manos.', icon: '🚗' }, 
  cancha: { step1Title: '¿Qué cancha querés?', step1Label: 'Elegí la cancha disponible', step2Title: '¿Cuándo juegan?', step3Title: 'Datos del responsable', confirmBtn: 'Reservar cancha ⚽', successMsg: '¡Cancha reservada! Los esperamos para el partido.', icon: '⚽' }, 
  clinica: { step1Title: '¿Qué especialidad buscás?', step1Label: 'Seleccioná la consulta', step2Title: '¿Cuándo es tu cita?', step3Title: 'Tus datos de contacto', confirmBtn: 'Confirmar cita 🏥', successMsg: '¡Cita confirmada! Recordá traer tu documentación.', icon: '🏥' }, 
  estetica: { step1Title: '¿Qué tratamiento te gustaría?', step1Label: 'Elegí tu servicio', step2Title: '¿Qué fecha te queda mejor?', step3Title: 'Tus datos', confirmBtn: 'Reservar mi turno 💆', successMsg: '¡Reserva confirmada! Nos vemos pronto.', icon: '💆' }, 
  gimnasio: { step1Title: '¿Qué clase querés agendar?', step1Label: 'Elegí tu actividad', step2Title: '¿Cuándo vas a entrenar?', step3Title: 'Tus datos', confirmBtn: 'Agendar clase 💪', successMsg: '¡Clase agendada! Llegá 5 minutos antes.', icon: '💪' }, 
  general: { step1Title: '¿Qué servicio necesitás?', step1Label: 'Seleccioná una opción', step2Title: 'Elegí fecha y horario', step3Title: 'Tus datos de contacto', confirmBtn: 'Confirmar reserva', successMsg: '¡Reserva confirmada! Pronto te contactamos.', icon: '📅' } 
};

export default function BookingForm({ businessId, primaryColor, secondaryColor, services, categories = [], theme = "light", staff = [], preselectedService, variant }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const config = VARIANT_CONFIG[variant || "general"] || VARIANT_CONFIG["general"];
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    serviceName: preselectedService || "",
    employeeId: "any",
    date: "",
    time: "",
    paymentMethod: "LOCAL"
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedService) {
      setForm(prev => ({ ...prev, serviceName: preselectedService }));
      setStep(2);
    }
  }, [preselectedService]);

  // If no categories are provided and we have services, default to the first service
  useEffect(() => {
    if (!categories || categories.length === 0) {
      if (services && services.length > 0 && !form.serviceName && !preselectedService) {
        setForm(prev => ({ ...prev, serviceName: services[0] }));
      }
    }
  }, [categories, services, preselectedService]);

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsFetched, setSlotsFetched] = useState(false);
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [bankDetails, setBankDetails] = useState<string | null>(null);

  const isDark = theme === "dark";
  const pColor = primaryColor || "#4f46e5";

  useEffect(() => {
    // Generar 14 días a partir de hoy para el calendario
    const today = new Date();
    const days = Array.from({ length: 14 }).map((_, i) => addDays(today, i));
    setCalendarDays(days);
    
    // Fetch business details to see if they support transfers
    if (businessId && businessId !== "demo") {
      fetch(`/api/businesses/${businessId}`)
        .then(res => res.json())
        .then(data => {
          if (data?.layoutConfig?.bankDetails) {
            setBankDetails(data.layoutConfig.bankDetails);
          }
        })
        .catch(() => {});
    }
  }, [businessId]);

  // Buscar horarios al cambiar la fecha seleccionada
  useEffect(() => {
    if (!form.date || !form.serviceName) {
      setSlots([]);
      setSlotsFetched(false);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setForm(prev => ({ ...prev, time: "" }));
      
      if (businessId === "demo") {
        setTimeout(() => {
          setSlots(["12:00", "12:30", "13:00", "20:00", "20:30", "21:00", "21:30"]);
          setLoadingSlots(false);
          setSlotsFetched(true);
        }, 800);
        return;
      }

      try {
        const empQuery = form.employeeId !== "any" ? `&employeeId=${form.employeeId}` : "";
        const res = await fetch(`/api/appointments/slots?businessId=${businessId}&date=${form.date}&serviceName=${encodeURIComponent(form.serviceName)}${empQuery}`);
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        } else {
          setSlots([]);
        }
      } catch (err) {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
        setSlotsFetched(true);
      }
    };

    fetchSlots();
  }, [form.date, form.serviceName, form.employeeId, businessId]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 0 && !val.startsWith("54")) {
      val = "54" + val;
    }
    let formatted = val;
    if (val.length > 2) {
      formatted = "+" + val.substring(0, 2) + " " + val.substring(2);
    }
    if (val.length > 3) {
      formatted = "+" + val.substring(0, 2) + " " + val.substring(2, 3) + " " + val.substring(3);
    }
    if (val.length > 5) {
      formatted = "+" + val.substring(0, 2) + " " + val.substring(2, 3) + " " + val.substring(3, 5) + " " + val.substring(5);
    }
    if (val.length > 9) {
      formatted = "+" + val.substring(0, 2) + " " + val.substring(2, 3) + " " + val.substring(3, 5) + " " + val.substring(5, 9) + "-" + val.substring(9, 13);
    }
    setForm({ ...form, phone: formatted.substring(0, 19) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.time || !form.date || !form.name || !form.phone) return;
    
    setLoading(true);

    if (businessId === "demo") {
      setTimeout(() => {
        setSuccess(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: [pColor, secondaryColor || "#10b981", "#ffffff"]
        });
        setTimeout(() => {
          setSuccess(false);
          setStep(1);
          setSelectedCategory(null);
          setForm({ name: "", phone: "", serviceName: (!categories || categories.length === 0) ? (services[0] || "") : "", employeeId: "any", date: "", time: "", paymentMethod: "LOCAL" });
        }, 3500);
        setLoading(false);
      }, 1500);
      return;
    }

    const fechaYHoraCombinada = new Date(`${form.date}T${form.time}:00`).toISOString();

    const payload: any = {
      businessId,
      clientName: form.name,
      clientPhone: form.phone,
      serviceName: form.serviceName,
      date: fechaYHoraCombinada,
      status: "PENDING",
      paymentMethod: form.paymentMethod
    };

    if (form.employeeId !== "any") {
      payload.employeeId = form.employeeId;
    }

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: [pColor, secondaryColor || "#10b981", "#ffffff"]
        });
        setTimeout(() => {
          setSuccess(false);
          setStep(1);
          setSelectedCategory(null);
          setForm({ name: "", phone: "", serviceName: (!categories || categories.length === 0) ? (services[0] || "") : "", employeeId: "any", date: "", time: "", paymentMethod: "LOCAL" });
        }, 6000);
      } else {
        alert("Hubo un error al reservar el turno. Por favor, intenta de nuevo.");
      }
    } catch (error) {
      alert("Error de conexión. Revisa tu internet.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = isDark
    ? "w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30 transition-all text-base"
    : "w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-base";

  const labelClass = isDark
    ? "block text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"
    : "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2";

  // Render Success State
  if (success) {
    return (
      <div className={`rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center justify-center text-center ${isDark ? "bg-[#111] border border-[#222]" : "bg-white border border-slate-100"}`}>
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className={`text-2xl font-black mb-3 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
          {config.successMsg.split('!')[0]}!
        </h3>
        <p className={`mb-6 ${isDark ? "text-white/60" : "text-slate-500"}`}>
          {config.successMsg.includes('!') && config.successMsg.split('!')[1].trim().length > 0 && (
            <span className="block mb-2 font-medium">{config.successMsg.split('!').slice(1).join('!').trim()}</span>
          )}
          Te esperamos el <strong>{format(new Date(`${form.date}T${form.time}:00`), "EEEE d 'de' MMMM", { locale: es })}</strong> a las <strong>{form.time}hs</strong> para tu {form.serviceName}.
        </p>
        <button onClick={() => setSuccess(false)} className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}>
          Hacer otra reserva
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl shadow-xl flex flex-col text-left overflow-hidden ${isDark ? "bg-[#111] border border-white/5" : "bg-white border border-slate-100"}`}>
      
      {/* Stepper Header */}
      <div className={`px-6 py-5 border-b flex justify-between items-center ${isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50/50"}`}>
        <div className="flex items-center gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === i 
                  ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20" 
                  : step > i 
                    ? "bg-emerald-500 text-white" 
                    : isDark ? "bg-white/5 text-white/30" : "bg-slate-100 text-slate-400"
              }`} style={(step === i || step > i) ? { backgroundColor: step > i ? "#10b981" : pColor, color: (step === i && isDark) ? "#000" : "#fff" } : {}}>
                {step > i ? <Check className="w-4 h-4" /> : i}
              </div>
              {i < 3 && <div className={`w-4 h-px ${step > i ? "bg-emerald-500" : isDark ? "bg-white/10" : "bg-slate-200"}`}></div>}
            </div>
          ))}
        </div>
        <div className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-slate-400"}`}>
          Paso {step} de 3
        </div>
      </div>

      <div className="p-6 sm:p-8">
        
        {/* PASO 1: Servicio y Profesional */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <label className={labelClass}><span className="text-lg leading-none">{config.icon}</span> {config.step1Title}</label>
              
              {categories && categories.length > 0 ? (
                !selectedCategory ? (
                  <div className="grid gap-3 mt-3">
                    {categories.map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`text-left px-5 py-4 rounded-2xl border-2 transition-all flex justify-between items-center ${
                          isDark ? "border-white/5 bg-white/5 hover:border-white/20" : "border-slate-100 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <span className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{cat.name}</span>
                        <ChevronRight className={`w-5 h-5 ${isDark ? "text-white/30" : "text-slate-400"}`} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3">
                    <button 
                      onClick={() => { setSelectedCategory(null); setForm({...form, serviceName: ""}); }}
                      className={`mb-4 text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-opacity ${isDark ? "text-white/50 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}
                    >
                      <ChevronLeft className="w-4 h-4" /> Volver a categorías
                    </button>
                    <div className="grid gap-3">
                      {categories.find(c => c.name === selectedCategory)?.items.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setForm({ ...form, serviceName: s })}
                          className={`text-left px-5 py-4 rounded-2xl border-2 transition-all flex justify-between items-center ${
                            form.serviceName === s 
                              ? `border-[var(--accent)] bg-[var(--accent)]/5` 
                              : isDark ? "border-white/5 bg-white/5 hover:border-white/20" : "border-slate-100 bg-slate-50 hover:border-slate-300"
                          }`}
                          style={form.serviceName === s ? { borderColor: pColor, backgroundColor: `${pColor}10` } : {}}
                        >
                          <span className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{s}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.serviceName === s ? "border-[var(--accent)]" : isDark ? "border-white/20" : "border-slate-300"}`} style={form.serviceName === s ? { borderColor: pColor } : {}}>
                            {form.serviceName === s && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pColor }}></div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="grid gap-3 mt-3">
                  {services.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setForm({ ...form, serviceName: s })}
                      className={`text-left px-5 py-4 rounded-2xl border-2 transition-all flex justify-between items-center ${
                        form.serviceName === s 
                          ? `border-[var(--accent)] bg-[var(--accent)]/5` 
                          : isDark ? "border-white/5 bg-white/5 hover:border-white/20" : "border-slate-100 bg-slate-50 hover:border-slate-300"
                      }`}
                      style={form.serviceName === s ? { borderColor: pColor, backgroundColor: `${pColor}10` } : {}}
                    >
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{s}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.serviceName === s ? "border-[var(--accent)]" : isDark ? "border-white/20" : "border-slate-300"}`} style={form.serviceName === s ? { borderColor: pColor } : {}}>
                        {form.serviceName === s && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pColor }}></div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {staff.length > 0 && (
              <div>
                <label className={labelClass}><User className="w-4 h-4" /> ¿Con quién?</label>
                <select 
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className={`${inputClass} appearance-none cursor-pointer mt-3`}
                >
                  <option value="any">Cualquiera disponible</option>
                  {staff.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button 
              onClick={() => setStep(2)}
              disabled={!form.serviceName}
              className="w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: pColor, color: isDark ? "#000" : "#fff" }}
            >
              Continuar <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* PASO 2: Fecha y Horario */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div>
              <label className={labelClass}><CalendarIcon className="w-4 h-4" /> {config.step2Title}</label>
              <div className="overflow-x-auto pb-4 -mx-2 px-2 snap-x hide-scrollbar">
                <div className="flex gap-2 min-w-max">
                  {calendarDays.map((d, i) => {
                    const dateStr = format(d, "yyyy-MM-dd");
                    const isSelected = form.date === dateStr;
                    return (
                      <button
                        key={i}
                        onClick={() => setForm({ ...form, date: dateStr })}
                        className={`flex flex-col items-center justify-center w-[72px] h-[88px] rounded-2xl border transition-all snap-center ${
                          isSelected 
                            ? "border-[var(--accent)] shadow-md" 
                            : isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                        }`}
                        style={isSelected ? { borderColor: pColor, backgroundColor: isDark ? `${pColor}20` : `${pColor}10` } : {}}
                      >
                        <span className={`text-xs font-bold uppercase ${isSelected ? "text-[var(--accent)]" : isDark ? "text-white/40" : "text-slate-400"}`} style={isSelected ? { color: pColor } : {}}>
                          {format(d, "EEE", { locale: es })}
                        </span>
                        <span className={`text-2xl font-black mt-1 ${isSelected ? (isDark ? "text-white" : "text-slate-900") : (isDark ? "text-white/80" : "text-slate-700")}`}>
                          {format(d, "d")}
                        </span>
                        <span className={`text-[10px] uppercase font-bold mt-1 ${isSelected ? "text-[var(--accent)]" : isDark ? "text-white/40" : "text-slate-400"}`} style={isSelected ? { color: pColor } : {}}>
                          {format(d, "MMM", { locale: es })}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {form.date && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className={labelClass}><Clock className="w-4 h-4" /> Horarios disponibles</label>
                {loadingSlots ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-[var(--accent)] rounded-full animate-spin" style={{ borderTopColor: pColor }}></div>
                  </div>
                ) : slotsFetched && slots.length === 0 ? (
                  <div className={`p-4 rounded-xl text-center text-sm font-medium ${isDark ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-100"}`}>
                    Lo sentimos, no quedan turnos este día. Elegí otra fecha.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3">
                    {slots.map((slot, i) => {
                      const isSelected = form.time === slot;
                      // Simular color coding basado en el índice (solo demo visual)
                      const isLastSlots = i > slots.length - 3;
                      
                      return (
                        <button
                          key={slot}
                          onClick={() => setForm({ ...form, time: slot })}
                          className={`py-3 px-2 rounded-xl text-sm font-bold transition-all relative ${
                            isSelected
                              ? "text-white shadow-md shadow-[var(--accent)]/30 scale-105 z-10"
                              : isDark
                                ? "bg-white/5 hover:bg-white/10 text-white/90 border border-white/5"
                                : "bg-white border border-slate-200 hover:border-slate-300 text-slate-700"
                          }`}
                          style={isSelected ? { backgroundColor: pColor, borderColor: pColor, color: isDark ? "#000" : "#fff" } : {}}
                        >
                          {slot}
                          {!isSelected && isLastSlots && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-white dark:border-[#111]"></span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setStep(1)}
                className={`px-5 py-4 rounded-xl font-bold flex items-center justify-center transition-colors ${isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={!form.date || !form.time}
                className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: pColor, color: isDark ? "#000" : "#fff" }}
              >
                Continuar <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Datos de Contacto */}
        {step === 3 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
            
            <div className={`p-4 rounded-2xl mb-6 ${isDark ? "bg-white/5 border border-white/10" : "bg-slate-50 border border-slate-100"}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? "text-[var(--accent)]" : "text-indigo-600"}`} style={{ color: pColor }}>{config.step3Title}</p>
              <p className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-800"}`}>{form.serviceName}</p>
              <p className={`text-sm mt-1 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                {form.date ? format(new Date(`${form.date}T12:00:00`), "EEEE d 'de' MMMM", { locale: es }) : ""} a las {form.time}hs
              </p>
            </div>

            <div>
              <label className={labelClass}><User className="w-4 h-4" /> Nombre y Apellido</label>
              <input 
                type="text" 
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Juan Pérez" 
                className={inputClass} 
                autoComplete="name"
                autoCapitalize="words"
              />
            </div>

            <div>
              <label className={labelClass}><Phone className="w-4 h-4" /> Teléfono / WhatsApp</label>
              <input 
                type="tel" 
                required
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={handlePhoneChange}
                placeholder="+52 55 1234 5678" 
                className={inputClass} 
              />
            </div>

            {bankDetails && (
              <div>
                <label className={labelClass}><CheckCircle2 className="w-4 h-4" /> Forma de Pago / Seña</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: 'LOCAL' })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      form.paymentMethod === 'LOCAL'
                        ? 'border-[var(--accent)] shadow-sm'
                        : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={form.paymentMethod === 'LOCAL' ? { borderColor: pColor, backgroundColor: isDark ? `${pColor}20` : `${pColor}10` } : {}}
                  >
                    <span className={`block font-bold text-sm ${isDark ? "text-white" : "text-slate-800"}`}>Abono en el local</span>
                    <span className={`block text-xs mt-1 ${isDark ? "text-white/50" : "text-slate-500"}`}>Efectivo o tarjeta ahí</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: 'TRANSFER' })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      form.paymentMethod === 'TRANSFER'
                        ? 'border-[var(--accent)] shadow-sm'
                        : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={form.paymentMethod === 'TRANSFER' ? { borderColor: pColor, backgroundColor: isDark ? `${pColor}20` : `${pColor}10` } : {}}
                  >
                    <span className={`block font-bold text-sm ${isDark ? "text-white" : "text-slate-800"}`}>Transferencia</span>
                    <span className={`block text-xs mt-1 ${isDark ? "text-white/50" : "text-slate-500"}`}>Seña para confirmar</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className={`px-5 py-4 rounded-xl font-bold flex items-center justify-center transition-colors ${isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading || !form.name || form.phone.length < 10}
                className="flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 relative overflow-hidden group"
                style={{ backgroundColor: pColor, color: isDark ? "#000" : "#fff" }}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative flex items-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>{config.confirmBtn}</>
                  )}
                </span>
              </button>
            </div>
            
            {/* WhatsApp Fallback */}
            <div className="text-center mt-6">
              <a href="#" className={`text-xs font-bold uppercase tracking-widest hover:underline ${isDark ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>
                O reservar por WhatsApp
              </a>
            </div>

          </div>
        )}
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}