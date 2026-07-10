"use client";

import { MotionConfig } from "framer-motion";

/*
 * Wraps the landing page so every framer-motion animation inside respects the
 * OS "reduce motion" setting. The CSS `prefers-reduced-motion` reset in
 * globals.css only reaches CSS animations/transitions — framer-motion runs its
 * transforms in JS, so it needs this context to opt out too.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
