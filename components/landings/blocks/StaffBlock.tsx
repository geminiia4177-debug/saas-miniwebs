import React from "react";
import { NormalizedStaffMember } from "@/lib/templates/contract";
import { UserCheck } from "lucide-react";

export interface StaffBlockProps {
  staff: NormalizedStaffMember[];
  title?: string;
  subtitle?: string;
  onSelectMember?: (m: NormalizedStaffMember) => void;
}

export const StaffBlock: React.FC<StaffBlockProps> = ({
  staff,
  title = "Nuestro Equipo de Profesionales",
  subtitle = "Especialistas apasionados listos para brindarte la mejor experiencia.",
  onSelectMember,
}) => {
  if (!staff || staff.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-white/5">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Profesionales
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {staff.map((member) => (
            <div
              key={member.id}
              onClick={() => onSelectMember?.(member)}
              className="p-5 rounded-3xl bg-[#0E1526] border border-white/5 shadow-lg text-center space-y-4 hover:border-indigo-500/40 transition-all cursor-pointer group"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2 border-white/10 group-hover:border-indigo-500/60 transition-colors shadow-md">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-slate-500">
                    <UserCheck className="w-8 h-8 text-indigo-400" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {member.name}
                </h3>
                <p className="text-xs font-semibold text-indigo-400 mt-0.5">{member.role}</p>
                {member.description && (
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {member.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
