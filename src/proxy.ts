import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const REFERRAL_COOKIE = "amatangazo_ref";
const REFERRAL_COOKIE_MAX_AGE_DAYS = 30;

// Next.js 16 renamed `middleware.ts` to `proxy.ts` — see docs/prd.md tech notes.
export function proxy(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref || request.cookies.has(REFERRAL_COOKIE)) return NextResponse.next();

  // First-touch attribution: don't overwrite an existing referral cookie.
  const response = NextResponse.next();
  response.cookies.set(REFERRAL_COOKIE, ref, {
    maxAge: REFERRAL_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
