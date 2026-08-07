"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import styles from './admin.module.css';
import AdminSupport from "./AdminSupport";
import AdminAlerts from "./AdminAlerts";

const RUBRO_META: Record<string, any> = {
  barberia:  { label: "Barberia",    icon: "✂",  color: "#a78bfa" },
  estetica:  { label: "Estetica",    icon: "◈",  color: "#f472b6" },
  cancha:    { label: "Cancha",     icon: "⬡",  color: "#34d399" },
  menu:      { label: "Menu",        icon: "◉",  color: "#fb923c" },
  gimnasio:  { label: "Gimnasio",    icon: "▲",  color: "#38bdf8" },
  clinica:   { label: "Clinica",     icon: "✚",  color: "#f87171" },
  taller:    { label: "Taller Mecánico", icon: "🔧", color: "#64748b" },
  lavadero:  { label: "Lavadero",    icon: "🚗", color: "#0ea5e9" },
  general:   { label: "General",     icon: "🏢", color: "#facc15" },
};

const STATUS_META: Record<string, any> = {
  ACTIVE:  { label: "Activo",     color: "#00e5a0", glow: "rgba(0,229,160,0.3)"  },
  DEMO:    { label: "Demo",       color: "#f5a623", glow: "rgba(245,166,35,0.3)" },
  BLOCKED: { label: "Bloqueado",  color: "#ff4d6d", glow: "rgba(255,77,109,0.3)" },
};

const PAY_STATUS_META: Record<string, any> = {
  paid:    { label: "Al día",    color: "#00e5a0", bg: "rgba(0,229,160,0.1)"   },
  pending: { label: "Pendiente", color: "#f5a623", bg: "rgba(245,166,35,0.1)"  },
  overdue: { label: "Vencido",   color: "#ff4d6d", bg: "rgba(255,77,109,0.1)"  },
};

// ── UTILITY ──────────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}
function uid() { return Math.random().toString(36).slice(2, 10); }

