import React from "react";
import { NormalizedTestimonial } from "@/lib/templates/contract";
import { Star, Quote } from "lucide-react";

export interface TestimonialsBlockProps {
  testimonials: NormalizedTestimonial[];
  title?: string;
  subtitle?: string;
}

export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({
  testimonials,
  title = "Experiencias de Clientes",
  subtitle = "Opiniones reales de quienes confían en nuestro servicio día a día.",
}) => {
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-white/5">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Opiniones & Confianza
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-3xl bg-[#0E1526] border border-white/5 shadow-lg flex flex-col justify-between relative group hover:border-amber-500/30 transition-all"
            >
              <div className="space-y-4">
                {/* Rating Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < (t.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-700"}`}
                    />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{t.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-6 mt-4 border-t border-white/5">
                {t.image ? (
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-sm border border-indigo-500/20">
                    {t.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-white">{t.name}</h4>
                  {t.role && <p className="text-[11px] text-slate-400">{t.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
