"use client";

import { SignedIn, SignedOut, SignOutButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

/**
 * Administrator session control.
 *
 * Shows the signed-in administrator's account menu plus an explicit sign-out
 * button, or a link to sign in. This is presentation only: it hides a button, it
 * does not grant access. Every privileged request is still decided on the server
 * by `requireAdmin()`.
 *
 * The sign-out control is a visible button rather than only the item buried in
 * the `UserButton` menu, so leaving the admin area is a single obvious action.
 *
 * Clerk requires `ClerkProvider`, which the root layout mounts only when a
 * publishable key exists. Without a key there is no session to show, so this
 * renders nothing rather than throwing.
 */
export function AdminSessionControls() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <SignedIn>
        <UserButton />
        {/*
          `SignOutButton` does not render its own element - it clones its single
          child and injects the click handler, so the child must be one element
          and must not be a `<button>` nested inside another.
        */}
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-bold text-ink hover:bg-cream"
          >
            Sign out
          </button>
        </SignOutButton>
      </SignedIn>
      <SignedOut>
        <Link
          href="/sign-in"
          className="inline-flex min-h-11 items-center rounded-lg bg-ink px-4 text-sm font-bold text-white"
        >
          Sign in
        </Link>
      </SignedOut>
    </div>
  );
}
