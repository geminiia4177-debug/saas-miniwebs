"use client";

import React, { useState } from "react";
import { Sparkles, X, Wand2, Check, RefreshCw } from "lucide-react";

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  biz: any;
  setBiz: (fnOrObj: any) => void;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warn") => void;
}

export const CopilotModal: React.FC<CopilotModalProps> = ({
  isOpen,
  onClose,
  biz,
  setBiz,
  showToast,
}) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickActions = [
    {
      label: "💈 Barbería Clásica (El Patrón)",
      description: "Estilo madera oscura, navaja tradicional y Bebas Neue",
      patch: {
        themeVariant: "el_patron",
        primaryColor: "#c5a254",
        secondaryColor: "#111111",
        accentColor: "#c5a254",
        heroTitle: `${biz.name.toUpperCase()} — EL CORTE DEL PATRÓN`,
        heroSubtitle: "Tradición, navaja clásica, toalla caliente y el trato que te mereces.",
      },
    },
    {
      label: "✂️ Barbería Streetwear (Urban Fade)",
      description: "Cian neón, selector de fade, estilo trap urbano y reserva a sillón",
      patch: {
        themeVariant: "urban_fade",
        primaryColor: "#06B6D4",
        secondaryColor: "#8B5CF6",
        accentColor: "#06B6D4",
        heroTitle: `${biz.name.toUpperCase()} — URBAN FADE LAB`,
        heroSubtitle: "Degradados de alta precisión, perfilados con navaja y estilo urbano streetwear.",
      },
    },
    {
      label: "🌮 Taquería de Calle (El Trompo)",
      description: "Menú nocturno, trompo al pastor, precios en MXN y WhatsApp",
      patch: {
        themeVariant: "el_trompo",
        primaryColor: "#d32f2f",
        secondaryColor: "#ffc107",
        accentColor: "#ffc107",
        heroTitle: `${biz.name.toUpperCase()} — TACOS AL PASTOR`,
        heroSubtitle: "Pastor doradito, suadero suave, gringas y salsas recién hechas.",
      },
    },
    {
      label: "🍔 Gastrobar & Brasas (Cantina Gourmet)",
      description: "Smash burgers, selector de picante, mezcalería y comanda rápida",
      patch: {
        themeVariant: "cantina_gourmet",
        primaryColor: "#F59E0B",
        secondaryColor: "#EF4444",
        accentColor: "#F59E0B",
        heroTitle: `${biz.name.toUpperCase()} — SMASH & BRASAS`,
        heroSubtitle: "Carne angus smash, tuétano rostizado, mezcales y cervezas frías.",
      },
    },
    {
      label: "💅 Dark Velvet Glam (Glitz & Lash)",
      description: "Nail art 3D, pedrería Swarovski, selector de forma/largo y mega pestañas",
      patch: {
        themeVariant: "glitz_lash",
        primaryColor: "#EC4899",
        secondaryColor: "#F43F5E",
        accentColor: "#EC4899",
        heroTitle: `${biz.name.toUpperCase()} — LUXURY NAILS & LASH BAR`,
        heroSubtitle: "Diseño de miradas de alto impacto y arte en uñas de alta costura con autoclave.",
      },
    },
    {
      label: "🩺 Dental Spa & Sonrisa 3D (Holistic Spa)",
      description: "Diseño digital de sonrisa, carillas E-Max, antes/después y valoración WhatsApp",
      patch: {
        themeVariant: "holistic_spa",
        primaryColor: "#0D9488",
        secondaryColor: "#D97706",
        accentColor: "#0D9488",
        heroTitle: `${biz.name.toUpperCase()} — DENTAL SPA & ESTÉTICA`,
        heroSubtitle: "Odontología de autor sin dolor y armonización facial en ambiente wellness.",
      },
    },
    {
      label: "🐾 Hotel Canino VIP & Daycare (Pet Resort)",
      description: "Guardería campestre sin jaulas, alberca canina y fotos cada 2h",
      patch: {
        themeVariant: "pet_resort",
        primaryColor: "#10B981",
        secondaryColor: "#F59E0B",
        accentColor: "#10B981",
        heroTitle: `${biz.name.toUpperCase()} — RESORT CANINO CAMPESINO`,
        heroSubtitle: "Vacaciones soñadas para tu perrito, áreas verdes abiertas y alberca sin estrés.",
      },
    },
    {
      label: "🎟️ Activar Tarjeta de Sellos (Fidelización)",
      description: "Recompensa a clientes frecuentes en su 6ta visita",
      patch: {
        loyaltyEnabled: true,
        loyaltyGoal: 6,
        loyaltyReward: "¡Servicio o platillo gratis en tu 6ta visita!",
      },
    },
    {
      label: "🛡️ Activar Protección Anti No-Show",
      description: "Recordatorio con confirmación interactiva a 2 toques",
      patch: {
        antiNoShowEnabled: true,
        waitlistEnabled: true,
      },
    },
  ];

  const applyPatch = (patch: Record<string, any>, label: string) => {
    setBiz((prev: any) => ({
      ...prev,
      ...patch,
      layoutConfig: {
        ...(prev?.layoutConfig || {}),
        ...patch,
      },
    }));
    showToast(`¡Aplicado con éxito! ${label} ✓`, "success");
    onClose();
  };

  const handleCustomPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const lower = prompt.toLowerCase();
      const patch: Record<string, any> = {};

      if (lower.includes("trompo") || lower.includes("taco") || lower.includes("pastor")) {
        patch.themeVariant = "el_trompo";
        patch.primaryColor = "#d32f2f";
        patch.accentColor = "#ffc107";
      } else if (lower.includes("gastro") || lower.includes("burger") || lower.includes("smash") || lower.includes("mezcal")) {
        patch.themeVariant = "cantina_gourmet";
        patch.primaryColor = "#F59E0B";
        patch.accentColor = "#EF4444";
      } else if (lower.includes("fade") || lower.includes("street") || lower.includes("urban") || lower.includes("trap")) {
        patch.themeVariant = "urban_fade";
        patch.primaryColor = "#06B6D4";
        patch.accentColor = "#8B5CF6";
      } else if (lower.includes("patron") || lower.includes("patrón") || lower.includes("barber")) {
        patch.themeVariant = "el_patron";
        patch.primaryColor = "#c5a254";
      } else if (lower.includes("glam") || lower.includes("pestaña") || lower.includes("lash") || lower.includes("glitz")) {
        patch.themeVariant = "glitz_lash";
        patch.primaryColor = "#EC4899";
        patch.accentColor = "#F43F5E";
      } else if (lower.includes("unas") || lower.includes("uñas") || lower.includes("gelish")) {
        patch.themeVariant = "unas";
        patch.primaryColor = "#EC4899";
      } else if (lower.includes("spa dental") || lower.includes("carilla") || lower.includes("holistic") || lower.includes("armonizacion")) {
        patch.themeVariant = "holistic_spa";
        patch.primaryColor = "#0D9488";
        patch.accentColor = "#D97706";
      } else if (lower.includes("dental") || lower.includes("diente") || lower.includes("sonrisa")) {
        patch.themeVariant = "dental";
        patch.primaryColor = "#0284C7";
      } else if (lower.includes("resort") || lower.includes("hotel canino") || lower.includes("guarderia")) {
        patch.themeVariant = "pet_resort";
        patch.primaryColor = "#10B981";
        patch.accentColor = "#F59E0B";
      } else if (lower.includes("perro") || lower.includes("veterinaria") || lower.includes("mascota")) {
        patch.themeVariant = "veterinaria";
        patch.primaryColor = "#10B981";
      } else if (lower.includes("sello") || lower.includes("fidelidad") || lower.includes("lealtad")) {
        patch.loyaltyEnabled = true;
        patch.loyaltyGoal = 6;
      } else if (lower.includes("recordatorio") || lower.includes("turno") || lower.includes("no show")) {
        patch.antiNoShowEnabled = true;
      }

      if (lower.includes("horario") || lower.includes("cerramos")) {
        patch.heroSubtitle = prompt;
      }

      setBiz((prev: any) => ({
        ...prev,
        ...patch,
        layoutConfig: {
          ...(prev?.layoutConfig || {}),
          ...patch,
        },
      }));

      showToast("¡La IA aplicó tus cambios al instante! ✓", "success");
      onClose();
    } catch {
      showToast("No se pudo procesar la orden", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-[#0f172a] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 text-white max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Copiloto IA del Editor</h3>
              <p className="text-xs text-slate-400">Dile a la IA qué cambiar en tu página</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input libre */}
        <form onSubmit={handleCustomPrompt} className="mb-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Escribe o dicta lo que necesitas:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: Pon que hoy cerramos a las 9pm o cambia a plantilla El Trompo..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-bold text-sm text-white transition-all flex items-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              <span>Aplicar</span>
            </button>
          </div>
        </form>

        {/* Acciones Rápidas en 1 Toque */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Cambios Rápidos en 1 Toque:
          </p>
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPatch(qa.patch, qa.label)}
              className="w-full text-left p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {qa.label}
                </span>
                <Check className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-400 mt-1">{qa.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
