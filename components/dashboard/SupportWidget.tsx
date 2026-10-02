"use client";

import React, { useState, useEffect, useRef } from "react";
import { Biz, Ico } from "@/lib/constants";

interface SupportWidgetProps {
  biz: Biz;
}

export default function SupportWidget({ biz }: SupportWidgetProps) {
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMsgs, setSupportMsgs] = useState<any[]>([]);
  const [supportInput, setSupportInput] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const [unreadSupport, setUnreadSupport] = useState(0);
  const supportScrollRef = useRef<HTMLDivElement>(null);

  const fetchSupportMsgs = async () => {
    if (!biz) return;
    try {
      const res = await fetch(`/api/messages`);
      const data = await res.json();
      if (res.ok) setSupportMsgs(data);
    } catch { }
  };

  // Fetch unread count on mount and every 10s
  useEffect(() => {
    const fetchUnread = () => {
      fetch("/api/messages/unread")
        .then(r => r.json())
        .then(d => { if (d.count !== undefined) setUnreadSupport(d.count); })
        .catch(() => { });
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (supportOpen) {
      fetchSupportMsgs();
      fetch("/api/messages/read", { method: "POST", body: JSON.stringify({ businessId: biz?.id }) });
    }
  }, [supportOpen, biz]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (supportOpen) {
      interval = setInterval(fetchSupportMsgs, 5000);
    }
    return () => clearInterval(interval);
  }, [supportOpen, biz]);

  useEffect(() => {
    if (supportScrollRef.current) {
      supportScrollRef.current.scrollTop = supportScrollRef.current.scrollHeight;
    }
  }, [supportMsgs, supportOpen]);

  const handleSendSupport = async () => {
    if (!supportInput.trim() || supportLoading || !biz) return;
    const msgText = supportInput.trim();
    const tempMsg = { id: "temp", content: msgText, senderType: "USER", createdAt: new Date() };
    setSupportMsgs(prev => [...prev, tempMsg]);
    setSupportInput("");
    setSupportLoading(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: biz.id, content: msgText })
      });
      if (res.ok) {
        const data = await res.json();
        
        // Disparar actualización en vivo si la IA modificó la web del negocio
        if (data.actionApplied && data.updatedBusiness && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("saas-business-updated", { detail: data.updatedBusiness }));
        }

        if (data.aiMsg) {
          const aiMessageWithFlag = {
            ...data.aiMsg,
            actionApplied: Boolean(data.actionApplied)
          };
          setSupportMsgs(prev => {
            const filtered = prev.filter(m => m.id !== "temp");
            return [...filtered, data.userMsg || tempMsg, aiMessageWithFlag];
          });
        } else if (data.id) {
          setSupportMsgs(prev => {
            const filtered = prev.filter(m => m.id !== "temp");
            return [...filtered, data];
          });
        } else {
          await fetchSupportMsgs();
        }
      } else {
        setSupportMsgs(prev => [...prev.filter(m => m.id !== "temp"), { id: "err", content: "Error al enviar mensaje.", senderType: "AI", createdAt: new Date() }]);
      }
    } catch {
      setSupportMsgs(prev => [...prev.filter(m => m.id !== "temp"), { id: "err", content: "Error de conexión.", senderType: "AI", createdAt: new Date() }]);
    }
    setSupportLoading(false);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9990] flex flex-col items-end pb-[env(safe-area-inset-bottom)]">
      {supportOpen && (
        <div className="mb-3 w-[calc(100vw-32px)] sm:w-88 max-w-sm bg-[#131929] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp" style={{ height: "460px", maxHeight: "calc(100vh - 120px)" }}>
          <div className="p-3.5 text-white flex justify-between items-center" style={{ background: biz?.primaryColor || "#6366f1" }}>
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm">Copiloto IA & Asistente</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-[10px] text-white/80 font-medium">Modifica tu web o responde dudas</p>
              </div>
            </div>
            <button onClick={() => setSupportOpen(false)} className="text-white hover:text-white/60 transition-colors p-1" aria-label="Cerrar soporte">
              <Ico n="x" s={16} />
            </button>
          </div>
          <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3 custom-scrollbar bg-[#050810]" ref={supportScrollRef}>
            {supportMsgs.length === 0 && !supportLoading && (
              <div className="text-center text-slate-400 text-xs mt-3 px-2 space-y-2.5">
                <div className="w-10 h-10 mx-auto rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg shadow-inner">
                  ✨
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Asistente IA de tu Negocio</p>
                  <p className="text-[11px] text-slate-400 mt-1">Puedo responder dudas o modificar tu sitio web en vivo cuando me lo pidas.</p>
                </div>
                <div className="pt-1 flex flex-col gap-1.5 text-left">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider text-center">Pruébame diciendo:</p>
                  <button 
                    onClick={() => setSupportInput("Cambiar color del texto del título por rojo")}
                    className="text-[11px] bg-white/5 hover:bg-white/10 text-indigo-200 border border-white/10 rounded-xl px-3 py-1.5 transition-colors"
                  >
                    🎨 "Cambiar color del texto del título por rojo"
                  </button>
                  <button 
                    onClick={() => setSupportInput("Cambia el color primario a azul moderno")}
                    className="text-[11px] bg-white/5 hover:bg-white/10 text-indigo-200 border border-white/10 rounded-xl px-3 py-1.5 transition-colors"
                  >
                    🔵 "Cambia el color primario a azul moderno"
                  </button>
                  <button 
                    onClick={() => setSupportInput("Cambia la tipografía a Montserrat")}
                    className="text-[11px] bg-white/5 hover:bg-white/10 text-indigo-200 border border-white/10 rounded-xl px-3 py-1.5 transition-colors"
                  >
                    ✍️ "Cambia la tipografía a Montserrat"
                  </button>
                </div>
              </div>
            )}
            {supportMsgs.map((m, i) => (
              <div key={m.id || i} className={`max-w-[88%] p-3 rounded-xl text-sm ${m.senderType === "USER" ? "bg-indigo-500/20 text-indigo-100 self-end rounded-br-sm border border-indigo-500/30" : "bg-white/5 text-slate-300 self-start rounded-bl-sm border border-white/10 whitespace-pre-line"}`}>
                <div>{m.content}</div>
                {m.actionApplied && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                    <span>✨</span>
                    <span>Cambio aplicado en vivo</span>
                  </div>
                )}
              </div>
            ))}
            {supportLoading && (
              <div className="max-w-[85%] p-3 rounded-xl text-xs bg-white/5 text-slate-400 self-start rounded-bl-sm border border-white/10 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                Pensando y aplicando cambios...
              </div>
            )}
          </div>
          <div className="p-2.5 bg-[#131929] border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={supportInput}
              onChange={e => setSupportInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleSendSupport();
              }}
              disabled={supportLoading}
              placeholder="Pide un cambio o haz una pregunta..."
              className="flex-1 bg-[#050810] text-sm text-white px-3 py-2 rounded-lg border border-white/10 focus:border-indigo-500 focus:outline-none disabled:opacity-50 text-[16px] sm:text-sm"
            />
            <button
              onClick={handleSendSupport}
              disabled={supportLoading || !supportInput.trim()}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white transition-colors disabled:opacity-50 min-w-[40px]"
              style={{ backgroundColor: biz?.primaryColor || "var(--primary-color)" }}
              aria-label="Enviar mensaje"
            >
              <Ico n="send" s={16} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setSupportOpen(!supportOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 relative ${supportOpen ? "bg-white/10" : ""}`}
        style={!supportOpen ? { backgroundColor: biz?.primaryColor || "var(--primary-color)" } : {}}
        aria-label={supportOpen ? "Cerrar chat de soporte" : "Abrir chat de soporte"}
      >
        <span className="text-xl">✨</span>
        {!supportOpen && unreadSupport > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-[#080a10] rounded-full"></span>
        )}
      </button>
    </div>
  );
}
