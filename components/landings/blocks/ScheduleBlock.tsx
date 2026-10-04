import React, { useMemo } from "react";
import { NormalizedScheduleDay } from "@/lib/templates/contract";
import { Clock, CheckCircle2 } from "lucide-react";

export interface ScheduleBlockProps {
  schedule: NormalizedScheduleDay[];
  title?: string;
  subtitle?: string;
}

export const ScheduleBlock: React.FC<ScheduleBlockProps> = ({
  schedule,
  title = "Horarios de Atención",
  subtitle = "Vení a conocernos o coordiná tu visita en nuestros días y horarios comerciales.",
}) => {
  // Compute if currently open (client-side heuristic)
  const isOpenNow = useMemo(() => {
    const now = new Date();
    const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday...
    const dayMap = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const currentDayKey = dayMap[dayIndex];
    const todaySchedule = schedule.find((s) => s.day === currentDayKey);

    if (!todaySchedule || !todaySchedule.enabled) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = (todaySchedule.open || "09:00").split(":").map(Number);
    const [closeH, closeM] = (todaySchedule.close || "18:00").split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }, [schedule]);

  if (!schedule || schedule.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-white/5">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10">
            <span
              className={`w-2 h-2 rounded-full ${isOpenNow ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`}
            />
            <span className={isOpenNow ? "text-emerald-300 font-bold" : "text-slate-400 font-medium"}>
              {isOpenNow ? "Abierto ahora" : "Cerrado por el momento"}
            </span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{title}</h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1526] border border-white/5 shadow-xl divide-y divide-white/5">
          {schedule.map((day) => (
            <div key={day.day} className="py-3.5 flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-white capitalize">{day.label}</span>
              {day.enabled ? (
                <span className="text-slate-300 font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {day.open} - {day.close} hs
                  </span>
                </span>
              ) : (
                <span className="text-slate-500 italic">Cerrado</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
