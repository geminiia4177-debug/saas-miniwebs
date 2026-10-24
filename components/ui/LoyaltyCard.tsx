"use client";

import React, { useState } from "react";
import { Gift, Share2, CheckCircle2, Sparkles } from "lucide-react";

interface LoyaltyCardProps {
  businessId: string;
  businessName: string;
  accentColor?: string;
  theme?: "dark" | "light";
  initialGoal?: number;
  initialReward?: string;
  className?: string;
}

export default function LoyaltyCard({
  businessId,
  businessName,
  accentColor = "#c5a254",
  theme = "dark",
  initialGoal = 6,
  initialReward = "¡Corte o servicio de regalo en tu próxima visita!",
  className = "",
}: LoyaltyCardProps) {
  const [phone, setPhone] = useState("");
  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isDark = theme === "dark";

  const fetchStamps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty?businessId=${businessId}&phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        setCardData(data);
      } else {
        // Fallback for new client: 0 stamps
        setCardData({
          clientPhone: phone,
          totalVisits: 0,
          currentStamps: 0,
          goal: initialGoal,
          reward: initialReward,
          isRewardUnlocked: false,
          referralShareUrl: typeof window !== "undefined" ? window.location.href : "",
        });
      }
    } catch {
      setCardData({
        clientPhone: phone,
        totalVisits: 0,
        currentStamps: 0,
        goal: initialGoal,
        reward: initialReward,
        isRewardUnlocked: false,
        referralShareUrl: typeof window !== "undefined" ? window.location.href : "",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentStamps = cardData ? cardData.currentStamps : 0;
  const goal = cardData ? cardData.goal : initialGoal;
  const reward = cardData ? cardData.reward : initialReward;
  const isUnlocked = cardData ? cardData.isRewardUnlocked : false;

  const handleShareWhatsApp = () => {
    const url = cardData?.referralShareUrl || (typeof window !== "undefined" ? window.location.href : "");
    const text = encodeURIComponent(
      `¡Hola! Te recomiendo *${businessName}*. Checa sus servicios y agenda tu cita aquí: ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 max-w-lg mx-auto relative overflow-hidden transition-all duration-300 ${
        isDark
          ? "bg-[#0f172a] text-white border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
          : "bg-white text-slate-900 border border-slate-200 shadow-xl"
      } ${className}`}
    >
      {/* Decorative gradient glow */}
      <div
        className="absolute -right-20 -top-20 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
        >
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase opacity-60">
            Programa de Fidelización
          </span>
          <h3 className="text-xl font-black tracking-tight">{businessName}</h3>
        </div>
      </div>

      {!cardData ? (
        <form onSubmit={fetchStamps} className="space-y-4">
          <p className="text-sm opacity-80 leading-relaxed">
            Ingresa tu WhatsApp para consultar tus sellos acumulados y premios de cliente frecuente:
          </p>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="Ej: 55 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 ${
                isDark
                  ? "bg-black/40 border border-white/10 text-white placeholder-slate-500"
                  : "bg-slate-50 border border-slate-300 text-slate-900"
              }`}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl font-bold text-sm text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              {loading ? "..." : "Consultar"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {isUnlocked ? (
            <div
              className="p-4 rounded-2xl flex items-center gap-3 border"
              style={{
                backgroundColor: `${accentColor}15`,
                borderColor: `${accentColor}40`,
              }}
            >
              <Sparkles className="w-8 h-8 flex-shrink-0 animate-bounce" style={{ color: accentColor }} />
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider" style={{ color: accentColor }}>
                  ¡Premio Desbloqueado!
                </p>
                <p className="text-sm font-bold text-white">{reward}</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-2 uppercase tracking-wider opacity-70">
                <span>Tus Sellos Acumulados</span>
                <span>
                  {currentStamps} de {goal}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2 sm:gap-3 py-2">
                {[...Array(goal)].map((_, idx) => {
                  const isFilled = idx < currentStamps;
                  return (
                    <div
                      key={idx}
                      className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                        isFilled
                          ? "scale-105 shadow-lg"
                          : "border-dashed opacity-30"
                      }`}
                      style={{
                        borderColor: isFilled ? accentColor : "currentColor",
                        backgroundColor: isFilled ? `${accentColor}30` : "transparent",
                        color: isFilled ? accentColor : "inherit",
                      }}
                    >
                      {isFilled ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <span className="text-xs font-bold opacity-60">{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-center opacity-70 mt-2">
                Te faltan <strong>{goal - currentStamps} visita(s)</strong> para tu premio:{" "}
                <span style={{ color: accentColor }}>{reward}</span>
              </p>
            </div>
          )}

          {/* Botón de Compartir y Recomendar */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#25D366] text-white shadow-lg hover:opacity-90 transition-opacity"
            >
              <Share2 className="w-4 h-4" />
              Recomendar a un Amigo
            </button>
            <button
              onClick={() => {
                setCardData(null);
                setPhone("");
              }}
              className="py-3 px-4 rounded-xl text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
            >
              Cambiar Teléfono
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
