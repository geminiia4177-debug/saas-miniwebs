"use client";

import React, { useState, useEffect } from "react";

export interface BusinessHours {
  [key: string]: { open: boolean; from: string; to: string } | undefined;
}

interface OpenNowBadgeProps {
  hours?: BusinessHours;
  compact?: boolean;
}

export default function OpenNowBadge({ hours, compact = false }: OpenNowBadgeProps) {
  const [status, setStatus] = useState<{
    isOpen: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!hours) return;

    const calculateStatus = () => {
      const ahora = new Date();
      const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaActual = dias[ahora.getDay()];
      const horasHoy = hours[diaActual];

      const parseTime = (timeStr: string) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      if (!horasHoy?.open) {
        // Encontrar próximo día abierto
        let proximoDia = "";
        let horaApertura = "";
        for (let i = 1; i <= 7; i++) {
          const nextIdx = (ahora.getDay() + i) % 7;
          const checkDia = dias[nextIdx];
          if (hours[checkDia]?.open) {
            proximoDia = checkDia;
            horaApertura = hours[checkDia]!.from;
            break;
          }
        }
        setStatus({
          isOpen: false,
          text: proximoDia ? `Cerrado · Abre el ${proximoDia} a las ${horaApertura}` : "Cerrado"
        });
        return;
      }

      const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
      const openTime = parseTime(horasHoy.from);
      const closeTime = parseTime(horasHoy.to);

      if (minutosActuales >= openTime && minutosActuales < closeTime) {
        setStatus({
          isOpen: true,
          text: `Abierto ahora · Cierra a las ${horasHoy.to}`
        });
      } else if (minutosActuales < openTime) {
         setStatus({
          isOpen: false,
          text: `Cerrado · Abre hoy a las ${horasHoy.from}`
        });
      } else {
        // Encontrar próximo día abierto
        let proximoDia = "";
        let horaApertura = "";
        for (let i = 1; i <= 7; i++) {
          const nextIdx = (ahora.getDay() + i) % 7;
          const checkDia = dias[nextIdx];
          if (hours[checkDia]?.open) {
            proximoDia = checkDia === diaActual && i === 7 ? "" : checkDia; // Si es el mismo dia, no aplica
            horaApertura = hours[checkDia]!.from;
            break;
          }
        }
        setStatus({
          isOpen: false,
          text: proximoDia ? `Cerrado · Abre el ${proximoDia} a las ${horaApertura}` : "Cerrado"
        });
      }
    };

    calculateStatus();
    const interval = setInterval(calculateStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [hours]);

  if (!status) return null; // Avoid hydration mismatch

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" title={status.text}>
        <span className={`relative flex h-2.5 w-2.5`}>
          {status.isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </span>
        <span className="text-xs font-medium truncate">{status.text.split('·')[0].trim()}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${status.isOpen ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
      <span className={`relative flex h-2 w-2`}>
        {status.isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${status.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
      </span>
      {status.text}
    </div>
  );
}
