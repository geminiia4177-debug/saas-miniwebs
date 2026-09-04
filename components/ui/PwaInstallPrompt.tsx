"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, PlusSquare, X } from "lucide-react";

export default function PwaInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) {
      return;
    }

    // Check if already in standalone / installed mode
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem("pwa_prompt_dismissed");
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Android / Desktop beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait 3 seconds before showing prompt so it doesn't interrupt page load
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If iOS and not standalone, show after delay
    if (isIosDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <aside aria-label="Instalación de la aplicación" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[9998] animate-slideUp">
      <div className="bg-[#111827]/95 border border-indigo-500/30 backdrop-blur-xl p-4 rounded-2xl shadow-2xl text-white flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-sm leading-tight text-white">Instalar MiniWebs</h4>
              <p className="text-xs text-slate-300">Acceso rápido y funcionamiento sin conexión</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-300 space-y-1.5">
            <p className="font-semibold text-indigo-300">Para instalar en tu iPhone:</p>
            <div className="flex items-center gap-2">
              <span>1. Toca el botón compartir</span>
              <Share className="w-3.5 h-3.5 text-indigo-400 inline" />
            </div>
            <div className="flex items-center gap-2">
              <span>2. Selecciona</span>
              <span className="font-bold text-white flex items-center gap-1">
                <PlusSquare className="w-3.5 h-3.5 text-indigo-400 inline" /> Añadir a pantalla de inicio
              </span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors min-h-[38px]"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 min-h-[38px]"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar App
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
