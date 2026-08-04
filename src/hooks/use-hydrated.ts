"use client";

import { useSyncExternalStore } from "react";

// Nothing external mutates this — the value flips once, when React swaps from
// the server snapshot to the client one at the end of hydration.
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `false` on the server and throughout the hydration render, `true` from the
 * first render after hydration.
 *
 * Use it to gate anything whose value the server cannot know — a session, a
 * localStorage read, a media query. Rendering that value directly produces
 * markup the server could never have generated, and React reports a hydration
 * mismatch and abandons the attribute: `authClient.useSession()` returning null
 * on the server but a live session on the client is exactly how the header CTA
 * and the mobile FAB ended up with a permanently wrong href.
 *
 * useSyncExternalStore rather than a mounted flag in useEffect: it is built for
 * this, reads during render instead of forcing a second pass, and is the
 * pattern primary-cta.tsx already uses for its localStorage read.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
