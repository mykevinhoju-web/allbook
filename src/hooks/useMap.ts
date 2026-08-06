"use client";

import { useCallback, useMemo, useState } from "react";

import type { Salon } from "@/types/salon";

/**
 * Shared map ↔ list selection for Search.
 * Focusing a salon (card or marker) bumps `focusToken` so the map can pan/zoom/bounce.
 */
export function useMap(salons: Salon[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);

  const selectedSalon = useMemo(
    () => salons.find((s) => s.id === selectedId) ?? null,
    [salons, selectedId],
  );

  const selectSalonFromCard = useCallback((id: string) => {
    setSelectedId(id);
    setFocusToken((n) => n + 1);
  }, []);

  const selectSalonFromMarker = useCallback((id: string) => {
    setSelectedId(id);
    setFocusToken((n) => n + 1);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  return {
    selectedId,
    selectedSalon,
    focusToken,
    selectSalonFromCard,
    selectSalonFromMarker,
    clearSelection,
    setSelectedId,
  };
}
