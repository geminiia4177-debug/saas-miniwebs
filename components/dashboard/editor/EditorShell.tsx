"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Biz, Section, MediaItem } from "@/lib/constants";
import { EditorNav, EditorTabId } from "./EditorNav";
import { LandingPreview } from "./LandingPreview";
import { DesignPanel } from "./panels/DesignPanel";
import { SectionsPanel } from "./panels/SectionsPanel";
import { ContentPanel } from "./panels/ContentPanel";
import { SettingsPanel } from "./panels/SettingsPanel";
import { PublishDiffSheet } from "./panels/PublishDiffSheet";
import { SaveStatusIndicator, SaveStatus } from "@/components/ui/SaveStatusIndicator";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { useEditorHistory } from "./useEditorHistory";
import { getPublicUrl } from "@/lib/urls";
import {
  Monitor,
  Tablet,
  Smartphone,
  Undo2,
  Redo2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  X,
} from "lucide-react";

export interface EditorShellProps {
  biz: Biz;
  setBiz: (fnOrObj: any) => void;
  sections: Section[];
  setSections: (fnOrObj: any) => void;
  media: MediaItem[];
  setMedia: (fnOrObj: any) => void;
  saveAll: (publish?: boolean) => Promise<void> | void;
  saving?: boolean;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warn") => void;
}

