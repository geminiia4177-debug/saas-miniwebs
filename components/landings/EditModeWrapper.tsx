"use client";

import { useEffect, useRef } from "react";

export default function EditModeWrapper() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const parent = wrapperRef.current?.parentElement;
      
      // Si el clic no fue dentro del contenedor padre de este wrapper, ignorarlo
      if (parent && !parent.contains(target)) return;

      e.preventDefault();
      e.stopPropagation();
      
      // Intentar encontrar la sección más cercana que tenga un ID conocido
      // Las plantillas suelen usar IDs como "servicios", "hero", "galeria", "contacto", etc.
      const section = target.closest('section');
      const sectionId = section?.id;
      
      let mappedSection = "header"; // Default
      
      if (sectionId) {
        if (sectionId.includes("hero") || sectionId.includes("inicio")) mappedSection = "hero";
        else if (sectionId.includes("servicio") || sectionId.includes("services")) mappedSection = "services";
        else if (sectionId.includes("producto")) mappedSection = "services"; // En el editor se maneja junto
        else if (sectionId.includes("galeria") || sectionId.includes("gallery")) mappedSection = "gallery";
        else if (sectionId.includes("testimonio") || sectionId.includes("review")) mappedSection = "testimonials";
        else if (sectionId.includes("contacto") || sectionId.includes("contact")) mappedSection = "contact";
        else if (sectionId.includes("booking") || sectionId.includes("reserva")) mappedSection = "contact";
      } else {
        // Fallbacks por clases o tags
        if (target.closest('header') || target.closest('nav')) mappedSection = "header";
        else if (target.closest('footer')) mappedSection = "footer";
      }
      
      window.parent.postMessage({ type: 'EDIT_SECTION', section: mappedSection }, '*');
    };

    // Usar la fase de captura (true) para interceptar clics antes que React/Next.js
    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="fixed inset-0 z-[99999] pointer-events-none" style={{
      boxShadow: "inset 0 0 0 4px rgba(99,102,241,0.5)",
      transition: "all 0.3s ease"
    }}>
      <div className="absolute top-2 right-2 bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        Modo Edición Visual
      </div>
    </div>
  );
}
