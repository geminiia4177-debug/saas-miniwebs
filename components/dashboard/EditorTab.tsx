"use client";

import React from "react";
import { Biz, Section, MediaItem } from "@/lib/constants";
import { EditorShell } from "./editor/EditorShell";

export interface EditorTabProps {
  biz: Biz;
  setBiz: (fnOrObj: any) => void;
  sections: Section[];
  setSections: (fnOrObj: any) => void;
  media: MediaItem[];
  setMedia: (fnOrObj: any) => void;
  saveAll: (publish?: boolean) => Promise<void> | void;
  saving?: boolean;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warn") => void;
  setTab?: (tab: string) => void;
}

/**
 * ─────────────────────────────────────────────────────────────
 * EDITOR TAB (MODULAR SAAS 2026 ARCHITECTURE)
 * ─────────────────────────────────────────────────────────────
 * Decomposed from a 1300+ line monolith into:
 * - EditorShell: High performance responsive layout & topbar
 * - EditorNav: 56px navigation rail + mobile drawer
 * - DesignPanel: Multi-level template gallery, branding colors & typography
 * - SectionsPanel: Hello-Pangea DnD reordering & section toggles
 * - ContentPanel: Specialty cartridges (Tienda, Menú, Taller) & section editor
 * - SettingsPanel: Contact, WhatsApp, business hours & social profiles
 * - PublishDiffSheet: Human-readable change diff & quality score checklist
 * - useEditorHistory: 50-step patch history with Ctrl+Z / Ctrl+Shift+Z
 */
export default function EditorTab({
  biz,
  setBiz,
  sections,
  setSections,
  media,
  setMedia,
  saveAll,
  saving = false,
  showToast,
}: EditorTabProps) {
  return (
    <EditorShell
      biz={biz}
      setBiz={setBiz}
      sections={sections}
      setSections={setSections}
      media={media}
      setMedia={setMedia}
      saveAll={saveAll}
      saving={saving}
      showToast={showToast}
    />
  );
}