export const EditorShell: React.FC<EditorShellProps> = ({
  biz,
  setBiz,
  sections,
  setSections,
  media,
  setMedia,
  saveAll,
  saving = false,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTabId | null>("design");
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isPublishDiffOpen, setIsPublishDiffOpen] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Undo / Redo history engine
  const { canUndo, canRedo, undo, redo } = useEditorHistory(
    biz,
    setBiz,
    sections,
    setSections
  );

  // Save status determination
  const hasUnpublished =
    JSON.stringify(biz.layoutConfig) !== JSON.stringify((biz as any).publishedConfig);
  const saveStatus: SaveStatus = saving ? "saving" : "saved";

  // Handle click-to-edit selection from preview
  const handleSelectSectionFromPreview = useCallback(
    (sectionId: string) => {
      const found = sections.find((s) => s.id === sectionId);
      if (found) {
        setActiveSection(found);
        setActiveTab("content");
        setIsPanelCollapsed(false);
        showToast(`Editando sección: ${found.label || found.id}`);
      } else if (sectionId === "hero" || sectionId === "header") {
        setActiveTab("design");
        setIsPanelCollapsed(false);
      } else {
        setActiveTab("content");
        setIsPanelCollapsed(false);
      }
    },
    [sections, showToast]
  );

  // Global hotkeys (Ctrl+S, Ctrl+Enter, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveAll(false);
        showToast("Borrador guardado ✓", "success");
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        setIsPublishDiffOpen(true);
      } else if (e.key === "Escape") {
        if (isPublishDiffOpen) {
          setIsPublishDiffOpen(false);
        } else if (activeSection) {
          setActiveSection(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveAll, isPublishDiffOpen, activeSection, showToast]);

  const publicUrl = getPublicUrl(biz);

  const deviceOptions = [
    { value: "desktop" as const, label: "PC", icon: <Monitor className="w-3.5 h-3.5" /> },
    { value: "tablet" as const, label: "Tablet", icon: <Tablet className="w-3.5 h-3.5" /> },
    { value: "mobile" as const, label: "Móvil", icon: <Smartphone className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] -m-4 md:-m-6 bg-bg overflow-hidden select-none">
      {/* ── TOPBAR DEL EDITOR ── */}
      <header className="h-14 bg-surface-1 border-b border-border-default px-3 sm:px-4 flex items-center justify-between gap-3 z-30 flex-shrink-0">
        {/* Left: Store title & status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-fg truncate">{biz.name}</span>
            <span className="text-[10px] text-fg-subtle truncate font-mono">
              {biz.subdomain}.miniwebs
            </span>
          </div>
          <SaveStatusIndicator
            status={saveStatus}
            hasUnpublishedChanges={hasUnpublished}
            onClickPublish={() => setIsPublishDiffOpen(true)}
            className="hidden sm:inline-flex"
          />
        </div>

        {/* Center: Device Segmented Control & Undo/Redo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 rounded text-fg-muted hover:text-fg disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Deshacer (Ctrl + Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 rounded text-fg-muted hover:text-fg disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Rehacer (Ctrl + Shift + Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <SegmentedControl
            value={previewDevice}
            onChange={setPreviewDevice}
            options={deviceOptions}
            size="sm"
            className="hidden md:inline-flex"
          />
        </div>

        {/* Right: Preview link & Publish CTA */}
        <div className="flex items-center gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors border border-transparent hover:border-border-subtle"
            title="Abrir en pestaña nueva"
          >
            <span>Ver online</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPublishDiffOpen(true)}
            className="gap-1.5 font-bold"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Publicar</span>
          </Button>
        </div>
      </header>

      {/* ── WORKSPACE: NAV RAIL + PANEL + PREVIEW ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Navigation Rail (56px) */}
        <EditorNav
          activeTab={activeTab}
          onSelectTab={(t) => {
            setActiveTab(t);
            setIsPanelCollapsed(false);
          }}
          bizType={biz.type || "general"}
          sectionsCount={sections.length}
        />

        {/* Contextual Side Panel (340px) */}
        <div
          className={`fixed md:relative inset-y-14 md:inset-y-0 left-0 md:left-auto z-30 md:z-10 w-full sm:w-[360px] md:w-[350px] bg-surface-1 border-r border-border-default flex flex-col transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isPanelCollapsed
              ? "hidden md:flex md:w-0 md:border-r-0 md:overflow-hidden md:opacity-0 pointer-events-none"
              : "flex"
          }`}
        >
          {/* Panel Header */}
          <div className="h-11 px-4 border-b border-border-subtle flex items-center justify-between flex-shrink-0 bg-surface-1">
            <span className="text-xs font-bold text-fg uppercase tracking-wider">
              {activeTab === "design"
                ? "Diseño & Plantilla"
                : activeTab === "sections"
                ? "Estructura de Secciones"
                : activeTab === "content"
                ? "Contenido de Secciones"
                : "Ajustes del Sitio"}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPanelCollapsed(true)}
                className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
                title="Ocultar panel"
              >
                <X className="w-4 h-4 md:hidden" />
                <ChevronLeft className="w-4 h-4 hidden md:block" />
              </button>
            </div>
          </div>

          {/* Panel Content Body */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === "design" && (
              <DesignPanel biz={biz} setBiz={setBiz} showToast={showToast} />
            )}

            {activeTab === "sections" && (
              <SectionsPanel
                sections={sections}
                setSections={setSections}
                activeSectionId={activeSection?.id}
                onSelectSection={(sec) => {
                  setActiveSection(sec);
                  setActiveTab("content");
                }}
              />
            )}

            {activeTab === "content" && (
              <ContentPanel
                biz={biz}
                setBiz={setBiz}
                sections={sections}
                setSections={setSections}
                activeSection={activeSection}
                onBackToSections={() => {
                  setActiveSection(null);
                  setActiveTab("sections");
                }}
                showToast={showToast}
              />
            )}

            {activeTab === "settings" && (
              <SettingsPanel biz={biz} setBiz={setBiz} showToast={showToast} />
            )}
          </div>
        </div>

        {/* Collapsed toggle tab on desktop */}
        {isPanelCollapsed && (
          <button
            type="button"
            onClick={() => setIsPanelCollapsed(false)}
            className="hidden md:flex absolute top-4 left-16 z-20 items-center gap-1 px-2.5 py-1.5 rounded-r-lg bg-surface-2 border border-border-default border-l-0 text-xs font-medium text-fg shadow-card hover:bg-surface-3 transition-colors"
          >
            <span>Mostrar Panel</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* ── CENTRAL PREVIEW AREA ── */}
        <main className="flex-1 overflow-y-auto bg-[#07090e] p-2 sm:p-4 flex items-center justify-center relative custom-scrollbar">
          <LandingPreview
            biz={biz}
            sections={sections}
            media={media}
            previewDevice={previewDevice}
            onSelectSection={handleSelectSectionFromPreview}
          />
        </main>
      </div>

      {/* ── PUBLISH DIFF SHEET MODAL ── */}
      <PublishDiffSheet
        isOpen={isPublishDiffOpen}
        onClose={() => setIsPublishDiffOpen(false)}
        biz={biz}
        onConfirmPublish={async () => {
          await saveAll(true);
          setIsPublishDiffOpen(false);
          showToast("¡Sitio web publicado con éxito! 🚀", "success");
        }}
        isPublishing={saving}
        onNavigatePanel={(panel) => {
          setActiveTab(panel as EditorTabId);
          setIsPanelCollapsed(false);
        }}
      />
    </div>
  );
};
