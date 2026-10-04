import React from "react";
import { Section, Ico } from "@/lib/constants";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { GripVertical, Eye, EyeOff, ChevronRight, Layers } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import HelpTooltip from "@/components/ui/HelpTooltip";

export interface SectionsPanelProps {
  sections: Section[];
  setSections: (fn: (prev: Section[]) => Section[]) => void;
  onSelectSection: (section: Section) => void;
  activeSectionId?: string | null;
}

export const SectionsPanel: React.FC<SectionsPanelProps> = ({
  sections,
  setSections,
  onSelectSection,
  activeSectionId,
}) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    setSections((prev: Section[]) => {
      const next = Array.from(prev);
      const [removed] = next.splice(result.source.index, 1);
      next.splice(result.destination!.index, 0, removed);
      return next;
    });
  };

  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSections((prev: Section[]) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const getItemCount = (sec: Section): number | null => {
    if (sec.config?.items && Array.isArray(sec.config.items)) {
      return sec.config.items.length;
    }
    if (sec.config?.fields && Array.isArray(sec.config.fields)) {
      return sec.config.fields.length;
    }
    return null;
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
            Estructura de la Página
          </h3>
        </div>
        <HelpTooltip
          title="Orden de Secciones"
          description="Arrastrá cada bloque para cambiar su orden en la web. El icono del ojo te permite ocultar secciones temporalmente sin borrar su contenido."
        />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections-list">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-2 rounded-xl transition-colors ${
                snapshot.isDraggingOver ? "bg-accent/5 p-1" : ""
              }`}
            >
              {sections.map((section, index) => {
                const isSelected = activeSectionId === section.id;
                const isVisible = section.visible !== false;
                const count = getItemCount(section);

                return (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        onClick={() => onSelectSection(section)}
                        className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                          dragSnapshot.isDragging
                            ? "bg-surface-3 border-accent shadow-popover scale-[1.02] z-50"
                            : isSelected
                            ? "bg-surface-2 border-accent text-fg shadow-card"
                            : "bg-surface-1 hover:bg-surface-2 border-border-default text-fg-muted hover:text-fg"
                        } ${!isVisible ? "opacity-50" : ""}`}
                      >
                        {/* Drag handle & Section title */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            {...dragProvided.dragHandleProps}
                            className="text-fg-subtle hover:text-fg p-0.5 cursor-grab active:cursor-grabbing"
                            title="Arrastrar para reordenar"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                            <Ico n={section.icon || "star"} s={14} c="text-fg" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-fg truncate">
                              {section.label || section.id}
                            </p>
                            <p className="text-[10px] text-fg-subtle truncate">
                              {isVisible ? "Visible en la web" : "Oculta temporalmente"}
                            </p>
                          </div>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex items-center gap-2">
                          {count !== null && (
                            <Badge variant="secondary" size="sm">
                              {count} {count === 1 ? "ítem" : "ítems"}
                            </Badge>
                          )}

                          <button
                            type="button"
                            onClick={(e) => toggleVisibility(section.id, e)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isVisible
                                ? "text-fg-muted hover:text-fg hover:bg-surface-3"
                                : "text-danger bg-danger/10 hover:bg-danger/20"
                            }`}
                            title={isVisible ? "Ocultar sección" : "Mostrar sección"}
                          >
                            {isVisible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>

                          <ChevronRight className="w-4 h-4 text-fg-subtle group-hover:text-fg transition-colors" />
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
