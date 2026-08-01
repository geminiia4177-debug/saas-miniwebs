import { useCallback } from "react";
import { Biz, LayoutConfig } from "@/lib/types";

export function useBusinessEditor(biz: Biz | null, setBiz: (fn: (prev: Biz | null) => Biz | null) => void) {
  
  const updateRoot = useCallback((updates: Partial<Biz>) => {
    setBiz(prev => prev ? { ...prev, ...updates } : prev);
  }, [setBiz]);

  const updateLayoutConfig = useCallback((updates: Partial<LayoutConfig>) => {
    setBiz(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        layoutConfig: {
          ...(prev.layoutConfig || {}),
          ...updates
        }
      };
    });
  }, [setBiz]);

  return {
    updateRoot,
    updateLayoutConfig
  };
}
