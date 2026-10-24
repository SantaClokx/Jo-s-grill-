"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

import { resolveClerkProxyUrl } from "@/lib/auth/proxy-matcher";

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

  // Pin the proxy path so Clerk's UI bundle loads from this origin. Without it
  // the widget resolves the bundle against the publishable key's Frontend API
  // domain (clerk.jos-grill.vercel.app), which is not reachable.
  //
  // Both values are read as explicit `process.env.NEXT_PUBLIC_*` literals:
  // Next.js only inlines references written that way, and a dynamic lookup would
  // be empty in the browser - which is the failure this guards against.
  const proxyUrl = resolveClerkProxyUrl({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_PROXY_URL: process.env.NEXT_PUBLIC_CLERK_PROXY_URL,
  });

  return (
    <ClerkProvider publishableKey={publishableKey} proxyUrl={proxyUrl}>
      {children}
    </ClerkProvider>
  );
}
