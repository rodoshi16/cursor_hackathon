import { NextRequest, NextResponse } from "next/server";
import { isAuth0Configured } from "@/lib/auth0-config";

// Static export so all subroutes share the same handler.
export const dynamic = "force-dynamic";

async function notConfigured() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Auth0 is not configured. Set AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET in .env.local.",
    },
    { status: 503 }
  );
}

async function buildHandler() {
  // Dynamically import so the SDK doesn't crash at module load when env vars
  // are missing (it validates on import). This keeps demo mode working.
  const { handleAuth, handleLogin, handleLogout, handleCallback } =
    await import("@auth0/nextjs-auth0");
  return handleAuth({
    login: handleLogin({
      returnTo: "/connect",
    }),
    logout: handleLogout({
      returnTo: "/",
    }),
    callback: handleCallback({
      redirectUri: process.env.AUTH0_BASE_URL
        ? `${process.env.AUTH0_BASE_URL}/api/auth/callback`
        : undefined,
    }),
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: { auth0: string } }
) {
  if (!isAuth0Configured()) return notConfigured();
  const handler = await buildHandler();
  return handler(req as unknown as Request, ctx);
}

export async function POST(
  req: NextRequest,
  ctx: { params: { auth0: string } }
) {
  if (!isAuth0Configured()) return notConfigured();
  const handler = await buildHandler();
  return handler(req as unknown as Request, ctx);
}
