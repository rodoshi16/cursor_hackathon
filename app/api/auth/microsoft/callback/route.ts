import { NextResponse } from "next/server";
import { microsoftProvider } from "@/lib/providers/microsoft";
import { saveConnectedAccount } from "@/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard?auth_error=missing_code", appUrl)
    );
  }

  try {
    const account = await microsoftProvider.exchangeCodeForTokens(code);
    saveConnectedAccount(account);
    return NextResponse.redirect(
      new URL("/dashboard?connected=microsoft", appUrl)
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Microsoft OAuth callback failed.";
    return NextResponse.redirect(
      new URL(
        `/dashboard?auth_error=${encodeURIComponent(message)}`,
        appUrl
      )
    );
  }
}
