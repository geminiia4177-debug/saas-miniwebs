"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { Lock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function ForcePasswordChangePage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (!/[A-Z]/.test(pwd)) return "La contraseña debe contener al menos una letra mayúscula.";
    if (!/[0-9]/.test(pwd)) return "La contraseña debe contener al menos un número.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ocurrió un error al cambiar la contraseña.");
      }

      setSuccess(true);
      // Wait a moment so the user sees the success state
      setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">Seguridad Obligatoria</h1>
          <p className="text-gray-400 text-center mb-8 text-sm">
            Para proteger tu cuenta, debes cambiar la contraseña por defecto antes de continuar.
          </p>

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-emerald-400 font-semibold mb-2">¡Contraseña actualizada!</h3>
              <p className="text-sm text-emerald-400/80">Cerrando sesión para que ingreses con tus nuevos datos...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Repetir Contraseña</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="Repite la nueva contraseña"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-gray-100 font-semibold rounded-xl px-4 py-3.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      Actualizar y Continuar
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
