/**
 * API error bodies come back in two shapes: a plain string from our own
 * handlers, or a Zod `.flatten()` object from schema validation. Rendering the
 * latter straight into JSX throws ("Objects are not valid as a React child"),
 * so every surface that displays an API error goes through here.
 */
export function describeApiError(error: unknown, fallback: string): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const flat = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const message = flat.formErrors?.[0] ?? Object.values(flat.fieldErrors ?? {}).flat()[0];
    if (message) return message;
  }
  return fallback;
}
