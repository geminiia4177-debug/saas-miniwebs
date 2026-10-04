"use client";

import React from "react";
import { X, Printer } from "lucide-react";

export interface ThermalReceiptModalProps {
  order: any | null;
  bizName: string;
  bizPhone?: string;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  order,
  bizName,
  bizPhone,
  onClose,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = Array.isArray(order.items) ? order.items : [];
  const dateFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleString("es-AR")
    : new Date().toLocaleString("es-AR");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative space-y-4 animate-scaleIn text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Ticket Térmico (58/80 mm)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Printable Ticket Receipt */}
        <div
          id="thermal-receipt"
          className="p-4 bg-white text-black font-mono text-[11px] rounded-xl space-y-2 border border-slate-300 shadow-inner"
          style={{ width: "100%", maxWidth: "80mm", margin: "0 auto" }}
        >
          <div className="text-center pb-2 border-b border-dashed border-black">
            <h4 className="font-bold text-sm uppercase">{bizName}</h4>
            {bizPhone && <p className="text-[10px]">Tel: {bizPhone}</p>}
            <p className="text-[9px] text-slate-600 mt-1">{dateFormatted}</p>
            <p className="font-bold text-xs mt-1">Ticket #{String(order.id).slice(-6).toUpperCase()}</p>
          </div>

          <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-black">
            <p><strong>Cliente:</strong> {order.customerName}</p>
            {order.customerPhone && <p><strong>Tel:</strong> {order.customerPhone}</p>}
            <p><strong>Entrega:</strong> {order.type || order.deliveryType || "Local"}</p>
            {order.address && <p><strong>Dir:</strong> {order.address}</p>}
          </div>

          {/* Items */}
          <div className="space-y-1 py-1 border-b border-dashed border-black">
            {items.map((it: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <span className="truncate max-w-[150px]">
                  {it.qty}x {it.nombre || it.name}
                  {it.talle ? ` (${it.talle})` : ""}
                </span>
                <span className="tabular-nums">${Number(it.precio * it.qty).toLocaleString("es-AR")}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 pt-1 font-bold text-xs">
            {order.shippingCost ? (
              <div className="flex justify-between font-normal text-[10px]">
                <span>Envío:</span>
                <span>${Number(order.shippingCost).toLocaleString("es-AR")}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm">
              <span>TOTAL:</span>
              <span className="tabular-nums">${Number(order.total || 0).toLocaleString("es-AR")}</span>
            </div>
          </div>

          <div className="text-center pt-2 text-[9px] text-slate-600 border-t border-dashed border-black">
            ¡Muchas gracias por su compra!
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Ticket</span>
        </button>
      </div>
    </div>
  );
};
