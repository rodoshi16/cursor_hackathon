import { NextResponse } from "next/server";
import { microsoftProvider } from "@/lib/providers/microsoft";

export async function GET() {
  try {
    const url = microsoftProvider.getAuthUrl();
    return NextResponse.redirect(url);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to start Microsoft OAuth.";
    return NextResponse.redirect(
      new URL(
        `/dashboard?auth_error=${encodeURIComponent(message)}`,
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    );
  }
}
