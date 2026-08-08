"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Ico } from "@/lib/constants";

export default function PremiumLanding() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* ── BACKGROUND GLOWS ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      </div>

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#09090b]/80 backdrop-blur-xl border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="font-bold text-white tracking-tight font-display text-xl">MiniWebs</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
            <Link href="/login" className="text-white hover:text-indigo-400 transition-colors">Ingresar</Link>
          </div>
          <Link href="/register" className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-zinc-900 rounded-full text-sm font-semibold transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <main className="relative z-10 flex flex-col items-center text-center pt-40 pb-24 px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-widest uppercase mb-8 shadow-[0_0_15px_rgba(99,102,241,0.2)] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          La forma más rápida de crecer
        </div>

        <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500 mb-6 drop-shadow-sm">
          Tu negocio online en minutos.<br/>
          <span className="italic font-light text-zinc-400">Sin complicaciones.</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Crea la página web de tu barbería, clínica o taller, recibe turnos 24/7 y envía recordatorios por WhatsApp automáticamente.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link href="/register" className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 rounded-full font-semibold text-lg text-white transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
            Crear mi web ahora
          </Link>
          <a href="#demo" className="px-8 py-4 rounded-full font-semibold text-lg text-white border border-white/10 hover:bg-white/5 transition-all backdrop-blur-sm">
            Ver cómo funciona
          </a>
        </div>

        {/* ── MOCKUP DASHBOARD INTERACTIVO ── */}
        <div className="mt-20 relative w-full max-w-4xl mx-auto perspective-1000">
          <div className="relative rounded-2xl border border-white/10 bg-[#09090b]/80 backdrop-blur-2xl shadow-2xl p-2 transform rotate-x-[5deg] scale-[0.98] hover:rotate-x-0 hover:scale-100 transition-all duration-700 ease-out group">
            {/* Header del Mockup */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="mx-auto px-10 py-1 bg-white/5 rounded-full text-xs text-zinc-400 font-mono">
                panel.miniwebs.com
              </div>
            </div>
            {/* Cuerpo del Mockup */}
            <div className="grid grid-cols-4 gap-4 p-4 h-[400px] overflow-hidden">
              {/* Sidebar */}
              <div className="col-span-1 border-r border-white/5 pr-4 flex flex-col gap-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`h-8 rounded-md ${i===2 ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white/5'} w-full transition-colors group-hover:bg-white/10`} />
                ))}
              </div>
              {/* Contenido */}
              <div className="col-span-3 flex flex-col gap-4">
                <div className="h-24 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-xl border border-white/5 flex items-center px-6 gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Ico n="check" c="text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-zinc-200 font-semibold mb-1">Nuevo turno confirmado</div>
                    <div className="text-zinc-500 text-sm">WhatsApp enviado a Juan Pérez</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 bg-white/5 rounded-xl border border-white/5" />
                  <div className="h-32 bg-white/5 rounded-xl border border-white/5" />
                </div>
              </div>
            </div>
            
            {/* Resplandor inferior */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-indigo-500/20 blur-[50px]" />
          </div>
        </div>
      </main>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-32 border-t border-white/5 bg-[#09090b]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Herramientas Enterprise. Precio Local.</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-light">Diseñamos una plataforma que compite con los grandes del software, pero pensada para la barbería de tu barrio.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "calendar", title: "Agenda Inteligente", desc: "Sincroniza horarios, evita conflictos y permite a tus clientes elegir cuándo ir." },
              { icon: "phone", title: "WhatsApp Bot", desc: "Confirmaciones y recordatorios automáticos para reducir ausencias." },
              { icon: "edit-3", title: "Editor Visual", desc: "Cambia colores, textos y fotos haciendo clic directo en tu página." },
              { icon: "shopping-bag", title: "Tienda y Menú", desc: "Catálogo de productos o menú digital con carrito y pedidos al WhatsApp." },
              { icon: "users", title: "CRM y Clientes", desc: "Historial completo, notas internas y datos de contacto siempre a mano." },
              { icon: "pie-chart", title: "Métricas Reales", desc: "Entiende qué servicios venden más y cuánto ganaste este mes." }
            ].map((f, i) => (
              <div key={i} className="group relative bg-white/5 border border-white/5 p-8 rounded-3xl hover:bg-white/[0.07] transition-colors overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] group-hover:bg-indigo-500/20 transition-colors" />
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/20">
                  <Ico n={f.icon} s={24} c="text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-zinc-400 leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative z-10 py-32 border-t border-white/5 bg-gradient-to-b from-[#09090b] to-[#12121a]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Un precio simple. Sin sorpresas.</h2>
          <p className="text-zinc-400 text-lg mb-16 font-light">Comienza con todas las funciones liberadas.</p>
          
          <div className="relative p-1 rounded-3xl bg-gradient-to-b from-indigo-500/50 to-transparent mx-auto max-w-lg shadow-[0_0_50px_rgba(99,102,241,0.1)]">
            <div className="bg-[#09090b] rounded-[22px] p-10 border border-white/10">
              <div className="text-indigo-400 font-semibold uppercase tracking-widest text-sm mb-4">Plan Profesional</div>
              <div className="flex items-center justify-center gap-1 mb-8">
                <span className="text-2xl text-zinc-500 font-medium">$</span>
                <span className="text-6xl font-bold text-white tracking-tight">299</span>
                <span className="text-xl text-zinc-500 font-medium">MXN/mes</span>
              </div>
              
              <ul className="space-y-4 text-left mb-10">
                {["Página web autogestionable", "Turnos ilimitados", "Recordatorios por WhatsApp", "CRM de clientes", "Catálogo de productos", "Soporte prioritario"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-300">
                    <Ico n="check" c="text-indigo-400" s={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/register" className="block w-full py-4 bg-white hover:bg-zinc-200 text-zinc-900 rounded-xl font-bold text-lg transition-colors text-center">
                Comenzar Prueba Gratis
              </Link>
              <p className="text-zinc-500 text-xs mt-4">14 días de prueba. Cancela cuando quieras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6 bg-[#09090b]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
              <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="font-bold font-display text-white">MiniWebs</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-zinc-300 transition-colors">Términos</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacidad</a>
          </div>
          <p className="text-sm text-zinc-500">© {new Date().getFullYear()} MiniWebs.</p>
        </div>
      </footer>
    </div>
  );
}