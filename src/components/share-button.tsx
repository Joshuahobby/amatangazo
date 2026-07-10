"use client";

export function ShareButton() {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
      }}
      className="btn-outline btn-sm"
    >
      Copy link
    </button>
  );
}
