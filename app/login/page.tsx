"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar email guardado si el usuario eligió recordar sesión previamente
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("saas_remember_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage errors (incognito / sandboxed)
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (rememberMe) {
        localStorage.setItem("saas_remember_email", email.trim());
      } else {
        localStorage.removeItem("saas_remember_email");
      }
    } catch {
      // Ignore
    }

    const res = await signIn("credentials", {
      redirect: false,
      email: email.trim(),
      password,
      remember: rememberMe ? "true" : "false",
    });

    if (res?.error) {
      setError(
        res.error.includes("bloqueada")
          ? res.error
          : "Correo o contraseña incorrectos. Por favor verifica tus credenciales."
      );
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8"
      style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, #151b2e 0%, #07090e 100%)",
        fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif"
      }}
    >
      {/* Luces y auras decorativas */}
      <div
        className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full opacity-25 blur-[140px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #6366f1 0%, rgba(99,102,241,0) 70%)" }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-20 blur-[150px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #a855f7 0%, rgba(168,85,247,0) 70%)" }}
      />

      <div className="w-full max-w-[440px] z-10">
        {/* Cabecera de Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 8px 32px rgba(99,102,241,0.25)"
            }}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              ⬡
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Acceso al Panel
          </h1>
          <p className="text-slate-400 text-sm">
            Ingresá a tu negocio para gestionar turnos y ventas
          </p>
        </div>

        {/* Tarjeta Glassmorphism */}
        <div
          className="rounded-3xl p-7 sm:p-8 border shadow-2xl backdrop-blur-2xl transition-all"
          style={{
            background: "linear-gradient(160deg, rgba(26, 32, 48, 0.75), rgba(11, 14, 23, 0.85))",
            borderColor: "rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 60px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)"
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dueño@minegocio.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-all disabled:opacity-50"
                  style={{
                    background: "rgba(10, 14, 24, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.08)"
                  }}
                />
              </div>
            </div>

            {/* Input Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition-all disabled:opacity-50"
                  style={{
                    background: "rgba(10, 14, 24, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.08)"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  tabIndex={-1}
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Mantener sesión iniciada (Checkbox estilizado) */}
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className="w-5 h-5 rounded-md border flex items-center justify-center transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-500"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(255,255,255,0.15)"
                    }}
                  >
                    <svg
                      className={`w-3.5 h-3.5 text-white transition-transform ${
                        rememberMe ? "scale-100 opacity-100" : "scale-50 opacity-0"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-300 group-hover:text-white transition-colors">
                    Mantener mi sesión iniciada
                  </span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Permanece conectado por 30 días en este dispositivo
                  </p>
                </div>
              </label>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div
                className="p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 animate-fadeIn"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.25)",
                  color: "#fca5a5"
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón de Ingresar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 hover:brightness-110 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 group"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)"
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Garantía de Seguridad */}
          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Conexión cifrada de alta seguridad</span>
          </div>
        </div>

        {/* Volver al inicio */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            ← Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}