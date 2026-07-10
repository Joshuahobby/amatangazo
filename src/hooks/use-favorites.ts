"use client";

import { useCallback, useEffect, useState } from "react";

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => {
        if (r.status === 401) return null;
        return r.json();
      })
      .then((data) => {
        if (data) {
          setFavoriteIds(new Set((data.favorites as { id: string }[]).map((f) => f.id)));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const isFavorited = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);

  const toggle = useCallback(
    async (listingId: string) => {
      const was = favoriteIds.has(listingId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (was) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      try {
        if (was) {
          await fetch("/api/favorites", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId }),
          });
        } else {
          await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId }),
          });
        }
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (was) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
      }
    },
    [favoriteIds],
  );

  return { isFavorited, toggle, loaded };
}
