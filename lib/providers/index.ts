import type { EmailCalendarProvider, ProviderClient } from "@/types/provider";
import { googleProvider } from "./google";
import { microsoftProvider } from "./microsoft";

export function getProviderClient(
  provider: EmailCalendarProvider
): ProviderClient {
  if (provider === "google") return googleProvider;
  if (provider === "microsoft") return microsoftProvider;
  throw new Error(`Unknown provider: ${provider}`);
}

export function getAllProviderClients(): ProviderClient[] {
  return [googleProvider, microsoftProvider];
}
