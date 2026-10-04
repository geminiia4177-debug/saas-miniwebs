"use client";

import React, { useState, useEffect } from "react";
import { Ico } from "@/lib/constants";
import { QRCodeCanvas } from "qrcode.react";

export default function OrdersTablesTab({ biz, showToast }: { biz: any; showToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const isTienda = biz?.type === "tienda";
  const [activeTab, setActiveTab] = useState<"orders" | "tables">("orders");
  const [orderFilter, setOrderFilter] = useState<"ALL" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED">("ALL");
  const [orders, setOrders] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [tableStats, setTableStats] = useState<{ day: number, week: number, month: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchTableStats = async (tableId: string) => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/tables/${tableId}/stats`);
      if (res.ok) {
        setTableStats(await res.json());
      }
    } catch(e) {}
    setStatsLoading(false);
  };

  const openTableDetails = (table: any) => {
    setSelectedTable(table);
    setPaymentMethod("Efectivo");
    setTableStats(null);
    fetchTableStats(table.id);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isTienda) {
        const ordRes = await fetch(`/api/orders`);
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          setOrders(Array.isArray(ordData) ? ordData : []);
        }
      } else {
        const [ordRes, tabRes] = await Promise.all([
          fetch(`/api/orders`),
          fetch(`/api/tables`),
        ]);
        const ordData = await ordRes.json();
        const tabData = await tabRes.json();
        setOrders(Array.isArray(ordData) ? ordData : []);
        setTables(Array.isArray(tabData) ? tabData : []);
      }
    } catch (e) {
      showToast("Error al cargar datos", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addTable = async () => {
    try {
      const res = await fetch("/api/tables", { method: "POST" });
      if (res.ok) {
        const newTable = await res.json();
        setTables([...tables, newTable]);
        showToast("Mesa agregada correctamente ✓", "success");
      }
    } catch (e) {
      showToast("Error al agregar mesa", "error");
    }
  };

  const updateTableStatus = async (id: string, status: string, method?: string, cancelOrders?: boolean) => {
    try {
      const res = await fetch("/api/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: id, status, paymentMethod: method, cancelOrders })
      });
      if (res.ok) {
        setTables(tables.map(t => t.id === id ? { ...t, status } : t));
        if (status === "CLOSED") {
          fetchData();
        }
        if (selectedTable?.id === id) setSelectedTable(null);
        showToast(`Mesa ${status === "OPEN" ? "abierta" : "cerrada"}`, "success");
      }
    } catch (e) {
      showToast("Error al actualizar mesa", "error");
    }
  };

  const downloadQR = (tableNumber: number) => {
    const canvas = document.querySelector(`#qr-canvas-${tableNumber} canvas`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR_Mesa_${tableNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, status })
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
        showToast(`Pedido actualizado`, "success");
      }
    } catch (e) {
      showToast("Error al actualizar pedido", "error");
    }
  };

  const copyEmployeeLink = () => {
    const link = biz.customDomain ? `https://${biz.customDomain}/pedidos?token=${biz.id}` : `https://${biz.subdomain}.saas-miniwebs.vercel.app/pedidos?token=${biz.id}`;
    navigator.clipboard.writeText(link);
    showToast("Link copiado al portapapeles", "success");
  };

  const filteredOrders = orders.filter(o => {
    if (orderFilter === "ALL") return true;
    return o.status === orderFilter;
  });

  const paymentLabels: Record<string, { label: string; icon: string; cls: string }> = {
    acordar: { label: "A acordar con vendedor", icon: "💵", cls: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
    mercadopago: { label: "Mercado Pago", icon: "💙", cls: "bg-sky-500/10 text-sky-300 border-sky-500/20" },
    stripe: { label: "Stripe", icon: "💳", cls: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
    paypal: { label: "PayPal", icon: "🅿️", cls: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
    efectivo: { label: "Efectivo", icon: "💵", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
    transferencia: { label: "Transferencia", icon: "🏦", cls: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Ico n="loader" s={24} c="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 animate-fadeIn max-w-6xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isTienda ? "🛍️" : "🍽️"}</span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isTienda ? "Pedidos de la Tienda" : "Pedidos y Mesas"}
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {isTienda
              ? "Gestiona las compras, clientes, pagos y envíos de tu tienda virtual en tiempo real."
              : "Gestiona tus pedidos en tiempo real y el estado de tus mesas."}
          </p>
        </div>

        {!isTienda ? (
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "orders" ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "bg-white/5 text-slate-400 hover:text-white"}`}
            >
              Pedidos Activos
            </button>
            <button 
              onClick={() => setActiveTab("tables")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "tables" ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "bg-white/5 text-slate-400 hover:text-white"}`}
            >
              Gestión de Mesas
            </button>
          </div>
        ) : (
          <button
            onClick={fetchData}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Ico n="refresh-cw" s={14} c="text-indigo-400" /> Actualizar
          </button>
        )}
      </div>

      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* ACCESS LINK BAR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-xl" style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.1))", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div>
              <h3 className="font-bold text-white text-sm mb-0.5">Acceso para Despacho / Empleados</h3>
              <p className="text-xs text-slate-400">
                {isTienda 
                  ? "Tu equipo puede ver los pedidos entrantes y despacharlos en vivo desde este link protegido."
                  : "Tus empleados pueden usar este link para ver y confirmar pedidos sin acceder a este panel."}
              </p>
            </div>
            <button onClick={copyEmployeeLink} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap">
              Copiar Link
            </button>
          </div>

          {/* STATUS FILTERS */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "Todos", count: orders.length },
              { id: "PENDING", label: "Pendientes", count: orders.filter(o => o.status === "PENDING").length },
              { id: "CONFIRMED", label: "En Preparación", count: orders.filter(o => o.status === "CONFIRMED").length },
              { id: "COMPLETED", label: "Entregados", count: orders.filter(o => o.status === "COMPLETED").length },
              { id: "CANCELLED", label: "Cancelados", count: orders.filter(o => o.status === "CANCELLED").length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setOrderFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  orderFilter === f.id
                    ? "bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                    : "bg-[#131929] text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                <span>{f.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${orderFilter === f.id ? "bg-white/20 text-white" : "bg-white/5 text-slate-400"}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* ORDERS LIST */}
          <div className="grid gap-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 px-6 border-2 border-dashed border-white/5 rounded-3xl bg-[#131929]/50">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.2))" }}>
                  <span className="text-2xl">{isTienda ? "🛍️" : "🍽️"}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {orderFilter === "ALL" ? "Sin pedidos por ahora" : `No hay pedidos en estado "${orderFilter}"`}
                </h3>
                <p className="text-slate-400 max-w-sm mx-auto text-sm">
                  {isTienda
                    ? "Los pedidos realizados por tus clientes en la tienda virtual aparecerán aquí automáticamente."
                    : "Los pedidos que hagan tus clientes desde el menú digital o escaneando los QR de las mesas aparecerán aquí automáticamente."}
                </p>
              </div>
            ) : filteredOrders.map(order => {
              const isEnvio = order.type === "ENVIO" || order.type === "DELIVERY";
              const isRetiro = order.type === "RETIRO" || order.type === "TAKEAWAY";
              const isMesa = order.type === "MESA";

              const phoneDigits = order.customerPhone ? String(order.customerPhone).replace(/\D/g, "") : "";
              const waUrl = phoneDigits
                ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`¡Hola ${order.customerName || ''}! Te escribo de ${biz.name} respecto a tu pedido #${order.id.slice(-6).toUpperCase()}.`)}`
                : null;

              const payInfo = paymentLabels[order.paymentMethod?.toLowerCase()] || (order.paymentMethod ? { label: order.paymentMethod, icon: "💳", cls: "bg-slate-500/10 text-slate-300 border-slate-500/20" } : null);

              return (
                <div key={order.id} className="p-5 rounded-2xl bg-[#131929] border border-white/5 flex flex-col md:flex-row justify-between gap-5 transition-all hover:border-white/10">
                  <div className="flex-1 min-w-0">
                    {/* TOP BADGES */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs font-black text-slate-400 font-mono">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>

                      {/* DELIVERY BADGE */}
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                        isEnvio ? "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]" :
                        isMesa ? "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]" : "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                      }`}>
                        {isEnvio ? "🚚 Envío a Domicilio" : isMesa ? `🍽️ Mesa ${order.table?.number || "?"}` : "🛍️ Retiro en Local"}
                      </span>

                      {/* STATUS BADGE */}
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                        order.status === "PENDING" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]" :
                        order.status === "CONFIRMED" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]" :
                        order.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                      }`}>
                        {order.status === "PENDING" ? "Pendiente" : order.status === "CONFIRMED" ? "Preparando" : order.status === "COMPLETED" ? "Listo / Entregado" : "Cancelado"}
                      </span>

                      {/* PAYMENT BADGE */}
                      {payInfo && (
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1 ${payInfo.cls}`}>
                          <span>{payInfo.icon}</span>
                          <span>{payInfo.label}</span>
                        </span>
                      )}

                      <span className="text-xs text-slate-500 ml-auto font-mono">
                        {new Date(order.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}{" "}
                        {new Date(order.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* CUSTOMER INFO */}
                    {(order.customerName || order.customerPhone || order.address) && (
                      <div className="flex flex-wrap items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300 mb-3">
                        {order.customerName && (
                          <span className="font-semibold text-white flex items-center gap-1">
                            👤 {order.customerName}
                          </span>
                        )}
                        {order.customerPhone && (
                          <span className="flex items-center gap-1.5">
                            📱 {order.customerPhone}
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold text-[10px] transition-colors"
                              >
                                💬 WhatsApp
                              </a>
                            )}
                          </span>
                        )}
                        {order.address && isEnvio && (
                          <span className="text-slate-300 flex items-center gap-1">
                            📍 {order.address}
                          </span>
                        )}
                      </div>
                    )}

                    {/* ITEMS LIST */}
                    <div className="space-y-1.5 mb-3 bg-black/20 p-3 rounded-xl border border-white/5">
                      {order.items?.map((it: any, i: number) => {
                        const itemName = it.nombre || it.name || "Producto";
                        const itemPrice = it.precio ?? it.price ?? 0;
                        const variants = [
                          it.talle ? `Talle: ${it.talle}` : null,
                          it.color ? `Color: ${it.color}` : null,
                        ].filter(Boolean).join(" · ");

                        return (
                          <div key={i} className="text-sm text-slate-300 flex items-baseline justify-between">
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-white mr-1.5">{it.qty}x</span>
                              <span className="text-slate-200">{itemName}</span>
                              {variants && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-indigo-300 border border-white/5 inline-block">
                                  {variants}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400 font-mono text-xs whitespace-nowrap">
                              ${itemPrice * it.qty}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-black text-white">
                        Total: <span className="text-emerald-400">${order.total}</span>
                      </div>
                      {order.notes && (
                        <div className="text-xs text-slate-400 italic">
                          📝 &quot;{order.notes}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* ACTIONS COLUMN */}
                  <div className="flex flex-row md:flex-col gap-2 min-w-[150px] justify-center border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                    {order.status === "PENDING" && (
                      <button onClick={() => updateOrderStatus(order.id, "CONFIRMED")} className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                        Confirmar / Preparar
                      </button>
                    )}
                    {order.status === "CONFIRMED" && (
                      <button onClick={() => updateOrderStatus(order.id, "COMPLETED")} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                        Marcar Entregado
                      </button>
                    )}
                    {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                      <button onClick={() => updateOrderStatus(order.id, "CANCELLED")} className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors">
                        Cancelar
                      </button>
                    )}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors text-center flex items-center justify-center gap-1.5"
                      >
                        <Ico n="whatsapp" s={14} c="text-emerald-400" /> Chat Cliente
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLES TAB (Only shown for non-tienda businesses) */}
      {!isTienda && activeTab === "tables" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">Cada mesa tiene un código QR único para que los clientes puedan pedir desde sus celulares.</p>
            <button onClick={addTable} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              + Agregar Mesa
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tables.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-500 text-sm">No tienes mesas configuradas. Agrega tu primera mesa.</div>
            ) : tables.map(table => (
              <div key={table.id} className="p-5 rounded-2xl bg-[#131929] border border-white/5 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${table.status === "OPEN" ? "bg-emerald-500" : "bg-slate-700"}`}></div>
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-white pl-2">Mesa {table.number}</h3>
                  <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${table.status === "OPEN" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                    {table.status === "OPEN" ? "Ocupada / Abierta" : "Libre / Cerrada"}
                  </span>
                </div>

                <div className="bg-white/5 p-4 rounded-xl flex items-center justify-center mb-4">
                  <div className="bg-white p-2 rounded-lg" id={`qr-canvas-${table.number}`}>
                    <QRCodeCanvas
                      value={biz.customDomain ? `https://${biz.customDomain}/?mesa=${table.number}` : `https://${biz.subdomain}.saas-miniwebs.vercel.app/?mesa=${table.number}`}
                      size={1024}
                      style={{ width: "128px", height: "128px" }}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"H"}
                      imageSettings={biz.logoUrl ? {
                        src: biz.logoUrl,
                        height: 256,
                        width: 256,
                        excavate: true,
                        crossOrigin: "anonymous"
                      } : undefined}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => downloadQR(table.number)} className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-center text-[11px] font-bold transition-colors">
                    Descargar QR
                  </button>
                  <button onClick={() => openTableDetails(table)} className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-colors ${table.status === "OPEN" ? "bg-red-500/20 hover:bg-red-500/30 text-red-400" : "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400"}`}>
                    Ver Detalles
                  </button>
                </div>
                
                {table.orders?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Consumos Activos</p>
                    <div className="space-y-1">
                      {table.orders.map((o: any) => (
                        <div key={o.id} className="text-xs text-slate-300 flex justify-between">
                          <span>Ticket #{o.id.slice(-4)}</span>
                          <span className="font-bold text-white">${o.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) setSelectedTable(null); }}>
          <div className="bg-[#131929] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button onClick={() => setSelectedTable(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <div className="p-6">
              <h2 className="text-xl font-black text-white mb-4">Mesa {selectedTable.number}</h2>
              
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Consumos Activos</p>
                {(!selectedTable.orders || selectedTable.orders.length === 0) ? (
                  <p className="text-sm text-slate-400">No hay consumos activos en esta mesa.</p>
                ) : (
                  <div className="space-y-2 bg-white/5 rounded-xl p-3">
                    {selectedTable.orders.map((o: any) => (
                      <div key={o.id} className="text-sm text-slate-300 flex justify-between">
                        <span>Ticket #{o.id.slice(-4)}</span>
                        <span className="font-bold text-white">${o.total}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-white/10 flex justify-between font-black text-white text-lg">
                      <span>Total:</span>
                      <span>${selectedTable.orders.reduce((acc: number, o: any) => acc + o.total, 0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedTable.status === "OPEN" && (
                <div className="mb-6 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
                  <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Cobrar Mesa</p>
                  <select 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#0a0f1c] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 mb-3"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="MercadoPago">Mercado Pago</option>
                  </select>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateTableStatus(selectedTable.id, "CLOSED", paymentMethod)}
                      className="flex-[2] py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors text-sm"
                    >
                      Confirmar y Cerrar
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm("¿Estás seguro de liberar la mesa sin cobrar? Se cancelarán los pedidos.")) {
                          updateTableStatus(selectedTable.id, "CLOSED", undefined, true);
                        }
                      }}
                      className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg transition-colors text-[11px]"
                    >
                      Liberar sin pago
                    </button>
                  </div>
                </div>
              )}

              {selectedTable.status === "CLOSED" && (
                 <div className="mb-6">
                    <button 
                      onClick={() => updateTableStatus(selectedTable.id, "OPEN")}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors"
                    >
                      Abrir Mesa
                    </button>
                 </div>
              )}

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ganancias Históricas</p>
                {statsLoading ? (
                  <div className="flex justify-center p-4">
                    <svg className="animate-spin text-slate-400 w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                    </svg>
                  </div>
                ) : tableStats ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-slate-400 mb-1">Hoy</p>
                      <p className="font-bold text-white text-sm">${tableStats.day}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-slate-400 mb-1">Semana</p>
                      <p className="font-bold text-white text-sm">${tableStats.week}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-slate-400 mb-1">Mes</p>
                      <p className="font-bold text-white text-sm">${tableStats.month}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No hay datos</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
