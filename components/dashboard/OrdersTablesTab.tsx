"use client";

import React, { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { getPublicUrl } from "@/lib/urls";
import { OrderKanbanView } from "./orders/OrderKanbanView";
import { ThermalReceiptModal } from "./orders/ThermalReceiptModal";
import {
  ShoppingBag,
  Grid,
  List,
  Volume2,
  VolumeX,
  Printer,
  Plus,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";

export default function OrdersTablesTab({
  biz,
  showToast,
}: {
  biz: any;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const isTienda = biz?.type === "tienda";
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "tables">("kanban");
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printOrder, setPrintOrder] = useState<any | null>(null);
  const prevOrdersCount = useRef<number>(0);

  // Sound alert using Web Audio API synthesis
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isTienda) {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          if (list.length > prevOrdersCount.current && prevOrdersCount.current > 0) {
            playAlertSound();
            showToast("¡Nuevo pedido recibido! 🎉", "success");
          }
          prevOrdersCount.current = list.length;
          setOrders(list);
        }
      } else {
        const [ordRes, tabRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/tables"),
        ]);
        const ordData = await ordRes.json();
        const tabData = await tabRes.json();
        const list = Array.isArray(ordData) ? ordData : [];
        if (list.length > prevOrdersCount.current && prevOrdersCount.current > 0) {
          playAlertSound();
          showToast("¡Nuevo pedido recibido! 🎉", "success");
        }
        prevOrdersCount.current = list.length;
        setOrders(list);
        setTables(Array.isArray(tabData) ? tabData : []);
      }
    } catch {
      showToast("Error al cargar pedidos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000); // Polling every 20s
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, status }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
        showToast("Estado del pedido actualizado ✓", "success");
      }
    } catch {
      showToast("Error al actualizar pedido", "error");
    }
  };

  const addTable = async () => {
    try {
      const res = await fetch("/api/tables", { method: "POST" });
      if (res.ok) {
        const newTable = await res.json();
        setTables([...tables, newTable]);
        showToast("Mesa agregada correctamente ✓", "success");
      }
    } catch {
      showToast("Error al agregar mesa", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 md:pb-12 max-w-7xl">
      {/* ── TOP CONTROLS BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0E131F] border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {isTienda ? "Gestión de Pedidos de Tienda" : "Gestión de Pedidos & Mesas"}
            </h2>
            <p className="text-xs text-slate-400">{orders.length} pedidos registrados en total</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "kanban" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            {!isTienda && (
              <button
                type="button"
                onClick={() => setViewMode("tables")}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "tables" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Mesas QR</span>
              </button>
            )}
          </div>

          {/* Sound alert toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playAlertSound();
            }}
            className={`p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
              soundEnabled
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
            }`}
            title={soundEnabled ? "Sonido activado" : "Sonido desactivado"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Actualizar pedidos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── KANBAN VIEW ── */}
      {viewMode === "kanban" && (
        <OrderKanbanView
          orders={orders}
          onUpdateStatus={updateOrderStatus}
          onPrintTicket={setPrintOrder}
        />
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && (
        <div className="bg-[#0E131F] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#121A2C] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-white/5">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Total</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No hay pedidos registrados
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-white">
                      #{String(ord.id).slice(-5).toUpperCase()}
                    </td>
                    <td className="p-4 font-semibold text-white">{ord.customerName}</td>
                    <td className="p-4 capitalize">{ord.type || ord.deliveryType || "Local"}</td>
                    <td className="p-4 font-bold text-white tabular-nums">
                      ${Number(ord.total || 0).toLocaleString("es-AR")}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setPrintOrder(ord)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                        title="Imprimir ticket"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TABLES QR VIEW ── */}
      {viewMode === "tables" && !isTienda && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Mesas & Códigos QR</h3>
            <button
              type="button"
              onClick={addTable}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Mesa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tables.map((table) => {
              const tableUrl = getPublicUrl(biz, { path: `/?mesa=${table.number}` });

              return (
                <div
                  key={table.id}
                  className="p-4 rounded-2xl bg-[#0E131F] border border-white/5 space-y-3 text-center"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">Mesa #{table.number}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                      {table.status === "OPEN" ? "Activa" : "Libre"}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl mx-auto w-32 h-32 flex items-center justify-center">
                    <QRCodeCanvas value={tableUrl} size={110} />
                  </div>

                  <p className="text-[10px] text-slate-500 font-mono truncate">{tableUrl}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── THERMAL RECEIPT MODAL ── */}
      <ThermalReceiptModal
        order={printOrder}
        bizName={biz?.name || "Miniweb"}
        bizPhone={biz?.whatsapp || biz?.phone}
        onClose={() => setPrintOrder(null)}
      />
    </div>
  );
}
