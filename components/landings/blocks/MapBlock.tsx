import React from "react";
import { BusinessContact } from "@/lib/templates/contract";
import { MapPin, Navigation, Phone, ExternalLink } from "lucide-react";

export interface MapBlockProps {
  contact: BusinessContact;
  primaryColor?: string;
  title?: string;
}

export const MapBlock: React.FC<MapBlockProps> = ({
  contact,
  primaryColor = "#6366F1",
  title = "Ubicación & Cómo Llegar",
}) => {
  const address = contact.address || contact.location;
  if (!address) return null;

  const mapsQuery = encodeURIComponent(address);
  const googleMapsUrl = contact.mapUrl || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-white/5">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Encontranos Fácilmente
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight">{title}</h2>
        </div>

        <div className="p-8 rounded-3xl bg-[#0E1526] border border-white/5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">Nuestra Dirección</h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-md">{address}</p>
              {contact.phone && (
                <p className="text-xs text-slate-400 mt-2 flex items-center justify-center sm:justify-start gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tel: {contact.phone}</span>
                </p>
              )}
            </div>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
            style={{ background: primaryColor }}
          >
            <Navigation className="w-4 h-4" />
            <span>Cómo llegar en Mapa</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>
    </section>
  );
};
