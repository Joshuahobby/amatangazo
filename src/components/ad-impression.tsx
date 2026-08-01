"use client";

import { useEffect, useRef } from "react";

/**
 * Counts one viewable impression per page view.
 *
 * Fires only when the ad actually enters the viewport, so advertisers get a
 * viewability-based number rather than a render count. The observer attaches
 * to a single element and disconnects after firing — negligible cost on the
 * low-end Android devices that dominate this market.
 */
export function AdImpression({ adId }: { adId: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Observe the slot itself, not this marker. The marker is a zero-size
    // sr-only span, and .ad-slot is overflow-hidden — the marker's static
    // position falls outside the clipped box, so it would never intersect.
    const el = ref.current?.parentElement ?? ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const url = `/api/ads/${adId}/impression`;
        if (navigator.sendBeacon) navigator.sendBeacon(url);
        else void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [adId]);

  return <span ref={ref} aria-hidden className="sr-only" />;
}
