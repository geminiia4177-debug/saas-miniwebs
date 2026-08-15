"use client";

import React, { useState, useRef, useCallback } from "react";
import { Biz, MediaItem, Appointment, Ico, DEFAULT_HOURS } from "@/lib/constants";
import { DropZone } from "./editor/DropZone";
import IntelligenceTab from "./IntelligenceTab";

// ─────────────────────────────────────────────
// IMGBB UPLOAD (Aislado para el panel de gestión)
// ─────────────────────────────────────────────
const uploadToImgBB = async (file: File, businessId: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("businessId", businessId);
  const res = await fetch(
    `/api/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.url;
};

// ─────────────────────────────────────────────
// FORMATO DE BYTES
// ─────────────────────────────────────────────
const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// ─────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────
const ProgressBar = ({ progress, label }: { progress: number; label: string }) => (
  <div className="mt-2">
    <div className="flex justify-between text-xs text-slate-400 mb-1">
      <span>{label}</span><span>{Math.round(progress)}%</span>
    </div>
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#6366f1,#a855f7)" }} />
    </div>
  </div>
);



// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL: MANAGEMENT TABS
// ─────────────────────────────────────────────
export default function ManagementTabs({ 
  tab, biz, setBiz, media, setMedia, appointments, setAppointments, saveAll, saving, showToast, uploadQueue, uploadFiles 
}: any) {
  
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [mediaViewMode, setMediaViewMode] = useState<"grid" | "list">("grid");
  const logoRef = useRef<HTMLInputElement>(null);

  // Password State
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const handlePasswordChange = async () => {
    if(!pwdCurrent || !pwdNew) return showToast("Faltan datos", "warn");
    setPwdLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwdCurrent, newPassword: pwdNew })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar contraseña");
      showToast("Contraseña actualizada!", "success");
      setPwdCurrent(""); setPwdNew("");
    } catch(e: any) {
      showToast(e.message, "error");
    } finally {
      setPwdLoading(false);
    }
  };

  // Delete Store State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleDeleteStore = async () => {
    if (deleteConfirmText !== "ELIMINAR") {
      return showToast("Debes escribir ELIMINAR para confirmar", "error");
    }
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/business/delete", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar la tienda");
      }
      showToast("Tienda eliminada. Redirigiendo...", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch(e: any) {
      showToast(e.message, "error");
      setDeleteLoading(false);
    }
  };

  // Completar Modal State
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  // Calendar View
  const [apptsViewMode, setApptsViewMode] = useState<"list" | "calendar">("list");
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay, year, month };
  };
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  // Manual Appointment State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ clientName: "", clientPhone: "", date: "", time: "", serviceName: "" });
  const [savingManual, setSavingManual] = useState(false);

  const handleSaveManual = async () => {
    if (!biz || !manualForm.clientName || !manualForm.date || !manualForm.time) return;
    setSavingManual(true);
    const dateStr = new Date(`${manualForm.date}T${manualForm.time}:00`).toISOString();
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: biz.id,
          clientName: manualForm.clientName,
          clientPhone: manualForm.clientPhone,
          serviceName: manualForm.serviceName || "Turno Manual",
          date: dateStr,
          status: "CONFIRMED",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments((prev: any) => [...prev, data]);
        setManualModalOpen(false);
        setManualForm({ clientName: "", clientPhone: "", date: "", time: "", serviceName: "" });
        showToast("Turno manual agregado ✓");
      }
    } catch {
      showToast("Error de conexión", "error");
    }
    setSavingManual(false);
  };

  React.useEffect(() => {
    if (tab === "appointments") {
      fetch(`/api/crm?businessId=${biz.id}&type=employees`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setEmployees(data);
        })
        .catch(console.error);
    }
  }, [tab, biz.id]);

  const pending = appointments.filter((a: Appointment) => a.status === "PENDING");

  const updateAppointmentStatus = async (id: string, newStatus: string, employeeId?: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, employeeId }),
      });
      if (res.ok) {
        setAppointments((prev: Appointment[]) => 
          prev.map((a: Appointment) => a.id === id ? { ...a, status: newStatus } : a)
        );
        showToast(newStatus === "CONFIRMED" ? "Turno confirmado ✓" : newStatus === "COMPLETED" ? "Turno completado e ingreso registrado ✓" : "Turno liberado ✓");
        if (newStatus === "COMPLETED") {
          setCompletingId(null);
          setSelectedEmployee("");
        }
      } else {
        showToast("Error al actualizar turno", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    }
  };

  const toggleSelectMedia = (id: string) => {
    setSelectedMedia(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const deleteSelectedMedia = () => {
    setMedia((prev: MediaItem[]) => prev.filter(m => !selectedMedia.has(m.id)));
    setSelectedMedia(new Set());
    showToast(`${selectedMedia.size} imagen${selectedMedia.size > 1 ? "es" : ""} eliminada${selectedMedia.size > 1 ? "s" : ""}`);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !biz) return;
    showToast("Subiendo logo...", "info");
    try {
      const url = await uploadToImgBB(file, biz.id);
      setBiz((prev: any) => prev ? { ...prev, logoUrl: url } : prev);
      showToast("Logo actualizado ✓");
    } catch {
      showToast("Error al subir el logo", "error");
    }
  };

  return (
    <>
      {/* ── GALERÍA ── */}
      {tab === "gallery" && (
        <div className="p-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight mb-0.5">Galería de Fotos</h1>
              <p className="text-sm text-slate-500">{media.length} imagen{media.length !== 1 ? "es" : ""} en tu biblioteca</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedMedia.size > 0 && (
                <button onClick={deleteSelectedMedia} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-400 transition-colors" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <Ico n="trash" s={14} /> Eliminar {selectedMedia.size}
                </button>
              )}
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {(["grid", "list"] as const).map(v => (
                  <button key={v} onClick={() => setMediaViewMode(v)}
                    className="w-8 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={mediaViewMode === v ? { background: "rgba(99,102,241,0.25)", color: "#fff" } : { color: "#64748b" }}>
                    <Ico n={v === "grid" ? "grid" : "list"} s={13} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DropZone onFiles={uploadFiles} multiple>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <Ico n="upload" s={28} c="text-indigo-400" />
              </div>
              <p className="text-sm font-bold text-white mb-1">Arrastrá fotos aquí o hacé click para subir</p>
              <p className="text-xs text-slate-500">Podés subir varias fotos a la vez • PNG, JPG, WebP — máx. 5 MB c/u</p>
            </div>
          </DropZone>

          {uploadQueue.length > 0 && (
            <div className="mt-4 rounded-2xl p-5 space-y-3" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Subiendo imágenes...</p>
              {uploadQueue.map((q: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      {q.status === "done" ? <Ico n="check" s={14} c="text-emerald-400" /> : q.status === "error" ? <Ico n="x" s={14} c="text-red-400" /> : <Ico n="loader" s={14} c="text-indigo-400 animate-spin" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium truncate">{q.file.name}</p>
                      <p className="text-[10px] text-slate-500">{formatBytes(q.file.size)}</p>
                    </div>
                  </div>
                  {q.status === "uploading" && <ProgressBar progress={q.progress} label="" />}
                </div>
              ))}
            </div>
          )}

          {media.length > 0 && (
            <div className="mt-6">
              {mediaViewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {media.map((img: MediaItem) => (
                    <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                      style={{ border: selectedMedia.has(img.id) ? "2px solid #6366f1" : "2px solid transparent" }}
                      onClick={() => toggleSelectMedia(img.id)}>
                      <img src={img.url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={img.name} />
                      <div className={`absolute inset-0 transition-opacity ${selectedMedia.has(img.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ background: "rgba(0,0,0,0.45)" }}>
                        <div className="absolute top-2 left-2">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: selectedMedia.has(img.id) ? "#6366f1" : "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                            {selectedMedia.has(img.id) && <Ico n="check" s={10} c="text-white" />}
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2">
                          <button onClick={e => { e.stopPropagation(); setMedia((prev: MediaItem[]) => prev.filter(m => m.id !== img.id)); }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.8)" }}>
                            <Ico n="trash" s={11} c="text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {media.map((img: MediaItem) => (
                    <div key={img.id} className="flex items-center gap-4 p-3 rounded-xl group transition-colors"
                      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${selectedMedia.has(img.id) ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.05)"}` }}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center cursor-pointer flex-shrink-0"
                        style={{ background: selectedMedia.has(img.id) ? "#6366f1" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                        onClick={() => toggleSelectMedia(img.id)}>
                        {selectedMedia.has(img.id) && <Ico n="check" s={10} c="text-white" />}
                      </div>
                      <img src={img.url} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt={img.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{img.name}</p>
                        <p className="text-[11px] text-slate-500">{img.size ? formatBytes(img.size) : "—"} • {img.uploadedAt ? new Date(img.uploadedAt).toLocaleDateString("es-MX") : "—"}</p>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={img.url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <Ico n="maximize" s={13} />
                        </a>
                        <button onClick={() => setMedia((prev: MediaItem[]) => prev.filter(m => m.id !== img.id))} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 transition-colors" style={{ background: "rgba(239,68,68,0.08)" }}>
                          <Ico n="trash" s={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {media.length === 0 && uploadQueue.length === 0 && (
            <div className="text-center py-16 text-slate-600">
              <Ico n="image" s={40} c="mx-auto mb-4 opacity-30" />
              <p className="font-semibold text-slate-500">Tu galería está vacía</p>
              <p className="text-sm mt-1">Subí fotos de tu trabajo para que aparezcan en tu página.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TURNOS ── */}
      {tab === "appointments" && (
        <div className="p-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight mb-0.5">Mis Turnos</h1>
              <p className="text-sm text-slate-500">{pending.length} pendiente{pending.length !== 1 ? "s" : ""} de confirmación</p>
            </div>
            <button onClick={() => setManualModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-80" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
              <Ico n="plus" s={14} /> Nuevo Turno Manual
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-24 px-6 border-2 border-dashed border-white/5 rounded-3xl bg-[#131929]/50">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))" }}>
                <Ico n="calendar" s={32} c="text-indigo-400" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">¡Tu agenda está lista!</h3>
              <p className="text-slate-400 max-w-sm mx-auto mb-6 text-sm">
                Todavía no tenés turnos. ¡Empezá a compartir tu link personalizado con tus clientes en Instagram o WhatsApp para llenarla!
              </p>
              <a href={`https://${biz.customDomain || `${biz.subdomain}.saas-miniwebs.com`}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-transform hover:scale-105" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                <Ico n="external-link" s={14} /> Ver y compartir mi página
              </a>
            </div>
          ) : apptsViewMode === "list" ? (
            <div className="space-y-3">
              {appointments.map((a: Appointment) => (
                <div key={a.id} className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: a.status === "PENDING" ? "rgba(245,158,11,0.15)" : a.status === "CONFIRMED" ? "rgba(16,185,129,0.15)" : a.status === "COMPLETED" ? "rgba(99,102,241,0.15)" : "rgba(239,68,68,0.15)" }}>
                      <Ico n="calendar" s={18} c={a.status === "PENDING" ? "text-amber-400" : a.status === "CONFIRMED" ? "text-emerald-400" : a.status === "COMPLETED" ? "text-indigo-400" : "text-red-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm">{a.clientName}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ 
                            background: a.status === "PENDING" ? "rgba(245,158,11,0.15)" : a.status === "CONFIRMED" ? "rgba(16,185,129,0.15)" : a.status === "COMPLETED" ? "rgba(99,102,241,0.15)" : "rgba(239,68,68,0.15)", 
                            color: a.status === "PENDING" ? "#f59e0b" : a.status === "CONFIRMED" ? "#10b981" : a.status === "COMPLETED" ? "#818cf8" : "#ef4444" 
                          }}>
                          {a.status === "PENDING" ? "Pendiente" : a.status === "CONFIRMED" ? "Confirmado" : a.status === "COMPLETED" ? "Completado" : "Cancelado"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {a.serviceName || "Servicio"} • {new Date(a.date).toLocaleDateString("es-MX")} a las {new Date(a.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {a.paymentMethod === 'TRANSFER' && a.paymentReference && (
                        <p className="text-[10px] font-bold text-indigo-400 mt-1 flex items-center gap-1.5">
                          <Ico n="dollar-sign" s={10} /> Transferencia • Ref: <span className="text-white bg-indigo-500/20 px-1.5 py-0.5 rounded">{a.paymentReference}</span>
                        </p>
                      )}
                    </div>
                    {a.clientphone && (
                      <a href={`tel:${a.clientphone}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-colors flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <Ico n="phone" s={14} />
                      </a>
                    )}
                  </div>
                  {a.status === "PENDING" && (
                    <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <button 
                        onClick={() => updateAppointmentStatus(a.id, "CONFIRMED")}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:text-white transition-colors"
                        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
                      >
                        Confirmar
                      </button>
                      <button 
                        onClick={() => updateAppointmentStatus(a.id, "CANCELLED")}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-white transition-colors"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                      >
                        Liberar / Rechazar
                      </button>
                    </div>
                  )}
                  {a.status === "CONFIRMED" && (
                    <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <button 
                        onClick={() => setCompletingId(a.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-indigo-400 hover:text-white transition-colors"
                        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
                      >
                        Marcar como Completado
                      </button>
                    </div>
                  )}

                  {/* Modal de Completar Turno */}
                  {completingId === a.id && (
                    <div className="pt-3 pb-2 border-t mt-2" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <p className="text-xs font-bold text-white mb-2">¿Qué barbero realizó este corte?</p>
                      <select 
                        value={selectedEmployee} 
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 mb-3"
                      >
                        <option value="" className="bg-[#131929]">Sin especificar</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id} className="bg-[#131929]">{emp.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => updateAppointmentStatus(a.id, "COMPLETED", selectedEmployee)} className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-colors">
                          Confirmar Ingreso
                        </button>
                        <button onClick={() => { setCompletingId(null); setSelectedEmployee(""); }} className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#131929] rounded-2xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                  <Ico n="chevron-left" s={14} />
                </button>
                <h2 className="text-white font-bold">{currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                  <Ico n="chevron-right" s={14} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-slate-500 py-2">{day}</div>
                ))}
                {(() => {
                  const { days, firstDay, year, month } = getDaysInMonth(currentDate);
                  const blanks = Array.from({ length: firstDay }).map((_, i) => <div key={`blank-${i}`} className="p-2" />);
                  const daysCells = Array.from({ length: days }).map((_, i) => {
                    const d = i + 1;
                    const dateStr = new Date(year, month, d).toDateString();
                    const dayAppts = appointments.filter((a: Appointment) => new Date(a.date).toDateString() === dateStr);
                    const isToday = new Date().toDateString() === dateStr;
                    return (
                      <div key={d} className={`p-2 rounded-xl border ${isToday ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/5 bg-white/5"} min-h-[80px] flex flex-col gap-1`}>
                        <div className="text-xs font-bold text-slate-400 mb-1">{d}</div>
                        {dayAppts.map((a: Appointment) => (
                          <div key={a.id} className="text-[9px] px-1.5 py-0.5 rounded truncate" style={{
                            background: a.status === "PENDING" ? "rgba(245,158,11,0.15)" : a.status === "CONFIRMED" ? "rgba(16,185,129,0.15)" : a.status === "COMPLETED" ? "rgba(99,102,241,0.15)" : "rgba(239,68,68,0.15)",
                            color: a.status === "PENDING" ? "#f59e0b" : a.status === "CONFIRMED" ? "#10b981" : a.status === "COMPLETED" ? "#818cf8" : "#ef4444"
                          }}>
                            {new Date(a.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} - {a.clientName.split(" ")[0]}
                          </div>
                        ))}
                      </div>
                    );
                  });
                  return [...blanks, ...daysCells];
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL TURNO MANUAL */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-[#131929] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Agregar Turno Manual</h3>
              <button onClick={() => setManualModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <Ico n="x" s={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1.5 block">Nombre del Cliente</label>
                <input type="text" value={manualForm.clientName} onChange={e => setManualForm({...manualForm, clientName: e.target.value})} className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:border-indigo-500 focus:outline-none text-sm" placeholder="Ej: Juan Pérez" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1.5 block">Teléfono (opcional)</label>
                <input type="tel" value={manualForm.clientPhone} onChange={e => setManualForm({...manualForm, clientPhone: e.target.value})} className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:border-indigo-500 focus:outline-none text-sm" placeholder="Ej: 1154321234" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1.5 block">Servicio / Motivo</label>
                <input type="text" value={manualForm.serviceName} onChange={e => setManualForm({...manualForm, serviceName: e.target.value})} className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:border-indigo-500 focus:outline-none text-sm" placeholder="Ej: Mesa para 4 / Corte de Pelo" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold mb-1.5 block">Fecha</label>
                  <input type="date" value={manualForm.date} onChange={e => setManualForm({...manualForm, date: e.target.value})} className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:border-indigo-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold mb-1.5 block">Hora</label>
                  <input type="time" value={manualForm.time} onChange={e => setManualForm({...manualForm, time: e.target.value})} className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl focus:border-indigo-500 focus:outline-none text-sm" />
                </div>
              </div>
              <button disabled={savingManual || !manualForm.clientName || !manualForm.date || !manualForm.time} onClick={handleSaveManual} className="w-full mt-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-colors disabled:opacity-50">
                {savingManual ? "Guardando..." : "Crear Turno Confirmado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIG ── */}
      {tab === "config" && (
        <div className="p-8 max-w-2xl animate-fadeIn">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">Configuración General</h1>
            <p className="text-slate-500 text-sm">Identidad visual, logo, colores, datos de contacto y redes sociales.</p>
          </div>

          <div className="space-y-4">
            {/* Logo */}
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Logo</p>
              <div className="flex items-center gap-5">
                {biz.logoUrl
                  ? <img src={biz.logoUrl} className="w-20 h-20 rounded-2xl object-cover" alt="logo" />
                  : <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl text-white" style={{ background: `linear-gradient(135deg,${biz.primaryColor},${biz.secondaryColor})` }}>{biz.name.charAt(0)}</div>}
                <div className="flex-1">
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <button onClick={() => logoRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white mb-2" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                    <Ico n="upload" s={14} /> Subir nuevo logo
                  </button>
                  <p className="text-[11px] text-slate-600">PNG o JPG cuadrado, mín. 200×200 px</p>
                  {biz.logoUrl && (
                    <button onClick={() => setBiz((prev: any) => prev ? { ...prev, logoUrl: undefined } : prev)} className="text-[11px] text-red-400/60 hover:text-red-400 transition-colors mt-1">Eliminar logo</button>
                  )}
                </div>
              </div>
            </div>

            {/* Info del negocio */}
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Información del Negocio</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "name", label: "Nombre del negocio", type: "text", colSpan: 1 },
                  { key: "tagline", label: "Slogan / Tagline", type: "text", colSpan: 1 },
                  { key: "phone", label: "Teléfono", type: "tel", colSpan: 1 },
                  { key: "subdomain", label: "Link de tu página (URL)", type: "text", colSpan: 1 },
                ].map(({ key, label, type, colSpan }) => (
                  <div key={key} className={colSpan === 2 ? "col-span-2" : ""}>
                    <label className="block text-[10px] text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">{label}</label>
                    <input type={type} value={(biz as any)[key] || ""}
                      onChange={e => setBiz((prev: any) => prev ? { ...prev, [key]: e.target.value } : prev)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            {/* Configuración de Mensaje de WhatsApp */}
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Plantilla de WhatsApp (Confirmación)</p>
              <p className="text-xs text-slate-500 mb-3">Usa los siguientes botones para insertar variables mágicas en el mensaje.</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {["{{cliente}}", "{{fecha}}", "{{hora}}", "{{servicio}}", "{{negocio}}", "{{referencia}}", "{{datos_bancarios}}"].map(tag => (
                  <button key={tag} onClick={() => {
                    const current = biz.layoutConfig?.waTemplateConfirmed || `¡Hola! {{cliente}} tu turno en {{negocio}} quedó confirmado para {{fecha}} a las {{hora}} hs. ¡Te esperamos!`;
                    setBiz((prev: any) => ({...prev, layoutConfig: {...prev.layoutConfig, waTemplateConfirmed: current + " " + tag}}));
                  }} className="px-2 py-1 bg-white/5 hover:bg-white/10 text-indigo-300 rounded text-[10px] font-mono transition-colors border border-indigo-500/20">
                    {tag}
                  </button>
                ))}
              </div>

              <textarea 
                value={biz.layoutConfig?.waTemplateConfirmed || `¡Hola! {{cliente}} tu turno en {{negocio}} quedó confirmado para {{fecha}} a las {{hora}} hs. ¡Te esperamos!`}
                onChange={e => setBiz((prev: any) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, waTemplateConfirmed: e.target.value } }))}
                className="w-full px-3.5 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors min-h-[100px] resize-y font-mono"
              />
            </div>

            {/* Configuración de Contraseña */}
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Ico n="lock" s={14}/> Seguridad y Contraseña
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Contraseña Actual</label>
                  <input type="password" value={pwdCurrent} onChange={e=>setPwdCurrent(e.target.value)} placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">Nueva Contraseña</label>
                  <input type="password" value={pwdNew} onChange={e=>setPwdNew(e.target.value)} placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                </div>
              </div>
              <button 
                onClick={handlePasswordChange}
                disabled={pwdLoading || !pwdCurrent || !pwdNew}
                className="mt-4 px-5 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {pwdLoading ? "Actualizando..." : "Cambiar Contraseña"}
              </button>
            </div>

            {/* Zona de Peligro */}
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.05),rgba(239,68,68,0.1))", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Ico n="alert-triangle" s={14}/> Zona de Peligro
              </p>
              <p className="text-xs text-red-400/80 mb-4">
                Atención: Al eliminar tu tienda perderás todos los datos, turnos y configuraciones. Esta acción es irreversible y está alineada con las leyes de eliminación de datos.
              </p>
              <button 
                onClick={() => setDeleteModalOpen(true)}
                className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-bold transition-colors"
              >
                Eliminar mi tienda
              </button>
            </div>

            {/* Horarios de Atención */}
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Horarios de Atención</p>
              <div className="space-y-3">
                {["lunes","martes","miercoles","jueves","viernes","sabado","domingo"].map(day => {
                  const hours = (biz.layoutConfig?.hours || DEFAULT_HOURS)[day] || DEFAULT_HOURS[day];
                  return (
                    <div key={day} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${hours.open ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"}` }}>
                      <div onClick={() => {
                        const h = { ...(biz.layoutConfig?.hours || DEFAULT_HOURS), [day]: { ...hours, open: !hours.open } };
                        setBiz((prev: any) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, hours: h } }));
                      }} className="w-10 h-5 rounded-full relative transition-colors cursor-pointer flex-shrink-0"
                        style={{ background: hours.open ? "#6366f1" : "rgba(255,255,255,0.08)" }}>
                        <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: hours.open ? "22px" : "2px" }} />
                      </div>
                      <span className="text-xs font-semibold capitalize w-20 text-white" style={{ opacity: hours.open ? 1 : 0.4 }}>{day}</span>
                      {hours.open ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input type="time" value={hours.from}
                            onChange={e => {
                              const h = { ...(biz.layoutConfig?.hours || DEFAULT_HOURS), [day]: { ...hours, from: e.target.value } };
                              setBiz((prev: any) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, hours: h } }));
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none" />
                          <span className="text-slate-600 text-xs">a</span>
                          <input type="time" value={hours.to}
                            onChange={e => {
                              const h = { ...(biz.layoutConfig?.hours || DEFAULT_HOURS), [day]: { ...hours, to: e.target.value } };
                              setBiz((prev: any) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, hours: h } }));
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none" />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Cerrado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Redes sociales */}
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Redes Sociales</p>
              <div className="space-y-3">
                {[
                  { key: "instagram", label: "Instagram", icon: "instagram", ph: "@mi.negocio", prefix: "instagram.com/" },
                  { key: "facebook", label: "Facebook", icon: "facebook", ph: "mi.negocio", prefix: "facebook.com/" },
                  { key: "tiktok", label: "TikTok", icon: "tiktok", ph: "@mi.negocio", prefix: "tiktok.com/@" },
                  { key: "whatsapp", label: "WhatsApp", icon: "whatsapp", ph: "+525512345678", prefix: "wa.me/" },
                ].map(({ key, label, icon, ph, prefix }) => (
                  <div key={key}>
                    <label className="block text-[10px] text-slate-500 mb-1.5 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                      <Ico n={icon} s={12} /> {label}
                    </label>
                    <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-white/10 focus-within:border-indigo-500/50 transition-colors">
                      <span className="px-3 py-2.5 text-xs text-slate-500 bg-white/5 border-r border-white/10 whitespace-nowrap">{prefix}</span>
                      <input type="text" value={(biz as any)[key] || ""} placeholder={ph}
                        onChange={e => setBiz((prev: any) => prev ? { ...prev, [key]: e.target.value } : prev)}
                        className="flex-1 px-3 py-2.5 text-sm text-white bg-transparent focus:outline-none" />
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-slate-600 mt-1">Estos links aparecen en el hero y el footer de tu página.</p>
              </div>
            </div>

            {/* Integraciones */}
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Integraciones (Opcional)</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">CallMeBot - API Key (WhatsApp Notifications)</label>
                  <input type="text" value={biz.layoutConfig?.callMeBotApiKey || ""} placeholder="Tu API Key"
                    onChange={e => setBiz((prev: any) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, callMeBotApiKey: e.target.value } }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5 font-semibold uppercase tracking-wide">CallMeBot - Teléfono</label>
                  <input type="text" value={biz.layoutConfig?.callMeBotPhone || ""} placeholder="+52551..."
                    onChange={e => setBiz((prev: any) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, callMeBotPhone: e.target.value } }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:outline-none transition-colors" />
                  <p className="text-[10px] text-slate-600 mt-2">Ingresá estos datos si querés recibir un aviso interno a tu WhatsApp cada vez que se reserve un turno.</p>
                </div>
              </div>
            </div>

            {/* Colores */}
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Colores de Marca</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: "primaryColor", label: "Principal" },
                  { key: "secondaryColor", label: "Secundario" },
                  { key: "accentColor", label: "Acento" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-[10px] text-slate-500 mb-2 font-semibold">{label}</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <input type="color" value={(biz as any)[key] || "#000000"}
                        onChange={e => setBiz((prev: any) => prev ? { ...prev, [key]: e.target.value } : prev)}
                        className="w-8 h-8 rounded-lg flex-shrink-0" />
                      <span className="text-xs font-mono text-slate-400">{(biz as any)[key] || "#000000"}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-8 rounded-xl flex-1" style={{ background: `linear-gradient(135deg,${biz.primaryColor},${biz.secondaryColor})` }} />
                <div className="w-8 h-8 rounded-xl flex-shrink-0" style={{ background: biz.accentColor }} />
              </div>
            </div>

            {/* Tipografía */}
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#131929,#111825)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Tipografía</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { val: "sans", label: "Moderna", sample: "Aa", fontStyle: "system-ui" },
                  { val: "serif", label: "Clásica", sample: "Aa", fontStyle: "Georgia,serif" },
                  { val: "mono", label: "Tech", sample: "Aa", fontStyle: "monospace" },
                  { val: "rounded", label: "Redonda", sample: "Aa", fontStyle: "'Nunito',system-ui" },
                ].map(f => (
                  <button key={f.val} onClick={() => setBiz((prev: any) => prev ? { ...prev, fontFamily: f.val } : prev)}
                    className="p-4 rounded-xl text-center transition-all"
                    style={biz.fontFamily === f.val ? { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)" } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xl font-bold text-white mb-1" style={{ fontFamily: f.fontStyle }}>{f.sample}</p>
                    <p className="text-[10px] font-semibold" style={{ color: biz.fontFamily === f.val ? "#818cf8" : "#64748b" }}>{f.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <button disabled={saving} onClick={saveAll} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
              {saving ? <><Ico n="loader" s={14} c="animate-spin" /> Guardando...</> : <><Ico n="check" s={14} /> Guardar toda la configuración</>}
            </button>
          </div>
        </div>
      )}

      {/* ── INTELIGENCIA ── */}
      {tab === "intelligence" && (
        <IntelligenceTab businessId={biz.id} bizName={biz.name} />
      )}

      {/* MODAL ELIMINAR TIENDA */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-[#131929] w-full max-w-md rounded-2xl border border-red-500/30 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <Ico n="alert-triangle" s={20} /> Eliminar Tienda
              </h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <Ico n="x" s={20} />
              </button>
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Esta acción es <strong className="text-red-400">irreversible</strong>. Todos tus turnos, empleados, ventas y configuraciones serán eliminados de forma permanente.
            </p>
            <p className="text-xs text-slate-400 mb-2">Para confirmar, escribe <strong>ELIMINAR</strong> a continuación:</p>
            <input 
              type="text" 
              value={deleteConfirmText} 
              onChange={e => setDeleteConfirmText(e.target.value)} 
              className="w-full px-3 py-2 bg-black/30 border border-red-500/30 text-white rounded-xl focus:border-red-500 focus:outline-none text-sm mb-4" 
              placeholder="ELIMINAR" 
            />
            <div className="flex gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors">
                Cancelar
              </button>
              <button 
                onClick={handleDeleteStore} 
                disabled={deleteLoading || deleteConfirmText !== "ELIMINAR"} 
                className="flex-1 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {deleteLoading ? "Eliminando..." : "Sí, eliminar tienda"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}