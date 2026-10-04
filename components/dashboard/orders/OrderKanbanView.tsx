"use client";

import React from "react";
import { Clock, Check, ArrowRight, Printer, Phone } from "lucide-react";

export interface OrderKanbanViewProps {
  orders: any[];
  onUpdateStatus: (orderId: string, nextStatus: string) => void;
  onPrintTicket: (order: any) => void;
}

export const OrderKanbanView: React.FC<OrderKanbanViewProps> = ({
  orders,
  onUpdateStatus,
  onPrintTicket,
}) => {
  const COLUMNS = [
    { id: "PENDING", label: "Pendientes", color: "border-amber-500/30 bg-amber-500/5", badge: "bg-amber-500/20 text-amber-300", next: "CONFIRMED", nextLabel: "Aceptar" },
    { id: "CONFIRMED", label: "En Preparación", color: "border-indigo-500/30 bg-indigo-500/5", badge: "bg-indigo-500/20 text-indigo-300", next: "READY", nextLabel: "Listo" },
    { id: "READY", label: "Listo para Entrega", color: "border-emerald-500/30 bg-emerald-500/5", badge: "bg-emerald-500/20 text-emerald-300", next: "COMPLETED", nextLabel: "Entregar" },
    { id: "COMPLETED", label: "Entregados", color: "border-white/10 bg-white/5", badge: "bg-white/10 text-slate-300", next: null, nextLabel: null },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const colOrders = orders.filter((o) => {
          if (col.id === "READY") return o.status === "READY" || o.status === "READY_TO_DELIVER";
          return o.status === col.id;
        });

        return (
          <div
            key={col.id}
            className={`p-4 rounded-2xl border ${col.color} flex flex-col justify-between min-h-[450px] space-y-3`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {col.label}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                {colOrders.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
              {colOrders.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs italic">
                  Sin pedidos
                </div>
              ) : (
                colOrders.map((ord) => {
                  const items = Array.isArray(ord.items) ? ord.items : [];

                  return (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-xl bg-[#0E1526] border border-white/10 shadow-md space-y-2.5 group hover:border-indigo-500/40 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-400">
                          #{String(ord.id).slice(-5).toUpperCase()}
                        </span>
                        <span className="font-bold text-white tabular-nums">
                          ${Number(ord.total || 0).toLocaleString("es-AR")}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-white leading-tight">{ord.customerName}</h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {ord.type || ord.deliveryType || "Local"} • {items.length} productos
                        </p>
                      </div>

                      {/* Items peek */}
                      <div className="text-[10px] text-slate-400 space-y-0.5 bg-white/5 p-2 rounded-lg">
                        {items.slice(0, 2).map((it: any, idx: number) => (
                          <div key={idx} className="truncate">
                            {it.qty}x {it.nombre || it.name}
                          </div>
                        ))}
                        {items.length > 2 && (
                          <span className="text-slate-500 italic">+{items.length - 2} más...</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/5 gap-1">
                        <button
                          type="button"
                          onClick={() => onPrintTicket(ord)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title="Imprimir ticket"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {ord.customerPhone && (
                          <a
                            href={`https://wa.me/${ord.customerPhone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            title="Chatear por WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {col.next && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(ord.id, col.next as string)}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            <span>{col.nextLabel}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
