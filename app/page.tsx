import Link from "next/link";
import { Ico } from "@/lib/constants";

// ── 1. SEO METADATA ──────────────
export const metadata = {
  title: "SaaS MiniWebs | Crea tu página web con sistema de turnos",
  description: "La plataforma más fácil para crear una página web autogestionable para barberías, centros de estética y consultorios. Tus clientes sacan turno solos.",
  keywords: [
    "página web para agendar turnos de barbería", 
    "diseño web para centros de estética", 
    "turnero virtual para consultorios médicos",
    "app para que los clientes saquen turno solos",
    "crear pagina web sin saber programar",
    "link en bio para reservas"
  ],
};

// ── 2. COMPONENTE PRINCIPAL ───────────────────────────────────────────
export default function LandingPrincipal() {
  return (
    <div className="min-h-screen bg-[#080a10] text-white selection:bg-indigo-500/30 font-sans">
      
      {/* ── NAVBAR (L1) ── */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5" style={{ background: 'rgba(8,10,16,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span className="font-bold text-white tracking-tight">MiniWebs</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Funciones</a>
          <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
          <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Ingresar</a>
        </div>
        <Link href="/login" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white transition-colors">Empezar gratis</Link>
      </nav>

      {/* ── HERO SECTION ── */}
      <main className="relative flex flex-col items-center justify-center pt-40 pb-20 px-6 overflow-hidden text-center">
        <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-semibold tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            La alternativa fácil a WordPress para negocios locales
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Consigue más clientes con tu <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              página web autogestionable
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Un sistema todo en uno donde tus clientes sacan turno solos. Ideal para profesionales que quieren un link en su biografía de Instagram que realmente venda.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link 
              href="/login" 
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 rounded-xl font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] transform hover:-translate-y-1"
            >
              Crear mi web ahora
            </Link>
            <Link 
              href="#features" 
              className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-lg transition-all"
            >
              Ver demo
            </Link>
          </div>
        </div>
      </main>

      {/* ── FEATURES (L2) ── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Todo lo que necesitas para tu negocio</h2>
          <p className="text-gray-400">Deja de pagar múltiples herramientas, MiniWebs tiene todo integrado.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "calendar", title: "Turnos online 24/7", desc: "Tus clientes reservan solos. Sin WhatsApp, sin llamadas." },
            { icon: "globe", title: "Tu página en 5 min", desc: "Elige tu plantilla, personaliza colores y listo." },
            { icon: "phone", title: "WhatsApp integrado", desc: "Confirmaciones automáticas vía WhatsApp con Baileys." },
            { icon: "file-text", title: "CRM y Finanzas", desc: "Registra ventas, empleados y proveedores en un solo lugar." },
            { icon: "image", title: "Galería de fotos", desc: "Mostrá tu trabajo con una galería optimizada y lightbox." },
            { icon: "settings", title: "Editor sin código", desc: "Arrastrá secciones, cambiá colores, subí fotos. Todo visual." }
          ].map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                <Ico n={f.icon} s={24} c="text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRECIOS (L3) ── */}
      <section id="pricing" className="relative z-10 max-w-5xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Precios simples y transparentes</h2>
          <p className="text-gray-400">Sin comisiones por reserva ni costos ocultos.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col">
            <h3 className="text-xl font-bold text-white mb-2">Básico</h3>
            <p className="text-sm text-gray-400 mb-6">Ideal para profesionales independientes.</p>
            <div className="mb-6"><span className="text-4xl font-extrabold">$3.990</span><span className="text-gray-400">/mes</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              {["1 página web", "Turnos ilimitados", "Galería hasta 30 fotos", "WhatsApp FAB", "Soporte por email"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <Ico n="check" s={16} c="text-emerald-400" /> {item}
                </li>
              ))}
            </ul>
            <Link href="/login" className="w-full py-3 text-center rounded-xl font-bold border border-white/10 hover:bg-white/5 transition-colors">Empezar con Básico</Link>
          </div>
          <div className="bg-gradient-to-b from-indigo-900/40 to-indigo-900/10 border border-indigo-500/30 rounded-2xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-xs font-bold px-3 py-1 rounded-full text-white tracking-wide">MÁS POPULAR</div>
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <p className="text-sm text-indigo-200 mb-6">Para negocios con equipo y múltiples servicios.</p>
            <div className="mb-6"><span className="text-4xl font-extrabold">$7.990</span><span className="text-gray-400">/mes</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              {["Todo lo de Básico", "CRM + Finanzas", "Confirmaciones automáticas WhatsApp", "Múltiples empleados públicos", "Métricas de turnos", "Soporte prioritario"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <Ico n="check" s={16} c="text-indigo-400" /> {item}
                </li>
              ))}
            </ul>
            <Link href="/login" className="w-full py-3 text-center rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">Prueba Gratis de 14 días</Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS (L4) ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5 bg-white/[0.02]">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
          <p className="text-gray-400">Únete a más de 500 profesionales que ya digitalizaron su negocio.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Martín R.", role: "Dueño de Barbería", text: "Antes pasaba 2 horas al día respondiendo WhatsApps para dar turnos. Ahora la gente entra al link, reserva sola y yo me dedico a cortar." },
            { name: "Sofía Gómez", role: "Cosmiatra", text: "El diseño de la página es hermoso. Mis clientas me dicen que se ve súper profesional. Además el CRM me ayuda a llevar las cuentas." },
            { name: "Dr. L. Fernández", role: "Odontólogo", text: "La confirmación automática por WhatsApp bajó el ausentismo a casi cero. Es una herramienta indispensable para mi consultorio hoy." }
          ].map((t, i) => (
            <div key={i} className="bg-[#0b0e17] border border-white/5 rounded-2xl p-6">
              <div className="flex text-amber-400 mb-4"><Ico n="star" s={16} /><Ico n="star" s={16} /><Ico n="star" s={16} /><Ico n="star" s={16} /><Ico n="star" s={16} /></div>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold">{t.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER (L5) ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="font-bold text-white tracking-tight">MiniWebs</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Términos de uso</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Soporte</a>
          </div>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} MiniWebs. Todos los derechos reservados.</p>
        </div>
      </footer>
      
    </div>
  );
}