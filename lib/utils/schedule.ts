export interface DaySchedule {
  open: boolean;
  from: string;
  to: string;
}

export type BusinessHours = Record<string, DaySchedule | undefined>;

export interface ScheduleStatus {
  isOpen: boolean;
  badgeText: string;
  suggestedActionText: string;
  nextOpenDay?: string;
  nextOpenHour?: string;
}

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getScheduleStatus(hours?: BusinessHours): ScheduleStatus {
  if (!hours || typeof hours !== "object" || Object.keys(hours).length === 0) {
    return {
      isOpen: true,
      badgeText: "Atención comercial habitual",
      suggestedActionText: "Reservar Turno",
    };
  }

  const now = new Date();
  const currentDay = DIAS[now.getDay()];
  const todaySchedule = hours[currentDay];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Helper to find the next open day
  const findNextOpen = () => {
    for (let i = 1; i <= 7; i++) {
      const nextIdx = (now.getDay() + i) % 7;
      const dayName = DIAS[nextIdx];
      const sched = hours[dayName];
      if (sched?.open) {
        return {
          day: i === 1 ? "mañana" : dayName,
          hour: sched.from,
        };
      }
    }
    return null;
  };

  if (!todaySchedule?.open) {
    const next = findNextOpen();
    return {
      isOpen: false,
      badgeText: next
        ? `Cerrado hoy · Abre ${next.day} a las ${next.hour}`
        : "Cerrado temporalmente",
      suggestedActionText: next
        ? `Reservar para ${next.day}`
        : "Dejanos tu consulta",
      nextOpenDay: next?.day,
      nextOpenHour: next?.hour,
    };
  }

  const openMinutes = parseTimeToMinutes(todaySchedule.from);
  const closeMinutes = parseTimeToMinutes(todaySchedule.to);

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return {
      isOpen: true,
      badgeText: `Abierto ahora · Cierra a las ${todaySchedule.to}`,
      suggestedActionText: "Reservar Turno Hoy",
    };
  } else if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      badgeText: `Cerrado · Abre hoy a las ${todaySchedule.from}`,
      suggestedActionText: "Agendar para más tarde",
      nextOpenDay: "hoy",
      nextOpenHour: todaySchedule.from,
    };
  } else {
    const next = findNextOpen();
    return {
      isOpen: false,
      badgeText: next
        ? `Cerrado por hoy · Abre ${next.day} a las ${next.hour}`
        : "Cerrado por hoy",
      suggestedActionText: next
        ? `Reservar para ${next.day}`
        : "Dejanos tu consulta",
      nextOpenDay: next?.day,
      nextOpenHour: next?.hour,
    };
  }
}
