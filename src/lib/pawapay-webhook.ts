import { createHash, createPublicKey, createVerify, type KeyObject } from "crypto";
import { httpbis } from "http-message-signatures";

import { PAWAPAY_BASE_URL } from "@/lib/pawapay";

/**
 * RFC-9421 HTTP Message Signature verification for PawaPay callbacks.
 * Mirrors PawaPay's own reference implementation:
 * https://github.com/pawaPay/signatures-node-example
 *
 * Requires "Signed callbacks" to be turned on in the PawaPay dashboard —
 * that's an account setting, not something this code can enable.
 */

let cachedKeys: { id: string; key: string }[] | null = null;

async function fetchPublicKeys() {
  if (cachedKeys) return cachedKeys;
  const response = await fetch(`${PAWAPAY_BASE_URL}/public-key/http`);
  cachedKeys = await response.json();
  return cachedKeys!;
}

async function getPublicKey(keyId: string): Promise<KeyObject> {
  const keys = await fetchPublicKeys();
  const match = keys.find((entry) => entry.id === keyId);
  if (!match) throw new Error(`Unknown PawaPay signing key id: ${keyId}`);
  return createPublicKey(match.key);
}

function ppVerifier(publicKey: KeyObject) {
  return {
    async verify(data: Buffer, signature: Buffer) {
      return createVerify("SHA256").update(data).verify(publicKey, signature);
    },
  };
}

function sha512Digest(data: string) {
  return createHash("sha512").update(data).digest("base64");
}

export type IncomingWebhookRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
};

/**
 * Returns true only if a valid, present signature AND a matching content
 * digest were both confirmed. Anything else (missing headers, bad
 * signature, digest mismatch) is a hard reject — this gates money-moving
 * state transitions.
 */
export async function verifyPawaPayWebhook(request: IncomingWebhookRequest): Promise<boolean> {
  const contentDigestHeader = request.headers["content-digest"];
  if (!contentDigestHeader) return false;

  const digestMatch = contentDigestHeader.match(/sha-512=:(.+):/);
  if (!digestMatch) return false;
  if (digestMatch[1] !== sha512Digest(request.body)) return false;

  try {
    const verified = await httpbis.verifyMessage(
      {
        async keyLookup(params) {
          if (!params.keyid) return null;
          const publicKey = await getPublicKey(params.keyid);
          return ppVerifier(publicKey);
        },
        requiredFields: ["signature-date", "content-digest", "content-type"],
        // Two clocks have to agree here, and they never quite do.
        //
        // The library defaults to `tolerance: 0` and `notAfter: now`, which
        // reduces the check to `created > now` — so a callback signed on
        // PawaPay's clock is rejected outright if our clock is even one second
        // behind theirs. It surfaces as "Signature is too old", which reads
        // backwards: the signature is too *new* for us. A machine running 45s
        // slow rejected every callback this way.
        //
        // A minute each way covers ordinary NTP drift without meaningfully
        // widening the replay window, and maxAge puts an upper bound on age
        // that PawaPay's own `expires` parameter would otherwise have to carry
        // alone. It is deliberately generous: PawaPay retries a failed
        // callback with the *original* signature, so anything tighter would
        // reject the retries of a delivery that was only briefly disrupted.
        tolerance: 60,
        maxAge: 900,
      },
      {
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
    );
    return verified === true;
  } catch (error) {
    console.error("PawaPay webhook signature verification failed", error);
    return false;
  }
}
