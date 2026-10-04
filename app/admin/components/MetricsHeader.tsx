"use client";

import React from "react";
import { AdminBusiness, formatCurrency } from "./adminTypes";
import { Coins, Users, Clock, AlertTriangle, TrendingUp } from "lucide-react";

export interface MetricsHeaderProps {
  businesses: AdminBusiness[];
  totalBusinesses: number;
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({
  businesses,
  totalBusinesses,
}) => {
  // Compute metrics
  const activeCount = businesses.filter((b) => b.status === "ACTIVE").length;
  const demoCount = businesses.filter((b) => b.status === "DEMO" || b.status === "TRIAL").length;

  // Demos expiring in next 72 hours
  const now = Date.now();
  const in72h = now + 72 * 60 * 60 * 1000;
  const expiringSoonCount = businesses.filter((b) => {
    if (b.status !== "DEMO" && b.status !== "TRIAL") return false;
    if (!b.demoExpiresAt) return false;
    const exp = new Date(b.demoExpiresAt).getTime();
    return exp > now && exp <= in72h;
  }).length;

  // Total MRR estimated
  const mrrEstimated = businesses
    .filter((b) => b.status === "ACTIVE")
    .reduce((acc, b) => acc + (b.paymentAmount || 15000), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. MRR */}
      <div className="p-5 rounded-2xl bg-[#0E131F] border border-white/5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            MRR Estimado
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-white tabular-nums">
            {formatCurrency(mrrEstimated, "MX")}
          </div>
          <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Cobros recurrentes activos</span>
          </p>
        </div>
      </div>

      {/* 2. Clientes Activos */}
      <div className="p-5 rounded-2xl bg-[#0E131F] border border-white/5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Clientes Activos
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-white tabular-nums">
            {activeCount}{" "}
            <span className="text-xs font-normal text-slate-500">/ {totalBusinesses} total</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Suscripciones comerciales</p>
        </div>
      </div>

      {/* 3. Demos por Vencer (72h) */}
      <div className="p-5 rounded-2xl bg-[#0E131F] border border-white/5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Demos por Vencer
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-amber-400 tabular-nums">
            {expiringSoonCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Vencen en menos de 72 hs</p>
        </div>
      </div>

      {/* 4. Demos Totales */}
      <div className="p-5 rounded-2xl bg-[#0E131F] border border-white/5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            En Demostración
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-purple-400 tabular-nums">
            {demoCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Oportunidades de cierre</p>
        </div>
      </div>
    </div>
  );
};
