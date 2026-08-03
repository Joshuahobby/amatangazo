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

/**
 * The message for a failed response, read without trusting the body to be JSON.
 *
 * A route that dies before its handler runs — a crash in middleware, a gateway
 * timeout, a 502 from the platform — answers with HTML or nothing at all, and
 * `res.json()` then rejects. Callers were reaching straight into
 * `(await res.json()).error`, so that second failure landed *while handling the
 * first*, replacing a message the visitor could act on with an unhandled
 * rejection. Parsing here keeps the failure path total.
 */
export async function readApiError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return describeApiError((body as { error?: unknown } | null)?.error, fallback);
}
