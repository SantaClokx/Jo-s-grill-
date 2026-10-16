import type { Metadata } from "next";

import { AdminSignIn } from "@/components/admin/admin-sign-in";

export const metadata: Metadata = {
  title: "Admin sign-in",
  // Keep the administrative sign-in out of search engines.
  robots: { index: false, follow: false },
};

/**
 * Render at request time.
 *
 * The shared header reads `usePathname()`, which cannot be resolved while
 * prerendering a static shell. Sign-in is inherently a per-request page, so
 * blocking on the server is correct rather than streaming a shell.
 */
export const instant = false;

/**
 * Administrator sign-in.
 *
 * This page performs no authorization: signing in is not the same as being an
 * administrator. The role check happens on the server, in `/admin` and the admin
 * APIs, after a session exists.
 *
 * The Clerk widget is mounted client-only by `AdminSignIn`, so the server render
 * never has to run Clerk's browser-rendered form.
 */
export default function SignInPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-ink/60">JO&apos;S Grill</p>
        <h1 className="text-3xl font-extrabold text-ink">Administrator sign-in</h1>
        <p className="mt-2 text-sm text-ink/70">
          Sign in with the account that has been granted administrator access.
        </p>
      </div>
      <AdminSignIn />
    </div>
  );
}