// ── HOOKS ─────────────────────────────────────────────────────────────────────
function useToasts() {
  const [toasts, setToasts] = useState<any[]>([]);
  const push = (msg: string, type = "ok") => {
    const id = uid();
    setToasts(p => [...p, { id, msg, type, fading: false }]);
    setTimeout(() => setToasts(p => p.map(t => t.id === id ? { ...t, fading: true } : t)), 2700);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  return { toasts, push };
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.BLOCKED;
  return (
    <span className={styles['status-pill']} style={{ color: m.color, borderColor: `${m.color}33`, background: `${m.color}10` }}>
      <span className={styles['status-dot']} />
      {m.label}
    </span>
  );
}

function PayChip({ status }: { status: string }) {
  const m = PAY_STATUS_META[status] || PAY_STATUS_META.pending;
  return <span className={styles['pay-chip']} style={{ color: m.color, background: m.bg }}>{m.label}</span>;
}

// ── EXPANDED DETAIL ────────────────────────────────────────────────────────────
function ExpandedDetail({ negocio, onSave, onNoteAdd, toast }: any) {
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState({ ...negocio });
  const [noteText, setNoteText] = useState("");

  const tabs = [
    { id: "info",    label: "Información" },
    { id: "payment", label: "Pagos" },
    { id: "notes",   label: `Notas (${negocio.notes.length})` },
  ];

  const handleSave = () => {
    onSave(negocio.id, form);
    toast("Cambios guardados", "ok");
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    onNoteAdd(negocio.id, noteText);
    setNoteText("");
    toast("Nota agregada");
  };

  return (
    <div className={styles['card-expanded']}>
      <div className={styles['exp-tabs']}>
        {tabs.map(t => (
          <button key={t.id} className={`exp-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles['exp-body']}>

        {/* ── INFO TAB ── */}
        {tab === "info" && (
          <>
            <div className={`${styles['form-row']} ${styles.full}`}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Descripción</label>
                <textarea className={styles.ftextarea} value={form.description || ""} placeholder="Descripción del negocio..."
                  onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className={styles['form-row']}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Nombre</label>
                <input className={styles.finput} value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Subdominio</label>
                <input className={styles.finput} value={form.subdomain} onChange={e => setForm((p: any) => ({ ...p, subdomain: e.target.value }))} />
              </div>
            </div>
            <div className={`${styles['form-row']} ${styles.full}`}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Dominio Propio (Opcional)</label>
                <input className={styles.finput} placeholder="www.minegocio.com" value={form.customDomain || ""} onChange={e => setForm((p: any) => ({ ...p, customDomain: e.target.value }))} />
              </div>
            </div>
            <div className={styles['form-row']}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Email</label>
                <input className={styles.finput} type="email" value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Teléfono</label>
                <input className={styles.finput} value={form.phone || ""} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className={`${styles['form-row']} ${styles.three}`}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Rubro</label>
                <select className={styles.fselect} value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))}>
                  {Object.entries(RUBRO_META).map(([v, m]) => (
                    <option key={v} value={v}>{m.icon} {m.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Estado</label>
                <select className={styles.fselect} value={form.status} onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}>
                  <option value="ACTIVE">Activo</option>
                  <option value="DEMO">Demo</option>
                  <option value="BLOCKED">Bloqueado</option>
                </select>
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Vto. Demo</label>
                <input className={styles.finput} type="date" value={form.demoExpiresAt || ""} onChange={e => setForm((p: any) => ({ ...p, demoExpiresAt: e.target.value }))} />
              </div>
            </div>
            <div className={styles['form-actions-row']}>
              <button className={`${styles['chip-btn']} ${styles.ghost}`} onClick={() => setForm({ ...negocio })}>Descartar</button>
              <button className={styles['btn-submit']} onClick={handleSave}>Guardar cambios</button>
            </div>
          </>
        )}

        {/* ── PAYMENTS TAB ── */}
        {tab === "payment" && (
          <>
            <div className={styles['pay-summary']}>
              <div className={styles['pay-stat']}>
                <div className={styles['pay-stat-val']} style={{ color: "var(--green)" }}>{fmtMoney(form.paymentAmount || 0)}</div>
                <div className={styles['pay-stat-lbl']}>Cuota mensual</div>
              </div>
              <div className={styles['pay-stat']}>
                <div className={styles['pay-stat-val']}>
                  <PayChip status={form.paymentStatus} />
                </div>
                <div className={styles['pay-stat-lbl']} style={{ marginTop: 6 }}>Estado de pago</div>
              </div>
            </div>

            <div className={`${styles['form-row']} ${styles.three}`} style={{ marginBottom: 16 }}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Próximo pago</label>
                <input className={styles.finput} type="date" value={form.nextPayment || ""} onChange={e => setForm((p: any) => ({ ...p, nextPayment: e.target.value }))} />
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Monto ($ARS)</label>
                <input className={styles.finput} type="number" value={form.paymentAmount || ""} onChange={e => setForm((p: any) => ({ ...p, paymentAmount: Number(e.target.value) }))} />
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Estado pago</label>
                <select className={styles.fselect} value={form.paymentStatus} onChange={e => setForm((p: any) => ({ ...p, paymentStatus: e.target.value }))}>
                  <option value="paid">Al día</option>
                  <option value="pending">Pendiente</option>
                  <option value="overdue">Vencido</option>
                </select>
              </div>
            </div>

            <div className={`${styles['form-row']} ${styles.three}`} style={{ marginBottom: 16 }}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>CBU / CVU (Admin)</label>
                <input className={styles.finput} value={form.paymentData?.cbu || ""} onChange={e => setForm((p: any) => ({ ...p, paymentData: { ...p.paymentData, cbu: e.target.value } }))} placeholder="0000..." />
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Alias (Admin)</label>
                <input className={styles.finput} value={form.paymentData?.alias || ""} onChange={e => setForm((p: any) => ({ ...p, paymentData: { ...p.paymentData, alias: e.target.value } }))} placeholder="MI.ALIAS" />
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Titular (Admin)</label>
                <input className={styles.finput} value={form.paymentData?.titular || ""} onChange={e => setForm((p: any) => ({ ...p, paymentData: { ...p.paymentData, titular: e.target.value } }))} placeholder="Nombre completo" />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className={styles.flabel} style={{ marginBottom: 10 }}>Historial de pagos</div>
              {negocio.paymentHistory.length === 0 ? (
                <div style={{ color: "var(--t2)", fontSize: 12, fontFamily: "var(--fm)", padding: "16px 0" }}>
                  // Sin historial aún
                </div>
              ) : (
                <table className={styles['pay-table']}>
                  <thead>
                    <tr>
                      <th>Fecha</th><th>Monto</th><th>Método</th><th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {negocio.paymentHistory.map((p: any) => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: "var(--fm)" }}>{fmtDate(p.date)}</td>
                        <td style={{ fontWeight: 600 }}>{fmtMoney(p.amount)}</td>
                        <td style={{ color: "var(--t1)" }}>{p.method}</td>
                        <td><PayChip status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles['form-actions-row']}>
              <button className={styles['btn-submit']} onClick={handleSave}>Guardar cambios de pago</button>
            </div>
          </>
        )}

        {/* ── NOTES TAB ── */}
        {tab === "notes" && (
          <>
            {negocio.notes.length === 0 && (
              <div style={{ color: "var(--t2)", fontSize: 12, fontFamily: "var(--fm)", paddingBottom: 16 }}>
                // Sin notas todavía. Agregá la primera.
              </div>
            )}
            <div className={styles['notes-list']}>
              {negocio.notes.map((note: any) => (
                <div className={styles['note-item']} key={note.id}>
                  <div className={styles['note-top']}>
                    <span className={styles['note-author']}>{note.author}</span>
                    <span className={styles['note-date']}>{fmtDate(note.date)}</span>
                  </div>
                  <div className={styles['note-text']}>{note.text}</div>
                </div>
              ))}
            </div>
            <div className={styles['note-add']}>
              <input
                className={styles['note-input']}
                placeholder="Escribí una nota..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddNote()}
              />
              <button className={styles['btn-add-note']} onClick={handleAddNote}>Agregar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const getLandingUrl = (neg: any) => {
  if (typeof window === "undefined") return "";
  if (neg.customDomain) return `https://${neg.customDomain}`;
  return `${window.location.protocol}//${neg.subdomain}.${window.location.host}`;
};

// ── BUSINESS CARD ──────────────────────────────────────────────────────────────
function BizCard({ negocio, isExpanded, onToggle, onStatusChange, onDelete, onSave, onNoteAdd, toast, viewMode }: any) {
  const rubro = RUBRO_META[negocio.type] || { label: negocio.type, icon: "◦", color: "#6b7280" };

  if (viewMode === "list") {
    return (
      <div className={`biz-card ${isExpanded ? "selected" : ""}`} style={{ "--stripe-c": rubro.color } as any}>
        <div className={styles['card-stripe']} />
        <div style={{ display: "flex", alignItems: "center", padding: "14px 20px", gap: 16 }}>
          <div className={styles['card-avatar']} style={{ background: `${rubro.color}18`, color: rubro.color, width: 38, height: 38 }}>
            {rubro.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={styles['card-name']} style={{ fontSize: 14 }}>{negocio.name}</div>
            <div className={styles['card-url']}>{negocio.customDomain || `${negocio.subdomain}.saas-miniwebs.vercel.app`}</div>
          </div>
          <div style={{ fontSize: 12, color: "var(--t1)", minWidth: 100 }}>{negocio.email}</div>
          <div style={{ minWidth: 80 }}><StatusPill status={negocio.status} /></div>
          <div style={{ minWidth: 80 }}><PayChip status={negocio.paymentStatus} /></div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button className={`${styles['chip-btn']} ${styles.green}`} onClick={e => { e.stopPropagation(); onStatusChange(negocio.id, "ACTIVE"); }}>✓</button>
            <button className={`${styles['chip-btn']} ${styles.red}`}   onClick={e => { e.stopPropagation(); onStatusChange(negocio.id, "BLOCKED"); }}>✕</button>
            <button className={`${styles['chip-btn']} ${styles.ghost}`} onClick={e => { e.stopPropagation(); onToggle(negocio.id); }}>
              <span className={`expand-arrow ${isExpanded ? "open" : ""}`}>▼</span>
            </button>
          </div>
        </div>
        {isExpanded && (
          <ExpandedDetail negocio={negocio} onSave={onSave} onNoteAdd={onNoteAdd} toast={toast} />
        )}
      </div>
    );
  }

  return (
    <div className={`biz-card ${isExpanded ? "selected" : ""}`}
      style={{ "--stripe-c": rubro.color } as any}
      onClick={() => onToggle(negocio.id)}>
      <div className={styles['card-stripe']} />
      <div className={styles['card-main']}>
        <div className={styles['card-head']}>
          <div className={styles['card-head-left']}>
            <div className={styles['card-avatar']} style={{ background: `${rubro.color}18`, color: rubro.color }}>
              {rubro.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className={styles['card-name']}>{negocio.name}</div>
              <div className={styles['card-url']}>{negocio.customDomain || `${negocio.subdomain}.saas-miniwebs.vercel.app`}</div>
            </div>
          </div>
          <div className={styles['card-head-right']}>
            <StatusPill status={negocio.status} />
            <PayChip status={negocio.paymentStatus} />
          </div>
        </div>

        {negocio.description && (
          <div className={styles['card-desc']}>{negocio.description}</div>
        )}

        <div className={styles['card-meta']}>
          <div className={styles['card-meta-item']}>
            <span className={styles['card-meta-icon']}>✉</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
              {negocio.email}
            </span>
          </div>
          {negocio.phone && (
            <div className={styles['card-meta-item']}>
              <span className={styles['card-meta-icon']}>☎</span>
              {negocio.phone}
            </div>
          )}
          <div className={styles['card-meta-item']}>
            <span className={styles['card-meta-icon']}>◑</span>
            Próx. pago: {fmtDate(negocio.nextPayment)}
          </div>
        </div>
      </div>

      <div className={styles['card-footer']} onClick={e => e.stopPropagation()}>
        <div className={styles['card-footer-actions']}>
          <button className={`${styles['chip-btn']} ${styles.green}`} onClick={() => onStatusChange(negocio.id, "ACTIVE")}>✓ Activar</button>
          <button className={`${styles['chip-btn']} ${styles.red}`}   onClick={() => onStatusChange(negocio.id, "BLOCKED")}>✕ Bloquear</button>
          <button className={`${styles['chip-btn']} ${styles.danger}`} onClick={() => onDelete(negocio)}>Eliminar</button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <a href={getLandingUrl(negocio)} target="_blank" rel="noreferrer" className={`${styles['chip-btn']} ${styles.blue}`} style={{ textDecoration: "none" }}>
            Ver Landing ↗
          </a>
          <button className={`${styles['chip-btn']} ${styles.ghost}`} onClick={() => onToggle(negocio.id)}>
            Detalle <span className={`expand-arrow ${isExpanded ? "open" : ""}`}>▼</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div onClick={e => e.stopPropagation()}>
          <ExpandedDetail negocio={negocio} onSave={onSave} onNoteAdd={onNoteAdd} toast={toast} />
        </div>
      )}
    </div>
  );
}

// ── DRAWER (NEW CLIENT) ───────────────────────────────────────────────────────
function NewClientDrawer({ onClose, onSave }: any) {
  const [form, setForm] = useState({
    name: "", subdomain: "", customDomain: "", email: "", phone: "",
    type: "barberia", status: "DEMO", description: "",
    nextPayment: "", paymentAmount: "", paymentStatus: "pending",
  });

  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    const exp = new Date(); exp.setDate(exp.getDate() + 3);
    onSave({
      ...form,
      id: uid(),
      paymentAmount: Number(form.paymentAmount) || 0,
      createdAt: new Date().toISOString().slice(0, 10),
      demoExpiresAt: form.status === "DEMO" ? exp.toISOString().slice(0, 10) : null,
      notes: [],
      paymentHistory: [],
    });
    onClose();
  };

  return (
    <div className={styles['drawer-overlay']} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles['drawer-head']}>
          <div>
            <div className={styles['drawer-title']}>Nuevo cliente</div>
            <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 2 }}>Alta + 3 días de demo automáticos</div>
          </div>
          <button className={styles['drawer-close']} onClick={onClose}>✕</button>
        </div>

        <div className={styles['drawer-body']}>
          <div className={styles['drawer-section']}>
            <div className={styles['drawer-section-title']}>Datos del negocio</div>
            <div className={styles['form-row']}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Nombre *</label>
                <input className={styles.finput} placeholder="Ej: Barbería El Tigre" value={form.name} onChange={e => set("name", e.target.value)} />
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Subdominio *</label>
                <input className={styles.finput} placeholder="barberiavip" value={form.subdomain} onChange={e => set("subdomain", e.target.value.toLowerCase())} />
              </div>
            </div>
            <div className={`${styles['form-row']} ${styles.full}`}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Dominio Propio (Opcional)</label>
                <input className={styles.finput} placeholder="www.minegocio.com" value={form.customDomain} onChange={e => set("customDomain", e.target.value.toLowerCase())} />
              </div>
            </div>
            <div className={`${styles['form-row']} ${styles.full}`}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Descripción</label>
                <textarea className={styles.ftextarea} rows={3} placeholder="Descripción del negocio..."
                  value={form.description} onChange={e => set("description", e.target.value)} />
              </div>
            </div>
            <div className={styles['form-row']}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Rubro</label>
                <select className={styles.fselect} value={form.type} onChange={e => set("type", e.target.value)}>
                  {Object.entries(RUBRO_META).map(([v, m]) => (
                    <option key={v} value={v}>{m.icon} {m.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Estado inicial</label>
                <select className={styles.fselect} value={form.status} onChange={e => set("status", e.target.value)}>
                  <option value="DEMO">Demo (3 días)</option>
                  <option value="ACTIVE">Activo directo</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles['drawer-section']}>
            <div className={styles['drawer-section-title']}>Contacto</div>
            <div className={styles['form-row']}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Email *</label>
                <input className={styles.finput} type="email" placeholder="dueño@mail.com" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Teléfono</label>
                <input className={styles.finput} placeholder="+54 9 11..." value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
            </div>
          </div>

          <div className={styles['drawer-section']}>
            <div className={styles['drawer-section-title']}>Facturación</div>
            <div className={`${styles['form-row']} ${styles.three}`}>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Monto mensual</label>
                <input className={styles.finput} type="number" placeholder="4900" value={form.paymentAmount} onChange={e => set("paymentAmount", e.target.value)} />
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Próximo pago</label>
                <input className={styles.finput} type="date" value={form.nextPayment} onChange={e => set("nextPayment", e.target.value)} />
              </div>
              <div className={styles.fgroup}>
                <label className={styles.flabel}>Estado pago</label>
                <select className={styles.fselect} value={form.paymentStatus} onChange={e => set("paymentStatus", e.target.value)}>
                  <option value="paid">Al día</option>
                  <option value="pending">Pendiente</option>
                  <option value="overdue">Vencido</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className={styles['drawer-footer']}>
          <button className={styles['btn-cancel']} onClick={onClose}>Cancelar</button>
          <button className={styles['btn-submit']} onClick={handleSubmit}>
            Crear cliente
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN WHATSAPP ──────────────────────────────────────────────────────────────
function AdminWhatsApp() {
  const [statusData, setStatusData] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        const data = await res.json();
        setStatusData(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "40px 20px", background: "var(--s1)", borderRadius: "var(--r)", border: "1px solid var(--b0)", textAlign: "center" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "20px" }}>Estado de WhatsApp Web (Baileys)</h2>
      
      {!statusData && <p style={{ color: "var(--t2)" }}>Consultando estado...</p>}

      {statusData?.status === 'NOT_INITIALIZED' && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ color: "var(--yellow)", fontSize: "40px", marginBottom: "16px" }}>⚠</div>
          <p style={{ color: "var(--red)", fontWeight: "bold", fontSize: "16px", marginBottom: "8px" }}>WhatsApp no está inicializado</p>
          <p style={{ color: "var(--t2)", fontSize: "14px", maxWidth: "400px" }}>
            El bot de WhatsApp (Baileys) requiere ejecutarse en un entorno Node.js persistente (VPS, Servidor Dedicado, etc.). 
            Si estás alojando esta aplicación en Vercel, las funciones "Serverless" no soportan procesos en segundo plano ni conexiones WebSocket constantes, por lo que el bot no funcionará.
          </p>
        </div>
      )}

      {statusData?.status === 'STARTING' && (
        <p style={{ color: "var(--accent)", animation: "pulse 2s infinite" }}>Iniciando cliente de WhatsApp...</p>
      )}

      {statusData?.status === 'QR_READY' && statusData?.qrCode && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ color: "var(--yellow)", marginBottom: "16px", fontWeight: 500 }}>Escanea este código QR con tu celular en Dispositivos Vinculados</p>
          <img src={statusData.qrCode} alt="WhatsApp QR Code" style={{ width: "260px", height: "260px", border: "4px solid white", borderRadius: "12px", background: "white" }} />
        </div>
      )}

      {statusData?.status === 'AUTHENTICATED' && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "var(--green)" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
          <p style={{ fontWeight: "bold", fontSize: "18px" }}>¡WhatsApp Conectado y Listo para enviar mensajes!</p>
        </div>
      )}

      {statusData?.status === 'ERROR' && (
        <p style={{ color: "var(--red)", fontWeight: 500 }}>Error al conectar con WhatsApp. Revisa la terminal del servidor Node.</p>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function AdminCRM() {
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totales, setTotales] = useState<any>({ all: 0, ACTIVE: 0, DEMO: 0, BLOCKED: 0, revenue: 0, chartData: [] });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [expanded, setExpanded]   = useState<string | null>(null);
  const [drawerOpen, setDrawer]   = useState(false);
  const [filter, setFilter]       = useState("all");
  const [adminTab, setAdminTab]   = useState("crm");
  const [search, setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode]   = useState("grid");
  const [confirmDel, setConfirmDel] = useState<any>(null);
  const [confirmBlock, setConfirmBlock] = useState<any>(null);
  const [unreadSupport, setUnreadSupport] = useState(0);
  const { toasts, push: pushToast } = useToasts();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [filter]);

  // Fetch Unread
  useEffect(() => {
    const fetchUnread = () => {
      fetch("/api/messages/unread")
        .then(r => r.json())
        .then(d => { if (d.count !== undefined) setUnreadSupport(d.count); })
        .catch(e => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch API
  useEffect(() => {
    setLoading(true);
    fetch(`/api/businesses?limit=20&offset=${page * 20}&search=${encodeURIComponent(debouncedSearch)}&status=${filter}`)
      .then(res => res.json())
      .then(data => {
        const negociosAdaptados = (data.data || []).map((n: any) => ({
          ...n,
          notes: [],
          paymentHistory: []
        }));
        if (page === 0) setNegocios(negociosAdaptados);
        else setNegocios(p => [...p, ...negociosAdaptados]);
        
        setTotales(data.stats || { all: 0, ACTIVE: 0, DEMO: 0, BLOCKED: 0, revenue: 0, chartData: [] });
        setHasMore((page + 1) * 20 < data.total);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        pushToast("Error al cargar negocios", "warn");
        setLoading(false);
      });
  }, [debouncedSearch, filter, page]);

  const filtered = negocios;

  const toggleExpand = (id: string) => setExpanded(p => p === id ? null : id);

  // Actualiza el estado (Activo, Demo, Bloqueado)
  const requestChangeStatus = (id: string, status: string) => {
    if (status === "BLOCKED") {
      const n = negocios.find(x => x.id === id);
      setConfirmBlock({ ...n, targetStatus: status });
    } else {
      changeStatus(id, status);
    }
  };

  const changeStatus = async (id: string, status: string) => {
    setConfirmBlock(null);
    // 1. Cambio visual instantáneo (ilusión de rapidez)
    const negocio = negocios.find(n => n.id === id);
    if (!negocio) return;
    const updated = { ...negocio, status };
    setNegocios(p => p.map(n => n.id === id ? updated : n));
    pushToast(`Estado actualizado: ${STATUS_META[status].label}`, status === "ACTIVE" ? "ok" : "warn");

    // 2. Guardado real silencioso en la base de datos
    try {
      await fetch(`/api/businesses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      pushToast("Error de conexión al guardar", "warn");
    }
  };

  // Guarda las ediciones del detalle del cliente
  const saveEdits = async (id: string, data: any) => {
    // 1. Cambio visual
    setNegocios(p => p.map(n => n.id === id ? { ...n, ...data } : n));
    
    // 2. Guardado real
    try {
      const res = await fetch(`/api/businesses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Fallo");
    } catch (err) {
      pushToast("Error al guardar en el servidor", "warn");
    }
  };

  // Elimina un cliente por completo
  const deleteNegocio = async (negocio: any) => {
    // 1. Lo borramos de la pantalla
    setNegocios(p => p.filter(n => n.id !== negocio.id));
    setConfirmDel(null);
    setExpanded(null);
    pushToast(`${negocio.name} eliminado`, "warn");

    // 2. Le avisamos a Supabase que lo borre de verdad
    try {
      await fetch(`/api/businesses/${negocio.id}`, { method: "DELETE" });
    } catch (err) {
      pushToast("Error al eliminar en el servidor", "warn");
    }
  };
  const addNote = (id: string, text: string) => {
    const note = { id: uid(), text, date: new Date().toISOString().slice(0, 10), author: "Admin" };
    setNegocios(p => p.map(n => n.id === id ? { ...n, notes: [...n.notes, note] } : n));
  };

 

  const createNegocio = async (data: any) => {
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Error al guardar");

      const newBusiness = await res.json();
      
      newBusiness.notes = [];
      newBusiness.paymentHistory = [];

      setNegocios(p => [newBusiness, ...p]);
      pushToast("Cliente creado con éxito", "ok");
      // Trigger a re-fetch to update stats? We can just do a page reload or let it be.
    } catch (error) {
      pushToast("Error al crear cliente", "warn");
    }
  };

  return (
    <>
      <div className={styles.app}>
        <div className={styles.inner}>

          {/* TOPBAR */}
          <div className={styles.topbar}>
            <div className={styles['logo-wrap']}>
              <div className={styles['logo-mark']}>⬡</div>
              <div>
                <div className={styles['logo-text']}>AdminCRM</div>
                <div className={styles['logo-sub']}>PANEL DE CONTROL</div>
              </div>
            </div>
            <div className={styles['topbar-right']} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <Link href="/" className={styles['btn-cancel']} style={{ padding: "8px 16px", textDecoration: "none" }}>Inicio</Link>
              <button onClick={() => signOut()} className={styles['btn-cancel']} style={{ padding: "8px 16px", border: "1px solid var(--border)" }}>Cerrar Sesión</button>
              <div className={styles['topbar-date']} suppressHydrationWarning>
                {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "1px solid var(--border)" }}>
            <button onClick={() => setAdminTab("crm")} style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: adminTab === "crm" ? "2px solid var(--accent)" : "2px solid transparent", color: adminTab === "crm" ? "var(--t0)" : "var(--t2)", cursor: "pointer", fontWeight: 600 }}>CRM y Clientes</button>
            <button onClick={() => setAdminTab("support")} style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: adminTab === "support" ? "2px solid var(--accent)" : "2px solid transparent", color: adminTab === "support" ? "var(--t0)" : "var(--t2)", cursor: "pointer", fontWeight: 600, display: "flex", gap: "8px", alignItems: "center" }}>
              Mensajes y Soporte
              {unreadSupport > 0 && <span style={{ background: "var(--red)", color: "white", padding: "2px 6px", borderRadius: "12px", fontSize: "10px" }}>{unreadSupport}</span>}
            </button>
            <button onClick={() => setAdminTab("alerts")} style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: adminTab === "alerts" ? "2px solid var(--accent)" : "2px solid transparent", color: adminTab === "alerts" ? "var(--t0)" : "var(--t2)", cursor: "pointer", fontWeight: 600 }}>Alertas Globales</button>
            <button onClick={() => setAdminTab("whatsapp")} style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: adminTab === "whatsapp" ? "2px solid var(--green)" : "2px solid transparent", color: adminTab === "whatsapp" ? "var(--green)" : "var(--t2)", cursor: "pointer", fontWeight: 600 }}>WhatsApp Bot</button>
          </div>

          {adminTab === "crm" && (
            <>
              {/* STATS */}
          <div className={styles.stats}>
            <div className={styles.stat} onClick={() => setFilter("all")} style={{ cursor: "pointer", border: filter === "all" ? "1px solid var(--accent)" : undefined }}>
              <div className={styles['stat-top']}>
                <div className={styles['stat-icon-wrap']} style={{ background: "rgba(108,142,255,0.12)", color: "var(--accent)" }}>⬡</div>
                <span className={styles['stat-change']}>TOTAL</span>
              </div>
              <div className={styles['stat-val']} style={{ color: "var(--accent)" }}>{totales.all}</div>
              <div className={styles['stat-lbl']}>Clientes</div>
            </div>
            <div className={styles.stat} onClick={() => setFilter("ACTIVE")} style={{ cursor: "pointer", border: filter === "ACTIVE" ? "1px solid var(--green)" : undefined }}>
              <div className={styles['stat-top']}>
                <div className={styles['stat-icon-wrap']} style={{ background: "rgba(0,229,160,0.1)", color: "var(--green)" }}>●</div>
                <span className={styles['stat-change']}>ACTIVOS</span>
              </div>
              <div className={styles['stat-val']} style={{ color: "var(--green)" }}>{totales.ACTIVE}</div>
              <div className={styles['stat-lbl']}>Activos</div>
            </div>
            <div className={styles.stat} onClick={() => setFilter("DEMO")} style={{ cursor: "pointer", border: filter === "DEMO" ? "1px solid var(--yellow)" : undefined }}>
              <div className={styles['stat-top']}>
                <div className={styles['stat-icon-wrap']} style={{ background: "rgba(245,166,35,0.1)", color: "var(--yellow)" }}>◑</div>
                <span className={styles['stat-change']} style={{ color: "var(--yellow)" }}>EN CURSO</span>
              </div>
              <div className={styles['stat-val']} style={{ color: "var(--yellow)" }}>{totales.DEMO}</div>
              <div className={styles['stat-lbl']}>En demo</div>
            </div>
            <div className={styles.stat}>
              <div className={styles['stat-top']}>
                <div className={styles['stat-icon-wrap']} style={{ background: "rgba(0,229,160,0.08)", color: "var(--green)" }}>$</div>
                <span className={styles['stat-change']}>MENSUAL</span>
              </div>
              <div className={styles['stat-val']} style={{ fontSize: 26, color: "var(--green)", letterSpacing: "-0.02em" }}>
                {fmtMoney(totales.revenue)}
              </div>
              <div className={styles['stat-lbl']}>MRR Activos</div>
            </div>
          </div>
          
          {/* CHART */}
          {totales.chartData && totales.chartData.length > 0 && (
            <div className={styles.stats} style={{ marginTop: 24, padding: 20, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16 }}>
              <h3 style={{ fontSize: 14, color: "var(--t2)", marginBottom: 16, width: "100%" }}>Altas últimos 6 meses</h3>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end", height: 100, width: "100%" }}>
                {totales.chartData.map((d: any, i: number) => {
                  const max = Math.max(...totales.chartData.map((x: any) => x.count), 1);
                  const h = (d.count / max) * 100;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <div style={{ width: "100%", height: 80, background: "rgba(255,255,255,0.05)", borderRadius: 4, position: "relative" }}>
                        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: `${Math.max(h, 4)}%`, background: "var(--accent)", borderRadius: 4, transition: "height 0.3s" }}></div>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--t2)" }}>{d.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TOOLBAR */}
          <div className={styles.toolbar}>
            <div className={styles['search-wrap']}>
              <span className={styles['search-icon']}>⌕</span>
              <input ref={searchInputRef} className={styles['search-input']} placeholder="Buscar... (Cmd+K)"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className={styles['filter-tabs']}>
              {[["all","Todos"],["ACTIVE","Activos"],["DEMO","Demo"],["BLOCKED","Bloqueados"]].map(([k,l]) => (
                <button key={k} className={`ftab ${filter === k ? `active ${k}` : ""}`} onClick={() => setFilter(k)}>
                  {l} {k !== "all" && <span style={{ opacity: .6, fontSize: 11 }}>({totales[k as keyof typeof totales]})</span>}
                </button>
              ))}
            </div>

            <div className={styles['view-toggle']}>
              <button className={`vtbtn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>⊞</button>
              <button className={`vtbtn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}>☰</button>
            </div>

            <button className={styles['btn-new']} onClick={() => setDrawer(true)}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nuevo cliente
            </button>
          </div>

          {/* CARDS */}
          <div className={viewMode === "grid" ? "cards-grid" : "cards-list"}>
            {loading ? (
              <div className={styles.empty}>
                <div className={styles['empty-text']}>// Cargando datos reales...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles['empty-icon']}>⬡</div>
                <div className={styles['empty-text']}>// Sin resultados para "{search || filter}"</div>
              </div>
            ) : (
              filtered.map((negocio: any) => (
                <BizCard
                  key={negocio.id}
                  negocio={negocio}
                  isExpanded={expanded === negocio.id}
                  onToggle={toggleExpand}
                  onStatusChange={requestChangeStatus}
                  onDelete={(n: any) => setConfirmDel(n)}
                  onSave={saveEdits}
                  onNoteAdd={addNote}
                  toast={pushToast}
                  viewMode={viewMode}
                />
              ))
            )}
          </div>
          
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 24, paddingBottom: 24 }}>
              <button className={styles['btn-cancel']} onClick={() => setPage(p => p + 1)} disabled={loading}>
                {loading ? "Cargando..." : "Cargar más"}
              </button>
            </div>
          )}
          </>
          )}

          {adminTab === "support" && <AdminSupport showToast={pushToast} />}
          {adminTab === "alerts" && <AdminAlerts showToast={pushToast} />}
          {adminTab === "whatsapp" && <AdminWhatsApp />}

        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && (
        <NewClientDrawer onClose={() => setDrawer(false)} onSave={createNegocio} />
      )}

      {/* DELETE CONFIRM */}
      {confirmDel && (
        <div className={styles['confirm-overlay']}>
          <div className={styles['confirm-box']}>
            <div className={styles['confirm-icon']}>⚠</div>
            <div className={styles['confirm-title']}>Eliminar cliente</div>
            <div className={styles['confirm-sub']}>
              ¿Seguro que querés eliminar <strong>{confirmDel.name}</strong>?<br />
              Esta acción no se puede deshacer.
            </div>
            <div className={styles['confirm-actions']}>
              <button className={styles['btn-cancel']} onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className={styles['btn-confirm-del']} onClick={() => deleteNegocio(confirmDel)}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK CONFIRM */}
      {confirmBlock && (
        <div className={styles['confirm-overlay']}>
          <div className={styles['confirm-box']}>
            <div className={styles['confirm-icon']} style={{ color: "var(--yellow)" }}>⚠</div>
            <div className={styles['confirm-title']}>Bloquear negocio</div>
            <div className={styles['confirm-sub']}>
              ¿Seguro que querés bloquear a <strong>{confirmBlock.name}</strong>?<br />
              El cliente no podrá acceder a su sistema y su landing no estará visible.
            </div>
            <div className={styles['confirm-actions']}>
              <button className={styles['btn-cancel']} onClick={() => setConfirmBlock(null)}>Cancelar</button>
              <button className={styles['btn-confirm-del']} style={{ background: "var(--yellow)", color: "#000" }} onClick={() => changeStatus(confirmBlock.id, confirmBlock.targetStatus)}>
                Sí, bloquear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className={styles['toast-wrap']}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.fading ? "fade" : ""}`}>
            <span style={{ color: t.type === "warn" ? "var(--yellow)" : "var(--green)" }}>
              {t.type === "warn" ? "◑" : "✓"}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}