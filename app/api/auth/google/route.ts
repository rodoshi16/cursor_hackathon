import { NextResponse } from "next/server";
import { googleProvider } from "@/lib/providers/google";

export async function GET() {
  try {
    const url = googleProvider.getAuthUrl();
    return NextResponse.redirect(url);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to start Google OAuth.";
    return NextResponse.redirect(
      new URL(
        `/dashboard?auth_error=${encodeURIComponent(message)}`,
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    );
  }
}
