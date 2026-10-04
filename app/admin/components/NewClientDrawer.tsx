"use client";

import React, { useState } from "react";
import { RUBRO_META } from "./adminTypes";
import { X, Plus, RotateCw } from "lucide-react";

export interface NewClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (clientData: any) => Promise<void>;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const NewClientDrawer: React.FC<NewClientDrawerProps> = ({
  isOpen,
  onClose,
  onCreate,
  showToast,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [type, setType] = useState("general");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("MX");
  const [loading, setLoading] = useState(false);

  const handleGenRandomPwd = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pwd = "Pass-";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!subdomain) {
      setSubdomain(
        val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subdomain.trim() || !email.trim() || !password.trim()) {
      showToast("Completá todos los campos obligatorios", "error");
      return;
    }

    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        subdomain: subdomain.trim(),
        type,
        phone: phone.trim() || undefined,
        whatsapp: phone.trim() || undefined,
        email: email.trim(),
        password: password.trim(),
        country,
      });
      showToast("¡Nuevo negocio creado exitosamente! ✓", "success");
      onClose();
    } catch (err: any) {
      showToast(err.message || "Error al crear negocio", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0F1424] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl animate-slideLeft text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#11182B]">
          <h2 className="text-base font-black text-white">Alta de Nuevo Cliente</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Nombre Comercial *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Barbería Vintage"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Subdominio *</label>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white">
              <input
                type="text"
                required
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="barberia-vintage"
                className="flex-1 bg-transparent focus:outline-none font-mono"
              />
              <span className="text-slate-500 font-mono text-[11px]">.miniwebs.lat</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Rubro *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#11182B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {Object.entries(RUBRO_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">País *</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#11182B] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="MX">🇲🇽 México</option>
                <option value="AR">🇦🇷 Argentina</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp / Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +54 9 11 2345 6789"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Credenciales de Acceso
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email del Dueño *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-300">Contraseña Inicial *</label>
                <button
                  type="button"
                  onClick={handleGenRandomPwd}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-bold"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Generar</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Escribe o genera una clave..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{loading ? "Creando Negocio..." : "Crear y Publicar Negocio"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
