"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Llamamos al CredentialsProvider que configuraste en auth.ts
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Correo o contraseña incorrectos");
      setLoading(false);
    } else {
      // Si todo está bien, lo mandamos a su panel
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#070b12", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Fondo decorativo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-20 blur-[120px] pointer-events-none" style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}></div>
      
      <div className="w-full max-w-[420px] p-8 z-10">
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-6 h-6 border-2 border-indigo-400 rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-400 rounded-sm"></div>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Acceso al Panel</h1>
          <p className="text-slate-400 text-sm">Ingresá tus credenciales para continuar</p>
        </div>

        <div className="rounded-3xl p-8 border shadow-2xl backdrop-blur-xl" style={{ background: "linear-gradient(145deg, rgba(30,41,59,0.4), rgba(15,23,42,0.6))", borderColor: "rgba(255,255,255,0.05)" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com" 
                required
                disabled={loading}
                className="w-full px-4 py-3.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                disabled={loading}
                className="w-full px-4 py-3.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50"
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 mt-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25" 
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
            >
              {loading ? "Verificando..." : "Ingresar"}
            </button>
          </form>

        </div>
        
        <div className="mt-8 text-center">
          <a href="/" className="text-[12px] text-slate-400 hover:text-white transition-colors">← Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}