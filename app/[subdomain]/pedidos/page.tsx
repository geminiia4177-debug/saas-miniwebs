"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Clock, CheckCircle2, ChefHat, BellRing } from "lucide-react";

export default function PedidosPage() {
  const { subdomain } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [error, setError] = useState("");
  const prevOrdersCount = useRef(0);

  const playBeep = () => {
    try {
      const ctx = new window.AudioContext();
      const o = ctx.createOscillator();
      o.connect(ctx.destination);
      o.frequency.value = 880;
      o.start();
      setTimeout(() => o.stop(), 200);
    } catch (e) {
      // Audio might be blocked by browser policy until user interacts
    }
  };

  const fetchOrders = async (bizId: string) => {
    try {
      const res = await fetch(`/api/orders?businessId=${bizId}&token=${token || ""}`);
      if (res.ok) {
        const data = await res.json();
        
        // Check for new pending orders to play beep
        const newPending = data.filter((o: any) => o.status === "PENDING").length;
        if (newPending > prevOrdersCount.current) {
          playBeep();
        }
        prevOrdersCount.current = newPending;
        
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!subdomain) return;
    
    // First get business ID
    fetch(`/api/businesses?subdomain=${subdomain}`)
      .then(r => r.json())
      .then(data => {
        if (data.error || !data.id) {
          setError("Negocio no encontrado");
          setLoading(false);
          return;
        }
        setBusiness(data);
        fetchOrders(data.id);
        
        // Polling every 10 seconds
        const interval = setInterval(() => {
          fetchOrders(data.id);
        }, 10000);
        return () => clearInterval(interval);
      })
      .finally(() => setLoading(false));
  }, [subdomain, token]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status })
      });
      if (res.ok) {
        if (status === "COMPLETED") {
          // Si lo marcamos como listo, podríamos removerlo, pero lo dejaremos para la columna "Listo"
          // O si preferimos, lo removemos tras un tiempo
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
          setTimeout(() => {
            setOrders(prev => prev.filter(o => o.id !== orderId));
          }, 30000); // Se borra a los 30s
        } else {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        }
      }
    } catch (e) {
      alert("Error al actualizar el pedido");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-white">Cargando KDS...</div>;
  if (error) return <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-red-500">{error}</div>;

  const pending = orders.filter(o => o.status === "PENDING");
  const confirmed = orders.filter(o => o.status === "CONFIRMED");
  const completed = orders.filter(o => o.status === "COMPLETED");

  const OrderCard = ({ order }: { order: any }) => {
    const minutos = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    const urgente = order.status === "PENDING" && minutos > 15;
    
    let borderColor = "border-slate-700";
    let bgPulse = "";
    
    if (urgente) {
      borderColor = "border-red-500";
      bgPulse = "animate-pulse bg-red-500/10";
    } else if (order.type === "DELIVERY") {
      borderColor = "border-orange-500";
    } else if (order.type === "MESA") {
      borderColor = "border-indigo-500";
    } else if (order.type === "RETIRO") {
      borderColor = "border-purple-500";
    }

    return (
      <div className={`bg-[#111827] rounded-xl border-2 ${borderColor} p-4 flex flex-col gap-4 ${bgPulse}`}>
        <div className="flex justify-between items-start">
          <div>
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
               order.type === "DELIVERY" ? "bg-orange-500/20 text-orange-400" :
               order.type === "MESA" ? "bg-indigo-500/20 text-indigo-400" : "bg-purple-500/20 text-purple-400"
            }`}>
              {order.type === "DELIVERY" ? "🛵 Delivery" : order.type === "MESA" ? `🍽️ Mesa ${order.table?.number || "?"}` : "🛍️ Retiro"}
            </span>
            <div className="text-white font-bold mt-2 text-lg">#{order.id.slice(-4).toUpperCase()}</div>
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-bold px-2 py-1 rounded ${urgente ? "bg-red-500 text-white" : "text-slate-400 bg-slate-800"}`}>
            <Clock className="w-4 h-4" /> {minutos}m
          </div>
        </div>
        
        <div className="space-y-2 flex-1">
          {order.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-sm items-start gap-2">
              <span className="font-bold text-slate-200">
                <span className="text-[var(--accent)] mr-2">{item.qty}x</span> 
                {item.name}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 mt-auto">
          {order.status === "PENDING" && (
            <button
              onClick={() => updateOrderStatus(order.id, "CONFIRMED")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <ChefHat className="w-4 h-4" /> Preparar
            </button>
          )}
          {order.status === "CONFIRMED" && (
            <button
              onClick={() => updateOrderStatus(order.id, "COMPLETED")}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Marcar Listo
            </button>
          )}
          {order.status === "COMPLETED" && (
            <div className="w-full py-3 bg-slate-800 text-slate-400 rounded-lg font-bold text-sm text-center">
              Completado
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] p-4 md:p-6 font-sans text-slate-300">
      <div className="max-w-[1400px] mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Kitchen Display System 
              <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded-md uppercase tracking-widest">{business?.name}</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={playBeep} className="text-slate-500 hover:text-white" title="Testear sonido"><BellRing className="w-5 h-5" /></button>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">En vivo</span>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          
          {/* Pendientes */}
          <div className="flex flex-col bg-[#0f1525] rounded-2xl overflow-hidden border border-slate-800/50">
            <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-800/30">
              <h2 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> Pendientes
              </h2>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-bold">{pending.length}</span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
              {pending.map(o => <OrderCard key={o.id} order={o} />)}
              {pending.length === 0 && <div className="text-slate-600 text-center text-sm py-10 font-bold uppercase tracking-widest">Sin pendientes</div>}
            </div>
          </div>

          {/* En Preparación */}
          <div className="flex flex-col bg-[#0f1525] rounded-2xl overflow-hidden border border-slate-800/50">
            <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-800/30">
              <h2 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Preparando
              </h2>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-bold">{confirmed.length}</span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
              {confirmed.map(o => <OrderCard key={o.id} order={o} />)}
              {confirmed.length === 0 && <div className="text-slate-600 text-center text-sm py-10 font-bold uppercase tracking-widest">Cocina libre</div>}
            </div>
          </div>

          {/* Listos */}
          <div className="flex flex-col bg-[#0f1525] rounded-2xl overflow-hidden border border-slate-800/50">
            <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-800/30">
              <h2 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div> Listos
              </h2>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-bold">{completed.length}</span>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
              {completed.map(o => <OrderCard key={o.id} order={o} />)}
              {completed.length === 0 && <div className="text-slate-600 text-center text-sm py-10 font-bold uppercase tracking-widest">Vacío</div>}
            </div>
          </div>

        </div>
      </div>
      
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
