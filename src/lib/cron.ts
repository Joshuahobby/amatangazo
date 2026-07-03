/**
 * Cron endpoint auth. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
 * when the CRON_SECRET env var is set (T0.6). Fail closed: if the secret is
 * unset or the header doesn't match, the request is rejected — these routes
 * run privileged jobs (scraping, mass notifications) and must never be
 * publicly triggerable. In dev, use the admin panel's manual triggers instead.
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
