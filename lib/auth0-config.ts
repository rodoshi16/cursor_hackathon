/**
 * Returns true when Auth0 is fully configured. When false, the app falls back
 * to "demo mode": no authentication is enforced and any user can open the
 * dashboard / reports / agent pages.
 */
export function isAuth0Configured(): boolean {
  return Boolean(
    process.env.AUTH0_SECRET &&
      process.env.AUTH0_BASE_URL &&
      process.env.AUTH0_ISSUER_BASE_URL &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET
  );
}
