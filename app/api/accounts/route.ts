import { getAllConnectedAccounts } from "@/lib/store";
import { isDemoMode, safeJsonResponse } from "@/lib/utils";

export async function GET() {
  const demo = isDemoMode();
  const real = getAllConnectedAccounts();

  if (demo && real.length === 0) {
    // In demo mode the user hasn't connected real accounts, but both providers
    // are functionally "ready" via mock data. Surface that as two demo accounts.
    return safeJsonResponse({
      ok: true,
      demoMode: true,
      accounts: [
        {
          provider: "google",
          email: "demo.user@gmail.com",
          name: "Demo Gmail",
        },
        {
          provider: "microsoft",
          email: "demo.user@outlook.com",
          name: "Demo Outlook",
        },
      ],
    });
  }

  return safeJsonResponse({
    ok: true,
    demoMode: demo,
    accounts: real.map((a) => ({
      provider: a.provider,
      email: a.email,
    })),
  });
}
