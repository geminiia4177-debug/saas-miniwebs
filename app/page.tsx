import Link from "next/link";
import { Ico } from "@/lib/constants";

export const metadata = {
  title: "SaaS MiniWebs | Crea tu página web con sistema de turnos",
  description: "La plataforma más fácil para crear una página web autogestionable para barberías, centros de estética y consultorios. Tus clientes sacan turno solos.",
};

export default function LandingPrincipal() {
  return (
    <div className="min-h-screen bg-[#12100D] text-[#F2E9DD] font-sans selection:bg-[#D9662B]/30">
      
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-[#1B1712]" style={{ background: 'rgba(18,16,13,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#D9662B] flex items-center justify-center">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span className="font-bold text-[#F2E9DD] tracking-tight font-display">MiniWebs</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-[#A89C8C]">
          <a href="#features" className="hover:text-[#F2E9DD] transition-colors">Funciones</a>
          <a href="#pricing" className="hover:text-[#F2E9DD] transition-colors">Precios</a>
          <a href="/login" className="text-[#D9662B] hover:text-[#C35923] font-medium transition-colors">Ingresar</a>
        </div>
        <Link href="/login" className="px-4 py-2 bg-[#D9662B] hover:bg-[#C35923] rounded-lg text-sm font-semibold text-white transition-colors">
          Empezar gratis
        </Link>
      </nav>

      {/* ── HERO SECTION ── */}
      <main className="relative flex flex-col lg:flex-row items-center justify-between pt-32 lg:pt-40 pb-20 px-6 max-w-7xl mx-auto gap-12 overflow-hidden">
        
        {/* Izquierda: Copy */}
        <div className="relative z-10 w-full lg:w-1/2 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D9662B]/30 bg-[#D9662B]/10 text-[#D9662B] text-sm font-medium tracking-wide">
            La herramienta definitiva para negocios locales
          </div>

          <h1 className="text-5xl md:text-7xl font-display leading-tight text-[#F2E9DD]">
            Tus clientes sacan turno solos. <br />
            <span className="text-[#A89C8C] italic">Tú te dedicas a trabajar.</span>
          </h1>

          <p className="text-lg text-[#A89C8C] max-w-xl leading-relaxed">
            Olvídate de responder decenas de mensajes por WhatsApp. Crea la página web de tu barbería, clínica o taller en 5 minutos y empieza a recibir reservas 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Link 
              href="/login" 
              className="px-8 py-4 bg-[#D9662B] hover:bg-[#C35923] rounded-xl font-semibold text-lg text-white transition-all transform hover:-translate-y-1"
            >
              Crear mi web ahora
            </Link>
            <Link 
              href="#demo" 
              className="px-8 py-4 bg-[#1B1712] hover:bg-[#2A241C] border border-[#2A241C] rounded-xl font-semibold text-lg text-[#F2E9DD] transition-all"
            >
              Ver cómo funciona
            </Link>
          </div>
        </div>

        {/* Derecha: Mockup Interactivo / Visual */}
        <div className="relative w-full lg:w-1/2 flex justify-center lg:justify-end animate-slide-up">
          <div className="relative w-full max-w-sm bg-[#1B1712] border border-[#2A241C] rounded-3xl p-6 shadow-2xl">
            {/* Header del Mockup */}
            <div className="flex items-center gap-4 border-b border-[#2A241C] pb-4 mb-4">
              <div className="w-12 h-12 bg-[#D9662B] rounded-full flex items-center justify-center text-xl font-display text-white">B</div>
              <div>
                <h3 className="font-display text-lg text-[#F2E9DD]">Barbería "El Tano"</h3>
                <p className="text-sm text-[#A89C8C]">Reservar un turno</p>
              </div>
            </div>
            
            {/* Servicios Mockup */}
            <div className="space-y-3 mb-6">
              {[
                { name: "Corte Clásico", time: "30 min", price: "$5.000" },
                { name: "Corte + Barba", time: "45 min", price: "$7.500" }
              ].map((s, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-[#2A241C] bg-[#12100D]">
                  <div>
                    <p className="font-medium text-[#F2E9DD]">{s.name}</p>
                    <p className="text-xs text-[#A89C8C]">{s.time}</p>
                  </div>
                  <button className="px-3 py-1 bg-[#D9662B]/10 text-[#D9662B] text-sm font-medium rounded-md">Elegir</button>
                </div>
              ))}
            </div>

            {/* Notificación Flotante */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl flex items-center gap-3 border border-gray-100 animate-scale-in" style={{ animationDelay: '500ms' }}>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Ico n="check" c="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">¡Nuevo Turno!</p>
                <p className="text-xs text-gray-500">Juan Pérez - Corte Clásico</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FEATURES ── */}
      <section id="features" className="relative bg-[#1B1712] border-y border-[#2A241C] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display text-[#F2E9DD] mb-6">Herramientas pensadas para tu rubro</h2>
            <p className="text-[#A89C8C] text-lg max-w-2xl mx-auto">No somos una plantilla genérica. Cada negocio tiene un diseño optimizado para lo que sus clientes buscan.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "calendar", title: "Agenda Inteligente", desc: "Sincroniza con tus empleados y bloquea horarios automáticamente." },
              { icon: "phone", title: "WhatsApp Bot Integrado", desc: "Confirmaciones y recordatorios sin que tengas que tocar el teléfono." },
              { icon: "bar-chart", title: "Panel de Control", desc: "Métricas claras de ingresos, turnos y rendimiento de tu equipo." },
              { icon: "image", title: "Galerías y Catálogos", desc: "Muestra fotos de tus cortes, tu menú o tus instalaciones." },
              { icon: "users", title: "Base de Clientes (CRM)", desc: "Guarda el historial de servicios de cada persona." },
              { icon: "zap", title: "Diseño Veloz", desc: "Carga instantánea. Diseñado para que reserven rápido desde el celular." }
            ].map((f, i) => (
              <div key={i} className="bg-[#12100D] border border-[#2A241C] p-8 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-[#D9662B]/10 flex items-center justify-center mb-6">
                  <Ico n={f.icon} s={24} c="text-[#D9662B]" />
                </div>
                <h3 className="text-xl font-display text-[#F2E9DD] mb-3">{f.title}</h3>
                <p className="text-[#A89C8C] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#2A241C] py-12 px-6 bg-[#12100D]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#D9662B] flex items-center justify-center">
              <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span className="font-bold font-display text-[#F2E9DD]">MiniWebs</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#A89C8C]">
            <a href="#" className="hover:text-[#F2E9DD] transition-colors">Términos</a>
            <a href="#" className="hover:text-[#F2E9DD] transition-colors">Privacidad</a>
          </div>
          <p className="text-sm text-[#A89C8C]">© {new Date().getFullYear()} MiniWebs. Diseñado para negocios locales.</p>
        </div>
      </footer>
      
    </div>
  );
}