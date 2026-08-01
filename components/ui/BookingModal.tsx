"use client";

import React, { useEffect, useState } from "react";
import BookingForm from "@/app/[subdomain]/BookingForm";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  services: string[];
  theme?: "light" | "dark";
  title?: string;
  preselectedService?: string;
  primaryColor?: string;
  secondaryColor?: string;
  variant?: string;
}

export default function BookingModal({
  isOpen,
  onClose,
  businessId,
  services,
  theme = "light",
  title = "Reservá tu turno",
  preselectedService,
  primaryColor,
  secondaryColor,
  variant,
}: BookingModalProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) setShouldRender(false);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      onTransitionEnd={handleAnimationEnd}
    >
      <div
        className={`w-full md:max-w-lg md:rounded-2xl max-h-[90vh] overflow-y-auto transform transition-transform duration-300 ${
          isOpen ? "translate-y-0 scale-100" : "translate-y-full md:translate-y-0 md:scale-95"
        } ${theme === "dark" ? "bg-[#1A1A1A] text-white" : "bg-white text-black"}`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10">
          <h2 className="font-['Playfair_Display',serif] text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="p-2 sm:p-4">
          <BookingForm
            businessId={businessId}
            services={services}
            theme={theme}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            preselectedService={preselectedService}
            variant={variant}
          />
        </div>
        <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-white/10">
          🔒 Tus datos son confidenciales y están protegidos.
        </div>
      </div>
    </div>
  );
}
