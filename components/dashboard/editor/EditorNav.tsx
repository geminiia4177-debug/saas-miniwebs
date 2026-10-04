import React from "react";
import {
  Palette,
  Layers,
  ShoppingBag,
  UtensilsCrossed,
  Wrench,
  Scissors,
  Calendar,
  Settings,
  FileText,
} from "lucide-react";

export type EditorTabId = "design" | "sections" | "content" | "settings";

export interface EditorNavProps {
  activeTab: EditorTabId | null;
  onSelectTab: (tab: EditorTabId) => void;
  bizType?: string;
  sectionsCount?: number;
  className?: string;
}

export const EditorNav: React.FC<EditorNavProps> = ({
  activeTab,
  onSelectTab,
  bizType = "general",
  sectionsCount = 0,
  className = "",
}) => {
  const getContentIcon = () => {
    switch (bizType) {
      case "tienda":
        return <ShoppingBag className="w-5 h-5" />;
      case "menu":
      case "restaurante":
        return <UtensilsCrossed className="w-5 h-5" />;
      case "taller":
      case "lavadero":
        return <Wrench className="w-5 h-5" />;
      case "barberia":
      case "estetica":
        return <Scissors className="w-5 h-5" />;
      case "cancha":
      case "gimnasio":
        return <Calendar className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const navItems = [
    {
      id: "design" as EditorTabId,
      label: "Diseño",
      hint: "Colores, plantillas y fuentes",
      icon: <Palette className="w-5 h-5" />,
    },
    {
      id: "sections" as EditorTabId,
      label: "Secciones",
      hint: "Organizar y activar bloques",
      icon: <Layers className="w-5 h-5" />,
      badge: sectionsCount > 0 ? sectionsCount : undefined,
    },
    {
      id: "content" as EditorTabId,
      label: bizType === "tienda" ? "Productos" : bizType === "menu" ? "Menú" : "Contenido",
      hint: "Servicios, catálogo y textos",
      icon: getContentIcon(),
    },
    {
      id: "settings" as EditorTabId,
      label: "Ajustes",
      hint: "Horarios, WhatsApp y SEO",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* ── DESKTOP VERTICAL RAIL (56px) ── */}
      <aside
        className={`hidden md:flex flex-col items-center justify-between w-14 py-4 bg-surface-1 border-r border-border-default z-20 flex-shrink-0 select-none ${className}`}
      >
        <div className="flex flex-col items-center gap-3 w-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                title={`${item.label} · ${item.hint}`}
                className={`relative group w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive
                    ? "bg-accent text-white shadow-glow"
                    : "text-fg-muted hover:text-fg hover:bg-surface-2"
                }`}
              >
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-surface-3 text-fg text-[10px] font-bold flex items-center justify-center border border-border-default">
                    {item.badge}
                  </span>
                )}
                {/* Floating tooltip */}
                <div className="absolute left-14 px-2.5 py-1 rounded-md bg-surface-3 border border-border-strong text-fg text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-popover z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAVIGATION (4 touch targets) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-1/95 backdrop-blur-md border-t border-border-default px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg min-h-[44px] transition-colors relative ${
                isActive ? "text-accent font-semibold" : "text-fg-muted hover:text-fg"
              }`}
            >
              {item.icon}
              <span className="text-[11px] mt-0.5">{item.label}</span>
              {item.badge !== undefined && (
                <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-accent text-white text-[9px] font-black flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
