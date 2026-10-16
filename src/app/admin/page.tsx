import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guard";

/**
 * Admin landing page.
 *
 * Every admin page guards itself on the server with `requireAdmin()` before
 * building any privileged markup. Doing the check here, in the page, rather than
 * only in the layout is deliberate:
 *
 *   1. It is deny-by-default at the closest point to the data, which is Clerk's
 *      own guidance and ADMIN-SECURITY.md's requirement.
 *   2. It keeps the privileged JSX from ever being constructed for an
 *      unauthorised request, so nothing leaks into the streamed flight payload.
 *   3. It keeps the layout's slot identical for allowed and denied requests,
 *      avoiding a React tree mismatch that otherwise forces client rendering.
 *
 * `instant = false` makes the route render on the server at request time, so no
 * prerendered shell exists for this page at all.
 *
 * This is intentionally a foundation page, not a dashboard. It proves the
 * authentication and authorisation path works before any privileged feature is
 * attached to it, and states plainly what is and is not implemented rather than
 * showing buttons that do nothing.
 */
export const instant = false;

export default async function AdminHomePage() {
  const result = await requireAdmin();

  if (!result.ok) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-20">
        <p className="text-sm font-bold uppercase tracking-wide text-ink/60">
          Error {result.status}
        </p>
        <h1 className="text-3xl font-extrabold text-ink">
          {result.reason === "misconfigured"
            ? "Admin authentication is not configured"
            : result.reason === "unauthenticated"
              ? "Sign in required"
              : "Administrator access required"}
        </h1>
        <p className="text-ink/80">{result.message}</p>
        <Link
          href="/"
          className="mt-2 w-fit rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white"
        >
          Back to the website
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-ink/60">
          JO&apos;S Grill admin
        </p>
        <h1 className="text-3xl font-extrabold text-ink">Administration</h1>
      </div>

      <p className="text-ink/80">
        You are signed in as an administrator. This page confirms that
        server-side authentication and administrator authorisation are working.
      </p>

      <dl className="grid gap-3 rounded-xl border border-ink/10 p-5 text-sm">
        <div className="flex flex-wrap gap-2">
          <dt className="font-bold text-ink">Administrator user ID</dt>
          <dd className="break-all text-ink/80">{result.userId}</dd>
        </div>
      </dl>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-bold">Not built yet</p>
        <p className="mt-1">
          The dashboard, order management, menu management and settings screens
          are not implemented. There is also no database connected, so no real
          orders are stored yet. Nothing on this page reads or writes customer
          data.
        </p>
      </div>
    </div>
  );
}
