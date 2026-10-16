"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

/**
 * Administrator session control.
 *
 * Shows the signed-in administrator's account menu (which includes sign-out),
 * or a link to sign in. This is presentation only: it hides a button, it does
 * not grant access. Every privileged request is still decided on the server by
 * `requireAdmin()`.
 *
 * Clerk requires `ClerkProvider`, which the root layout mounts only when a
 * publishable key exists. Without a key there is no session to show, so this
 * renders nothing rather than throwing.
 */
export function AdminSessionControls() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) return null;

  return (
    <div className="flex items-center gap-3">
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <Link
          href="/sign-in"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white"
        >
          Sign in
        </Link>
      </SignedOut>
    </div>
  );
}
