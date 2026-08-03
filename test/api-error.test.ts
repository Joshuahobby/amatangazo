import { describe, expect, it } from "vitest";

import { describeApiError, readApiError } from "@/lib/api-error";

const FALLBACK = "Something went wrong.";

describe("describeApiError", () => {
  it("passes a plain string error through", () => {
    expect(describeApiError("Listing not found", FALLBACK)).toBe("Listing not found");
  });

  // The reason this helper exists: our routes answer schema failures with
  // `parsed.error.flatten()`, and putting that object into JSX throws
  // "Objects are not valid as a React child" — the page dies instead of
  // showing the validation message.
  it("unwraps a Zod .flatten() refine failure (formErrors)", () => {
    const flattened = { formErrors: ["Unsupported content type for this purpose"], fieldErrors: {} };
    expect(describeApiError(flattened, FALLBACK)).toBe("Unsupported content type for this purpose");
  });

  it("unwraps a Zod .flatten() field failure (fieldErrors)", () => {
    const flattened = {
      formErrors: [],
      fieldErrors: { phoneNumber: ["Enter a Rwandan phone number in the format 2507XXXXXXXX"] },
    };
    expect(describeApiError(flattened, FALLBACK)).toBe("Enter a Rwandan phone number in the format 2507XXXXXXXX");
  });

  it("prefers a form-level message over a field-level one", () => {
    const flattened = { formErrors: ["Form is invalid"], fieldErrors: { url: ["Bad URL"] } };
    expect(describeApiError(flattened, FALLBACK)).toBe("Form is invalid");
  });

  it("falls back when the body carries no usable message", () => {
    for (const empty of [undefined, null, {}, { formErrors: [], fieldErrors: {} }, 42]) {
      expect(describeApiError(empty, FALLBACK)).toBe(FALLBACK);
    }
  });

  it("always returns a string, so the result is safe to render", () => {
    const inputs: unknown[] = ["x", { formErrors: ["y"] }, { fieldErrors: { a: ["z"] } }, null, {}, []];
    for (const input of inputs) {
      expect(typeof describeApiError(input, FALLBACK)).toBe("string");
    }
  });
});

describe("readApiError", () => {
  const jsonResponse = (body: unknown) => new Response(JSON.stringify(body), { status: 400 });

  it("reads the error out of a JSON body", async () => {
    await expect(readApiError(jsonResponse({ error: "Boost already active" }), FALLBACK)).resolves.toBe(
      "Boost already active",
    );
  });

  it("unwraps a Zod .flatten() body the same way describeApiError does", async () => {
    const body = { error: { formErrors: [], fieldErrors: { phoneNumber: ["Enter a valid number"] } } };
    await expect(readApiError(jsonResponse(body), FALLBACK)).resolves.toBe("Enter a valid number");
  });

  // The reason this wrapper exists. A route that dies before its handler runs
  // answers with HTML or an empty body, and the old `(await res.json()).error`
  // then rejected *while handling the failure* — the caller's `setSubmitting`
  // never ran and the payment buttons stayed disabled until a page reload.
  it("falls back instead of throwing when the body is not JSON", async () => {
    const html = new Response("<html><body>502 Bad Gateway</body></html>", { status: 502 });
    await expect(readApiError(html, FALLBACK)).resolves.toBe(FALLBACK);
  });

  it("falls back instead of throwing on an empty body", async () => {
    await expect(readApiError(new Response(null, { status: 504 }), FALLBACK)).resolves.toBe(FALLBACK);
  });

  it("falls back when the JSON body carries no error field", async () => {
    await expect(readApiError(jsonResponse({ ok: false }), FALLBACK)).resolves.toBe(FALLBACK);
  });
});
