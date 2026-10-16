import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guard";
import { isClerkConfigured } from "@/lib/auth/config";

/**
 * Admin landing page.
 *
 * Every admin page guards itself on the server with `requireAdmin()` before
 * building any privileged markup. Doing the check here, in the page, rather than
 * only in the layout is deliberate: it keeps the privileged JSX from ever being
 * constructed for an unauthorised request, so nothing leaks into the streamed
 * flight payload.
 *
 * This is intentionally a foundation page, not a dashboard. It proves the
 * authentication and authorisation path works before any privileged feature is
 * attached to it, and states plainly what is and is not implemented rather than
 * showing buttons that do nothing.
 */
export const instant = false;

const CAPABILITIES: Array<{ area: string; status: "available" | "planned" }> = [
  { area: "Administrator sign-in and server-side authorisation", status: "available" },
  { area: "Order listing and status changes (admin API)", status: "available" },
  { area: "Menu editing", status: "planned" },
  { area: "Pricing and delivery-fee editing", status: "planned" },
  { area: "Restaurant settings", status: "planned" },
];

export default async function AdminHomePage() {
  const result = await requireAdmin();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
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
        <div className="flex flex-wrap gap-3">
          {result.reason === "unauthenticated" && isClerkConfigured() ? (
            <Link
              href="/sign-in"
              className="w-fit rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white"
            >
              Sign in
            </Link>
          ) : null}
          <Link
            href="/"
            className="w-fit rounded-lg border border-ink/20 px-4 py-2 text-sm font-bold text-ink"
          >
            Back to the website
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-ink/60">
          JO&apos;S Grill admin
        </p>
        <h1 className="text-3xl font-extrabold text-ink">Administration</h1>
      </div>

      <p className="text-ink/80">
        You are signed in as an administrator. This page confirms that server-side
        authentication and administrator authorisation are working.
      </p>

      <dl className="grid gap-3 rounded-xl border border-ink/10 p-5 text-sm">
        <div className="flex flex-wrap gap-2">
          <dt className="font-bold text-ink">Administrator user ID</dt>
          <dd className="break-all text-ink/80">{result.userId}</dd>
        </div>
      </dl>

      <section className="rounded-xl border border-ink/10 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink/60">Capabilities</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {CAPABILITIES.map((item) => (
            <li key={item.area} className="flex items-center justify-between gap-4">
              <span className="text-ink/80">{item.area}</span>
              <span
                className={
                  item.status === "available"
                    ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800"
                    : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600"
                }
              >
                {item.status === "available" ? "Available" : "Not built"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-bold">Dashboard UI not built yet</p>
        <p className="mt-1">
          There is no visual dashboard, order table, or settings screen. The secure
          admin API exists and is protected, but nothing on this page reads or writes
          customer data. No statistics are shown because there is no database
          connected on this server, so any number here would be invented.
        </p>
      </div>
    </div>
  );
}
