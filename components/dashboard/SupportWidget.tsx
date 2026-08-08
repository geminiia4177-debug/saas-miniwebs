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
        await fetchSupportMsgs();
      }
    } catch {
      setSupportMsgs(prev => [...prev, { id: "err", content: "Error de conexión.", senderType: "AI", createdAt: new Date() }]);
    }
    setSupportLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end">
      {supportOpen && (
        <div className="mb-4 w-80 bg-[#131929] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp" style={{ height: "400px" }}>
          <div className="p-4 bg-[var(--accent)] text-black flex justify-between items-center" style={{ background: biz?.primaryColor || "#6366f1" }}>
            <div className="flex items-center gap-2">
              <Ico n="message-circle" s={18} c="text-white" />
              <span className="font-bold text-white text-sm">Soporte Técnico</span>
            </div>
            <button onClick={() => setSupportOpen(false)} className="text-white hover:text-black/50 transition-colors">
              <Ico n="x" s={16} />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar bg-[#050810]" ref={supportScrollRef}>
            {supportMsgs.length === 0 && !supportLoading && (
              <div className="text-center text-slate-400 text-sm mt-4">¡Hola! ¿En qué podemos ayudarte?</div>
            )}
            {supportMsgs.map((m, i) => (
              <div key={m.id || i} className={`max-w-[85%] p-3 rounded-xl text-sm ${m.senderType === "USER" ? "bg-indigo-500/20 text-indigo-100 self-end rounded-br-sm border border-indigo-500/30" : "bg-white/5 text-slate-300 self-start rounded-bl-sm border border-white/10 whitespace-pre-line"}`}>
                {m.content}
              </div>
            ))}
            {supportLoading && (
              <div className="max-w-[85%] p-3 rounded-xl text-sm bg-white/5 text-slate-400 self-start rounded-bl-sm border border-white/10 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                Escribiendo...
              </div>
            )}
          </div>
          <div className="p-3 bg-[#131929] border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={supportInput}
              onChange={e => setSupportInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleSendSupport();
              }}
              disabled={supportLoading}
              placeholder="Escribe tu consulta..."
              className="flex-1 bg-[#050810] text-sm text-white px-3 py-2 rounded-lg border border-white/10 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSendSupport}
              disabled={supportLoading}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              <Ico n="send" s={16} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setSupportOpen(!supportOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 relative ${supportOpen ? "bg-white/10" : ""}`}
        style={!supportOpen ? { backgroundColor: "var(--primary-color)" } : {}}
      >
        <Ico n={supportOpen ? "x" : "message-circle"} s={24} c="text-white" />
        {!supportOpen && unreadSupport > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-[#080a10] rounded-full"></span>
        )}
      </button>
    </div>
  );
}
