"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Users, AlertTriangle, MessageCircle, Send, Check, Lightbulb } from "lucide-react";
import HelpTooltip from "@/components/ui/HelpTooltip";

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

  if (!data || data.error) {
    return <div className="p-8 text-white">Error cargando inteligencia: {data?.error || "Error desconocido"}</div>;
  }

  const inactive = Array.isArray(data.inactiveClients) ? data.inactiveClients : [];
  const vip = Array.isArray(data.vipClients) ? data.vipClients : [];

  return (
    <div className="p-4 sm:p-8 animate-fadeIn max-w-6xl mx-auto pb-[calc(env(safe-area-inset-bottom,0px)+6rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/20 shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Asesor Inteligente</h1>
            <p className="text-sm text-slate-400">¿Qué debería hacer hoy para aumentar mis ventas y reservas?</p>
          </div>
        </div>

        <HelpTooltip
          title="¿Qué es el Asesor Inteligente?"
          description="Analiza automáticamente el historial de tus turnos para decirte qué acciones comerciales tomar para facturar más: reactivar clientes inactivos, premiar a tus clientes más fieles (VIP) o llenar tus días más lentos."
          tip="Haz clic en 'Generar Oferta' o 'Premiar Cliente' para que la IA redacte un mensaje personalizado listo para enviar por WhatsApp."
        />
      </div>

      {/* RECOMENDACIÓN ESTRATÉGICA DESTACADA */}
      <div className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/50 border border-indigo-500/20 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Estrategia Comercial Recomendada para Hoy</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {inactive.length > 0
                ? `Tienes ${inactive.length} cliente${inactive.length > 1 ? "s" : ""} en riesgo de abandono (+45 días sin venir). Reactivar un cliente fidelizado cuesta hasta un 80% menos que captar uno nuevo. ¡Usa los botones de abajo para enviarles una oferta irresistible!`
                : data.weakestDay?.name
                ? `Tu día con menor ocupación es el ${data.weakestDay.name}. Te recomendamos lanzar una promoción especial (ej: 15% off o servicio adicional gratuito) para llenar esos horarios muertos.`
                : "Mantén un servicio de excelencia y recompensa a tus clientes que regresan para convertirlos en promotores de tu marca."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* KPI 1 */}
        <div className="p-5 rounded-2xl bg-[#131929] border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-400">Clientes en Riesgo</h3>
            <HelpTooltip
              title="Clientes en Riesgo"
              description="Son clientes que ya conocen tu servicio pero llevan más de 45 días sin agendar un nuevo turno. Un simple mensaje cordial por WhatsApp puede recuperarlos hoy mismo."
              tip="Haz clic en 'Generar Oferta' para que la IA les proponga una promoción adaptada a su servicio favorito."
            />
          </div>
          <p className="text-3xl font-black text-amber-400">{inactive.length}</p>
          <p className="text-xs text-slate-500 mt-1">Hace más de 45 días que no vienen</p>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-2xl bg-[#131929] border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-400">Clientes VIP</h3>
            <HelpTooltip
              title="Clientes VIP"
              description="Son tus clientes más leales, aquellos con 3 o más visitas completadas. Constituyen el núcleo de tus ingresos recurrentes y estables."
              tip="Agradéceles su lealtad con un mensaje exclusivo para que te recomienden con familiares y amigos."
            />
          </div>
          <p className="text-3xl font-black text-emerald-400">{vip.length}</p>
          <p className="text-xs text-slate-500 mt-1">Con 3 o más visitas completadas</p>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-2xl bg-[#131929] border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-400">Día más débil</h3>
            <HelpTooltip
              title="Día con Menor Demanda"
              description="Es el día de la semana con menor cantidad de turnos registrados históricamente en tu negocio."
              tip="Aprovecha este día para ofrecer promociones exclusivas en tus redes sociales o agendar clientes que buscan horarios tranquilos."
            />
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
          {inactive.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No hay clientes inactivos por el momento.</p>
          ) : (
            <div className="space-y-4">
              {inactive.slice(0, 5).map((client: any, i: number) => (
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
          {vip.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No hay suficientes datos para determinar VIPs.</p>
          ) : (
            <div className="space-y-4">
              {vip.slice(0, 5).map((client: any, i: number) => (
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
