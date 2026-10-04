export interface AdminBusiness {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string | null;
  type: string;
  status: "ACTIVE" | "DEMO" | "BLOCKED" | "TRIAL" | "ARCHIVED";
  paymentStatus?: "paid" | "pending" | "overdue" | null;
  paymentAmount?: number | null;
  country?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  demoExpiresAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  notes?: { id: string; text: string; date: string }[];
  logoUrl?: string | null;
  description?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export const RUBRO_META: Record<string, { label: string; icon: string; color: string }> = {
  barberia: { label: "Barbería", icon: "✂️", color: "#a78bfa" },
  estetica: { label: "Estética", icon: "💎", color: "#f472b6" },
  cancha: { label: "Canchas", icon: "⚽", color: "#34d399" },
  menu: { label: "Gastronomía", icon: "🍽️", color: "#fb923c" },
  gimnasio: { label: "Gimnasio", icon: "🏋️", color: "#38bdf8" },
  clinica: { label: "Clínica", icon: "🏥", color: "#f87171" },
  taller: { label: "Taller Mecánico", icon: "🔧", color: "#94a3b8" },
  lavadero: { label: "Lavadero", icon: "🚗", color: "#0ea5e9" },
  tienda: { label: "Tienda Virtual", icon: "🛍️", color: "#6366f1" },
  general: { label: "General", icon: "🏢", color: "#facc15" },
};

export const STATUS_META: Record<string, { label: string; color: string; badge: string }> = {
  ACTIVE: { label: "Activo", color: "#2DD4A4", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  DEMO: { label: "Demo", color: "#F5B544", badge: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  TRIAL: { label: "Trial", color: "#F5B544", badge: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  BLOCKED: { label: "Bloqueado", color: "#F2637E", badge: "bg-red-500/10 text-red-400 border-red-500/20" },
  ARCHIVED: { label: "Archivado", color: "#94A3B8", badge: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

export const PAY_STATUS_META: Record<string, { label: string; badge: string }> = {
  paid: { label: "Al día", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  pending: { label: "Pendiente", badge: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  overdue: { label: "Vencido", badge: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export function formatCurrency(amount: number | null | undefined, country = "MX"): string {
  const n = Number(amount || 0);
  const isAr = country === "AR";
  const locale = isAr ? "es-AR" : "es-MX";
  const currency = isAr ? "ARS" : "MXN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(dateStr: string | null | undefined, country = "MX"): string {
  if (!dateStr) return "—";
  const locale = country === "AR" ? "es-AR" : "es-MX";
  return new Date(dateStr).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
