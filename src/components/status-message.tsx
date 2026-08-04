import type { ReactNode } from "react";

/**
 * Politeness and default styling for a status message.
 *
 *   error   — role="alert". Interrupts; for a failure the reader has to act on.
 *   success — role="status". Announced at the next pause.
 *   info    — role="status". Progress copy ("waiting for your handset…").
 */
export type StatusTone = "error" | "success" | "info";

const TONE_CLASS: Record<StatusTone, string> = {
  error: "form-error",
  success: "text-sm text-primary",
  info: "text-sm text-muted",
};

/**
 * The one way this app tells someone that something happened.
 *
 * Every payment result, upload failure, and sign-in error used to render as a
 * bare `{error && <p className="form-error">}`, which shows the text and tells
 * assistive tech nothing — a blind visitor got no signal at all that their
 * mobile-money payment had failed.
 *
 * Two details matter more than they look:
 *
 *  - The live region is mounted whether or not there is a message. Mounting a
 *    region and its content in the same commit is the classic reason a screen
 *    reader announces nothing: there was no region present to observe the
 *    mutation. Callers therefore pass a falsy child rather than skipping the
 *    element — `<StatusMessage>{error}</StatusMessage>`, not `{error && …}`.
 *
 *  - Empty, it collapses to `sr-only` instead of unmounting. `sr-only` is
 *    absolutely positioned, so an idle region never consumes a `gap` slot in
 *    the flex-column forms these sit in — and unlike `hidden` it stays in the
 *    accessibility tree, which is the entire point.
 *
 * `className` replaces the tone's default classes outright, so callers keep
 * whatever margin they already had (`"mt-1 form-error"`). It lands on the inner
 * <p>, never the region, so spacing is identical to the markup it replaced.
 */
export function StatusMessage({
  tone,
  className,
  id,
  children,
}: {
  tone: StatusTone;
  className?: string;
  /**
   * Pair with `aria-describedby` on the field this message is about, so the
   * error is read as part of the field rather than only as a standalone
   * announcement. Safe to leave pointing at an empty region: an empty
   * description resolves to nothing.
   */
  id?: string;
  children?: ReactNode;
}) {
  // `false`/`null`/`""` all mean "nothing to say" — callers pass state straight
  // through, and an empty string is a real value in several of them.
  const message = children === false || children == null || children === "" ? null : children;

  return (
    <div id={id} role={tone === "error" ? "alert" : "status"} className={message ? undefined : "sr-only"}>
      {message ? <p className={className ?? TONE_CLASS[tone]}>{message}</p> : null}
    </div>
  );
}
