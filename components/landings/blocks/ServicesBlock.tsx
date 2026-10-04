import React from "react";
import { NormalizedService } from "@/lib/templates/contract";
import { Clock, Plus, Sparkles } from "lucide-react";

export interface ServicesBlockProps {
  services: NormalizedService[];
  primaryColor?: string;
  title?: string;
  subtitle?: string;
  onSelectService?: (s: NormalizedService) => void;
}

export const ServicesBlock: React.FC<ServicesBlockProps> = ({
  services,
  primaryColor = "#6366F1",
  title = "Nuestros Servicios",
  subtitle = "Selecciona el servicio ideal para vos y reservá tu lugar en segundos.",
  onSelectService,
}) => {
  const activeServices = services.filter((s) => s.active !== false);

  if (activeServices.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-white/5">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Excelencia & Atención
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeServices.map((service) => (
            <div
              key={service.id}
              onClick={() => onSelectService?.(service)}
              className="group p-6 rounded-3xl bg-[#0E1526] hover:bg-[#121B30] border border-white/5 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {service.emoji ? (
                    <span className="text-2xl">{service.emoji}</span>
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                  {service.duration ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{service.duration} min</span>
                    </span>
                  ) : null}
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {service.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 mt-4 border-t border-white/5">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Precio</span>
                  <span className="text-base font-black text-white tabular-nums">
                    {service.price ? `$${service.price}` : "A consultar"}
                  </span>
                </div>
                <button
                  type="button"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md transition-all active:scale-90"
                  style={{ background: primaryColor }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
