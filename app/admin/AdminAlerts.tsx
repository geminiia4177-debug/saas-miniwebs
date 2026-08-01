"use client";

import React, { useState, useEffect } from "react";
import styles from "./admin.module.css";

export default function AdminAlerts({ showToast }: { showToast: (msg: string, type: "ok" | "warn") => void }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [type, setType] = useState("info");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {}
  };

  const handleCreate = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type })
      });
      if (!res.ok) throw new Error("Error al crear alerta");
      showToast("Alerta activada", "ok");
      setContent("");
      fetchAlerts();
    } catch (e: any) {
      showToast(e.message, "warn");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts", { method: "DELETE" });
      if (!res.ok) throw new Error("Error al desactivar");
      showToast("Alerta desactivada", "ok");
      fetchAlerts();
    } catch (e: any) {
      showToast(e.message, "warn");
    } finally {
      setLoading(false);
    }
  };

  const activeAlert = alerts[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "8px", fontWeight: "bold" }}>Alertas Globales</h2>
        <p style={{ color: "var(--t2)", fontSize: "14px", marginBottom: "24px" }}>Crea un mensaje flotante que se mostrará en todos los paneles de los clientes.</p>

        {activeAlert ? (
          <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", background: activeAlert.type === "warning" ? "rgba(239,68,68,0.1)" : activeAlert.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "12px", color: "var(--t2)", marginBottom: "4px", textTransform: "uppercase", fontWeight: "bold" }}>Alerta Activa</div>
              <div style={{ fontWeight: "bold", fontSize: "16px" }}>{activeAlert.content}</div>
            </div>
            <button onClick={handleDeactivate} disabled={loading} className={styles['btn-cancel']}>
              Desactivar
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", color: "var(--t2)", fontWeight: "bold" }}>Mensaje de la Alerta</label>
              <input 
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Ej: Mantenimiento programado hoy a las 22hs..."
                className={styles['search-input']}
                style={{ width: "100%", padding: "12px 16px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <select 
                value={type} 
                onChange={e => setType(e.target.value)}
                className={styles['search-input']}
                style={{ padding: "12px 16px", width: "200px" }}
              >
                <option value="info">Info (Azul)</option>
                <option value="warning">Aviso Importante (Rojo)</option>
                <option value="success">Éxito (Verde)</option>
              </select>
              <button 
                onClick={handleCreate}
                disabled={loading || !content.trim()}
                className={styles['btn-submit']}
              >
                Activar Alerta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
