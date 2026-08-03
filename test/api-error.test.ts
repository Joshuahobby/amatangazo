import { describe, expect, it } from "vitest";

import { describeApiError } from "@/lib/api-error";

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
