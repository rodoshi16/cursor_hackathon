import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/reports", "/agent"];

function auth0Configured(): boolean {
  return Boolean(
    process.env.AUTH0_SECRET &&
      process.env.AUTH0_BASE_URL &&
      process.env.AUTH0_ISSUER_BASE_URL &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET
  );
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
  if (!isProtected) return NextResponse.next();

  // Demo mode — Auth0 not configured. Let everyone in.
  if (!auth0Configured()) return NextResponse.next();

  // The Auth0 SDK stores the session in the `appSession` cookie by default.
  const hasSession = !!req.cookies.get("appSession")?.value;
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/api/auth/login", req.url);
  loginUrl.searchParams.set("returnTo", path);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/reports/:path*", "/agent/:path*"],
};
