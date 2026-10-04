import { useState, useRef, useCallback, useEffect } from "react";
import { Biz, Section } from "@/lib/constants";

export interface EditorSnapshot {
  biz: Biz;
  sections: Section[];
  timestamp: number;
}

export function useEditorHistory(
  biz: Biz | null,
  setBiz: (b: any) => void,
  sections: Section[],
  setSections: (s: any) => void,
  maxSteps = 50
) {
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isInternalUpdate = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Push new state with debounce to prevent freezing on typing
  const pushSnapshot = useCallback(
    (newBiz: Biz, newSections: Section[], immediate = false) => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      const commit = () => {
        try {
          const snapshot: EditorSnapshot = {
            biz: structuredClone(newBiz),
            sections: structuredClone(newSections),
            timestamp: Date.now(),
          };

          setHistory((prev) => {
            const trimmed = prev.slice(0, currentIndex + 1);
            if (trimmed.length >= maxSteps) {
              trimmed.shift();
            }
            return [...trimmed, snapshot];
          });
          setCurrentIndex((prev) => Math.min(prev + 1, maxSteps - 1));
        } catch {
          // Fallback if structuredClone fails on non-serializables
        }
      };

      if (immediate) {
        commit();
      } else {
        debounceTimer.current = setTimeout(commit, 800);
      }
    },
    [currentIndex, maxSteps]
  );

  // Trigger snapshot when biz or sections change
  useEffect(() => {
    if (biz && sections) {
      pushSnapshot(biz, sections);
    }
  }, [biz, sections, pushSnapshot]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const undo = useCallback(() => {
    if (!canUndo) return;
    const target = history[currentIndex - 1];
    if (!target) return;

    isInternalUpdate.current = true;
    setBiz(structuredClone(target.biz));
    setSections(structuredClone(target.sections));
    setCurrentIndex((prev) => prev - 1);
  }, [canUndo, history, currentIndex, setBiz, setSections]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const target = history[currentIndex + 1];
    if (!target) return;

    isInternalUpdate.current = true;
    setBiz(structuredClone(target.biz));
    setSections(structuredClone(target.sections));
    setCurrentIndex((prev) => prev + 1);
  }, [canRedo, history, currentIndex, setBiz, setSections]);

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    historyLength: history.length,
    currentIndex,
  };
}
