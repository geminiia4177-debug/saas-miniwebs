import React, { useState, useEffect, useRef } from "react";
import { Ico } from "@/lib/constants";

export default function SupportTab({ bizId, showToast }: { bizId: string, showToast: (msg: string, type: "success"|"warn"|"error") => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bizId) return;
    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/messages?businessId=${bizId}`);
        const data = await res.json();
        if(res.ok) setMessages(data);
        
        // Mark as read
        await fetch("/api/messages/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId: bizId })
        });
      } catch(e) {}
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [bizId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: bizId, content })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar mensaje");
      setMessages([...messages, data]);
      setContent("");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-black/20">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400">
          <Ico n="support" s={20} />
        </div>
        <div>
          <h3 className="font-bold text-white tracking-wide">Soporte Técnico</h3>
          <p className="text-[11px] text-slate-400">Habla directamente con el administrador.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <Ico n="message" s={48} />
            <p className="mt-4 text-sm">No hay mensajes aún. ¡Escríbenos si tienes dudas!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isUser = msg.senderType === "USER";
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isUser ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className={`text-[10px] opacity-60 mt-1 block ${isUser ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-black/20 border-t border-white/5">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !content.trim()}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? "..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
