/**
 * T0.6/Epic 7: Google Cloud OAuth client hasn't been set up yet, so these env
 * vars won't be set until it does. Unlike PawaPay/Twilio, there's no way to
 * "call" Google without real credentials at all — OAuth requires a redirect
 * to a real Google-owned page. See /api/dev/simulate-google-login for the
 * dev-mode stand-in, which bypasses the handshake entirely rather than
 * simulating it.
 */
export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
