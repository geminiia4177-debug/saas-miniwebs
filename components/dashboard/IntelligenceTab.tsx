"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Users, AlertTriangle, MessageCircle, Send, Check } from "lucide-react";

export default function IntelligenceTab({ businessId, bizName }: { businessId: string, bizName: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [currentClientPhone, setCurrentClientPhone] = useState("");

  useEffect(() => {
    fetch(`/api/intelligence?businessId=${businessId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [businessId]);

  const generateMessage = async (type: string, context: any, clientName: string, clientPhone: string) => {
    setGeneratingFor(clientPhone);
    setGeneratedMessage("");
    setCurrentClientPhone(clientPhone);

    try {
      const res = await fetch("/api/intelligence/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          campaignType: type,
          context,
          clientName
        })
      });

      if (res.ok) {
        const d = await res.json();
        setGeneratedMessage(d.message);
      } else {
        alert("Configura tu GEMINI_API_KEY en las variables de entorno para usar la IA.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingFor(null);
    }
  };

  const openWhatsApp = () => {
    if (!currentClientPhone || !generatedMessage) return;
    const cleanPhone = currentClientPhone.replace(/\D/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedMessage)}`;
    window.open(url, "_blank");
    setGeneratedMessage("");
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-white">Error cargando inteligencia.</div>;

  return (
    <div className="p-8 animate-fadeIn">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Asesor Inteligente</h1>
          <p className="text-sm text-slate-400">¿Qué debería hacer hoy para aumentar mis ventas?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl bg-[#131929] border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-400">Clientes en Riesgo</h3>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-white">{data.inactiveClients?.length || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Hace más de 45 días que no vienen</p>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl bg-[#131929] border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-400">Clientes VIP</h3>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{data.vipClients?.length || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Con 3 o más visitas completadas</p>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl bg-[#131929] border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-400">Día más débil</h3>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white">{data.weakestDay?.name || "N/A"}</p>
          <p className="text-xs text-slate-500 mt-1">Solo {data.weakestDay?.count || 0} turnos históricos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Oportunidades de Recuperación */}
        <div className="bg-[#131929] border border-white/5 rounded-3xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Recuperar Clientes
          </h2>
          {data.inactiveClients?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No hay clientes inactivos por el momento.</p>
          ) : (
            <div className="space-y-4">
              {data.inactiveClients?.slice(0, 5).map((client: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div>
                    <p className="font-bold text-white text-sm">{client.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Vino {client.visits} veces • Favorito: {client.favoriteService}
                    </p>
                    <p className="text-[10px] font-bold text-amber-500 mt-1 uppercase tracking-wider">
                      Ausente hace {client.daysSinceLastVisit} días
                    </p>
                  </div>
                  <button 
                    onClick={() => generateMessage("INACTIVE_CLIENT", { days: client.daysSinceLastVisit, service: client.favoriteService }, client.name, client.phone)}
                    disabled={generatingFor === client.phone}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 whitespace-nowrap justify-center"
                  >
                    {generatingFor === client.phone ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> Generar Oferta</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Oportunidades VIP */}
        <div className="bg-[#131929] border border-white/5 rounded-3xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Fidelizar VIPs
          </h2>
          {data.vipClients?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No hay suficientes datos para determinar VIPs.</p>
          ) : (
            <div className="space-y-4">
              {data.vipClients?.slice(0, 5).map((client: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center font-black text-emerald-400 text-xs">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{client.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {client.visits} visitas completadas
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => generateMessage("VIP_CLIENT", { visits: client.visits }, client.name, client.phone)}
                    disabled={generatingFor === client.phone}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 whitespace-nowrap justify-center border border-emerald-500/20"
                  >
                    {generatingFor === client.phone ? (
                      <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> Premiar Cliente</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MODAL DEL MENSAJE GENERADO */}
      {generatedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1a2235] border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Mensaje Generado</h3>
                <p className="text-xs text-slate-400">Revisa y envía a través de WhatsApp</p>
              </div>
            </div>
            
            <textarea
              className="w-full h-40 p-4 rounded-2xl bg-black/30 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none mb-6"
              value={generatedMessage}
              onChange={(e) => setGeneratedMessage(e.target.value)}
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setGeneratedMessage("")}
                className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={openWhatsApp}
                className="flex-[2] py-3 rounded-xl font-bold text-white transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                <Send className="w-4 h-4" /> Enviar por WhatsApp
              </button>
            </div>
            
            <p className="text-[10px] text-center text-slate-500 mt-4 flex items-center justify-center gap-1">
              <MessageCircle className="w-3 h-3" /> Esto abrirá WhatsApp Web / App de forma segura
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
