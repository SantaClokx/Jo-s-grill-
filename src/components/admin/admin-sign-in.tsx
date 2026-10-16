"use client";

import dynamic from "next/dynamic";

/**
 * The Clerk `<SignIn />` widget, loaded client-side only.
 *
 * Clerk's widget renders with `renderToReadableStream`, which cannot run in
 * Next's server prerender for this page - doing so aborts with "Render in
 * Browser". Loading it through `next/dynamic` with `ssr: false` keeps it out of
 * the server render entirely, which is also all the widget needs: a sign-in form
 * is useless without a browser.
 */
const ClerkSignIn = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.SignIn),
  { ssr: false },
);

/**
 * Administrator sign-in.
 *
 * Clerk owns the sign-in UI and credential handling; this component only decides
 * whether it is safe to mount. `SignIn` requires `ClerkProvider`, which the root
 * layout mounts only when the publishable key exists, so without a key we render
 * an explanation instead of throwing.
 *
 * Sign-up is deliberately not offered. There is no self-service path to an
 * administrator account: an existing administrator grants access, so a public
 * sign-up form would only create accounts with no privileges.
 */
export function AdminSignIn() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  if (!publishableKey) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-bold">Sign-in is not configured</p>
        <p className="mt-1">
          This server is missing its Clerk keys. An administrator must set
          <code className="mx-1 rounded bg-amber-100 px-1">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>
          and
          <code className="mx-1 rounded bg-amber-100 px-1">CLERK_SECRET_KEY</code>
          before anyone can sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <ClerkSignIn />
    </div>
  );
}
