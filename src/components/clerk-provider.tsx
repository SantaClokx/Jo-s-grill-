"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

/**
 * Mounts `ClerkProvider` only when the publishable key is present.
 *
 * Without this guard, a missing key makes ClerkProvider throw during render and
 * takes down the entire public site - the menu, cart and checkout all need no
 * authentication and must keep working regardless. When the key is absent the
 * admin area stays shut anyway, because `requireAdmin()` refuses every request.
 *
 * The publishable key is public by design. The secret key is never passed here
 * and never reaches the browser.
 */
export function ClerkProviderIfConfigured({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  if (!publishableKey) {
    return <>{children}</>;
  }

  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
