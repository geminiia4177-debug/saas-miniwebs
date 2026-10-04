"use client";

import React, { useState } from "react";
import { AdminBusiness, RUBRO_META, formatCurrency, formatDate } from "./adminTypes";
import {
  X,
  Save,
  Key,
  CreditCard,
  FileText,
  Info,
  ExternalLink,
  Copy,
  Check,
  RotateCw,
  Plus,
} from "lucide-react";

export interface ClientDetailSheetProps {
  business: AdminBusiness | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updatedData: any) => Promise<void>;
  onAddNote: (id: string, text: string) => Promise<void>;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const ClientDetailSheet: React.FC<ClientDetailSheetProps> = ({
  business,
  isOpen,
  onClose,
  onSave,
  onAddNote,
  showToast,
}) => {
  if (!isOpen || !business) return null;

  const [activeTab, setActiveTab] = useState<"info" | "payment" | "security" | "notes">("info");
  const [formData, setFormData] = useState<AdminBusiness>({ ...business });
  const [saving, setSaving] = useState(false);

  // Security password reset
  const [newPassword, setNewPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [copiedPwd, setCopiedPwd] = useState(false);

  // Notes
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "Pass-";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      showToast("Ingresa o genera una contraseña", "error");
      return;
    }
    setResettingPassword(true);
    try {
      const res = await fetch(`/api/businesses/${business.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, mustChangePassword }),
      });
      if (res.ok) {
        showToast("Contraseña actualizada exitosamente ✓", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Error al actualizar clave", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(business.id, formData);
      showToast("Datos del cliente guardados ✓", "success");
    } catch {
      showToast("Error al guardar cambios", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await onAddNote(business.id, newNote.trim());
      setNewNote("");
      showToast("Nota agregada ✓", "success");
    } catch {
      showToast("Error al agregar nota", "error");
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0F1424] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl animate-slideLeft text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#11182B]">
          <div className="flex items-center gap-3 min-w-0">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-sm border border-indigo-500/20 shrink-0">
                {business.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-black text-white truncate">{business.name}</h2>
              <span className="text-xs font-mono text-slate-400">/{business.subdomain}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 px-6 bg-[#0E1322]">
          {[
            { id: "info", label: "Información", icon: <Info className="w-3.5 h-3.5" /> },
            { id: "payment", label: "Pagos & Plan", icon: <CreditCard className="w-3.5 h-3.5" /> },
            { id: "security", label: "Clave & Seguridad", icon: <Key className="w-3.5 h-3.5" /> },
            { id: "notes", label: `Notas (${business.notes?.length || 0})`, icon: <FileText className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* TAB 1: INFORMACIÓN */}
          {activeTab === "info" && (
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Subdominio</label>
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Dominio Propio</label>
                  <input
                    type="text"
                    value={formData.customDomain || ""}
                    placeholder="ej: tudominio.com"
                    onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Rubro</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#11182B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {Object.entries(RUBRO_META).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#11182B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="DEMO">Demo</option>
                    <option value="TRIAL">Trial</option>
                    <option value="BLOCKED">Bloqueado</option>
                    <option value="ARCHIVED">Archivado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={formData.whatsapp || ""}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
              </button>
            </form>
          )}

          {/* TAB 2: PAGOS & PLAN */}
          {activeTab === "payment" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Estado de Pago:</span>
                  <span className="font-bold text-emerald-400 capitalize">
                    {formData.paymentStatus || "Al día"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Monto de Abono:</span>
                  <span className="font-bold text-white tabular-nums">
                    {formatCurrency(formData.paymentAmount, formData.country || "MX")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">País de Facturación:</span>
                  <span className="font-bold text-white">
                    {formData.country === "AR" ? "🇦🇷 Argentina" : "🇲🇽 México"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Vencimiento Demo:</span>
                  <span className="font-mono text-slate-300">
                    {formatDate(formData.demoExpiresAt, formData.country || "MX")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLAVE & SEGURIDAD */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white">Restablecer Contraseña del Dueño</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generá una clave segura o escribí una personalizada para entregarle al cliente.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nueva contraseña..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Aleatoria</span>
                  </button>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="rounded accent-indigo-500"
                  />
                  <span>Obligar al usuario a cambiar la clave en el próximo login</span>
                </label>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resettingPassword || !newPassword}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {resettingPassword ? "Actualizando..." : "Aplicar Nueva Contraseña"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: NOTAS */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <form onSubmit={handleAddNoteSubmit} className="space-y-2">
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Agregar una nota interna sobre este cliente..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={addingNote || !newNote.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{addingNote ? "Guardando..." : "Agregar Nota"}</span>
                </button>
              </form>

              <div className="space-y-2 pt-2">
                {(!business.notes || business.notes.length === 0) ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">
                    No hay notas registradas para este negocio.
                  </p>
                ) : (
                  business.notes.map((n: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1">
                      <p className="text-slate-200">{n.text}</p>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(n.date).toLocaleString("es-AR")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
