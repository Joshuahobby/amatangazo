"use client";

/**
 * Wraps a job's apply link so the click increments applicationCount (T10.1)
 * before following the link. Fire-and-forget — never blocks navigation.
 */
export function ApplyLink({ listingId, href, label }: { listingId: string; href: string; label: string }) {
  function track() {
    void fetch(`/api/listings/${listingId}/track`, { method: "POST", keepalive: true });
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={track} className="link">
      {label}
    </a>
  );
}
