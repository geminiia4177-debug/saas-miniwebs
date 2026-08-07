"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./admin.module.css";

export default function AdminSupport({ showToast }: { showToast: (msg: string, type: "ok" | "warn") => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMsgs = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        
        // Extract unique businesses from messages
        const bizes = new Map();
        data.forEach((m: any) => {
          if (m.business) {
            bizes.set(m.businessId, m.business);
          }
        });
        setBusinesses(Array.from(bizes.entries()).map(([id, b]: any) => ({ id, ...b })));
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, selectedBiz]);

  useEffect(() => {
    if (!selectedBiz) return;
    const markRead = async () => {
      try {
        await fetch("/api/messages/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId: selectedBiz })
        });
      } catch (e) {}
    };
    markRead();
  }, [selectedBiz, messages]);

  const handleSend = async () => {
    if (!content.trim() || !selectedBiz) return;
    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: selectedBiz, content })
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Error al enviar mensaje");
      setMessages([...messages, data]);
      setContent("");
    } catch (e: any) {
      showToast(e.message, "warn");
    } finally {
      setLoading(false);
    }
  };

  const currentMsgs = messages.filter(m => m.businessId === selectedBiz);

  return (
    <div style={{ display: "flex", gap: "24px", height: "calc(100vh - 200px)" }}>
      {/* Sidebar de chats */}
      <div style={{ width: "300px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "16px", overflowY: "auto" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", fontWeight: "bold" }}>Conversaciones</div>
        {businesses.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--t2)" }}>No hay chats activos.</div>
        ) : (
          businesses.map(b => (
            <div 
              key={b.id} 
              onClick={() => setSelectedBiz(b.id)}
              style={{ padding: "16px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: selectedBiz === b.id ? "rgba(255,255,255,0.05)" : "transparent" }}
            >
              <div style={{ fontWeight: "bold" }}>{b.name}</div>
              <div style={{ fontSize: "11px", color: "var(--t2)" }}>/{b.subdomain}</div>
            </div>
          ))
        )}
      </div>

      {/* Ventana de chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "16px" }}>
        {selectedBiz ? (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }} ref={scrollRef}>
              {currentMsgs.map(msg => {
                const isAdmin = msg.senderType === "ADMIN";
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "70%", padding: "12px 16px", borderRadius: "12px", background: isAdmin ? "var(--accent)" : "rgba(255,255,255,0.1)", color: isAdmin ? "#fff" : "var(--t0)", borderBottomRightRadius: isAdmin ? 0 : "12px", borderBottomLeftRadius: isAdmin ? "12px" : 0 }}>
                      <div style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>{msg.content}</div>
                      <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.7, textAlign: isAdmin ? "right" : "left" }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "16px", borderTop: "1px solid var(--border)", display: "flex", gap: "12px" }}>
              <input 
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Escribe tu respuesta..."
                className={styles['search-input']}
                style={{ flex: 1, padding: "12px 16px" }}
              />
              <button 
                onClick={handleSend}
                disabled={loading || !content.trim()}
                className={styles['btn-submit']}
                style={{ padding: "0 24px" }}
              >
                {loading ? "..." : "Enviar"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t2)" }}>
            Selecciona un chat para ver los mensajes.
          </div>
        )}
      </div>
    </div>
  );
}
