"use client";

import React, { useState, useMemo } from "react";
import {
  AdminBusiness,
  RUBRO_META,
  STATUS_META,
  PAY_STATUS_META,
  formatCurrency,
  formatDate,
} from "./adminTypes";
import {
  Search,
  ExternalLink,
  ChevronRight,
  Phone,
  ArrowUpDown,
  Filter,
  SlidersHorizontal,
} from "lucide-react";

export interface ClientTableProps {
  businesses: AdminBusiness[];
  onSelectBusiness: (b: AdminBusiness) => void;
  onRefresh: () => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  businesses,
  onSelectBusiness,
}) => {
  const [search, setSearch] = useState("");
  const [filterRubro, setFilterRubro] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "expires" | "mrr">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filtering
  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.subdomain.toLowerCase().includes(q) ||
        (b.email || "").toLowerCase().includes(q) ||
        (b.phone || "").includes(q);

      const matchesRubro = filterRubro === "all" || b.type === filterRubro;
      const matchesStatus = filterStatus === "all" || b.status === filterStatus;
      const matchesPayment = filterPayment === "all" || b.paymentStatus === filterPayment;
      const matchesCountry = filterCountry === "all" || (b.country || "MX") === filterCountry;

      return matchesSearch && matchesRubro && matchesStatus && matchesPayment && matchesCountry;
    });
  }, [businesses, search, filterRubro, filterStatus, filterPayment, filterCountry]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === "mrr") {
        cmp = (a.paymentAmount || 0) - (b.paymentAmount || 0);
      } else if (sortBy === "expires") {
        const da = a.demoExpiresAt ? new Date(a.demoExpiresAt).getTime() : 0;
        const db = b.demoExpiresAt ? new Date(b.demoExpiresAt).getTime() : 0;
        cmp = da - db;
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortBy, sortOrder]);

  const toggleSort = (field: "name" | "createdAt" | "expires" | "mrr") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const padY = density === "compact" ? "py-2 px-3" : "py-3.5 px-4";

  return (
    <div className="flex flex-col gap-4">
      {/* ── FILTER & SEARCH BAR ── */}
      <div className="p-4 rounded-2xl bg-[#0E131F] border border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs shadow-lg">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, subdominio o teléfono..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter Selects */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Rubro */}
          <select
            value={filterRubro}
            onChange={(e) => setFilterRubro(e.target.value)}
            className="bg-[#11182B] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos los rubros</option>
            {Object.entries(RUBRO_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#11182B] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="DEMO">Demo</option>
            <option value="TRIAL">Trial</option>
            <option value="BLOCKED">Bloqueados</option>
          </select>

          {/* Country */}
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="bg-[#11182B] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white cursor-pointer focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos los países</option>
            <option value="MX">🇲🇽 México</option>
            <option value="AR">🇦🇷 Argentina</option>
          </select>

          {/* Density Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 sm:ml-auto">
            <button
              type="button"
              onClick={() => setDensity("compact")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                density === "compact" ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              Compacta
            </button>
            <button
              type="button"
              onClick={() => setDensity("comfortable")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                density === "comfortable" ? "bg-white text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              Cómoda
            </button>
          </div>
        </div>
      </div>

      {/* ── CLIENT TABLE ── */}
      <div className="bg-[#0E131F] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#11182B] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/5 select-none">
              <tr>
                <th
                  onClick={() => toggleSort("name")}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Negocio</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Rubro</th>
                <th className="p-3.5">País</th>
                <th
                  onClick={() => toggleSort("mrr")}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Abono MRR</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort("expires")}
                  className="p-3.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Vencimiento</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    No se encontraron clientes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                sorted.map((biz) => {
                  const rubro = RUBRO_META[biz.type] || RUBRO_META.general;
                  const status = STATUS_META[biz.status] || STATUS_META.ACTIVE;
                  const countryCode = biz.country || "MX";

                  return (
                    <tr
                      key={biz.id}
                      onClick={() => onSelectBusiness(biz)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      {/* Name & Subdomain */}
                      <td className={padY}>
                        <div className="flex items-center gap-3">
                          {biz.logoUrl ? (
                            <img
                              src={biz.logoUrl}
                              alt={biz.name}
                              className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-500/20">
                              {biz.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                              {biz.name}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400 truncate block">
                              /{biz.subdomain}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rubro */}
                      <td className={padY}>
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                          <span>{rubro.icon}</span>
                          <span>{rubro.label}</span>
                        </span>
                      </td>

                      {/* Country */}
                      <td className={padY}>
                        <span className="text-xs">
                          {countryCode === "AR" ? "🇦🇷 AR" : "🇲🇽 MX"}
                        </span>
                      </td>

                      {/* MRR */}
                      <td className={padY}>
                        <span className="font-mono font-bold text-white tabular-nums">
                          {formatCurrency(biz.paymentAmount, countryCode)}
                        </span>
                      </td>

                      {/* Demo Expiration */}
                      <td className={padY}>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {formatDate(biz.demoExpiresAt, countryCode)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className={padY}>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.badge}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className={`${padY} text-right space-x-2`} onClick={(e) => e.stopPropagation()}>
                        {/* Ver como cliente (authorized preview) */}
                        <a
                          href={`/${biz.subdomain}?preview=true`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-semibold border border-white/10 transition-colors"
                          title="Ver como cliente (preview autorizado)"
                        >
                          <span>Ver</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {biz.whatsapp && (
                          <a
                            href={`https://wa.me/${biz.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                            title="Contactar por WhatsApp"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectBusiness(biz)}
                          className="inline-flex p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                          title="Ver detalle"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
