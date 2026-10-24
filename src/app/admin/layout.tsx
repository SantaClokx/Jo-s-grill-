import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminSessionControls } from "@/components/admin/admin-session-controls";
import { isClerkConfigured } from "@/lib/auth/config";
import { requireAdmin } from "@/lib/auth/guard";

/**
 * Admin area layout.
 *
 * This is the server-side gate for every `/admin` page. Nothing under this
 * subtree renders until `requireAdmin()` succeeds, so an unauthenticated or
 * non-admin visitor never receives admin markup - the check is not a
 * client-side redirect that could be bypassed by disabling JavaScript.
 *
 * `cacheComponents` is enabled in this app. A session read cannot be part of a
 * prerendered static shell, and for an auth-gated route we do not want the
 * framework to attempt one: `instant = false` opts this segment into blocking
 * on the server, so the gate runs before any admin content is produced. This is
 * the documented escape hatch for routes that must resolve request data before
 * rendering. The alternative - wrapping the gate in `<Suspense>` - leaves the
 * page's own markup available to be serialised while the gate is still
 * resolving, which is exactly what we must avoid here.
 */
export const instant = false;

export const metadata: Metadata = {
  title: "Admin",
  // Keep the admin area out of search engines, as ADMIN-SECURITY.md requires.
  robots: { index: false, follow: false },
};

function Denied({
  title,
  detail,
  status,
  action,
}: {
  title: string;
  detail: string;
  status: number;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-20">
      <p className="text-sm font-bold uppercase tracking-wide text-ink/60">
        Error {status}
      </p>
      <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
      <p className="text-ink/80">{detail}</p>
      <div className="mt-2 flex flex-wrap gap-3">
        {action}
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

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const result = await requireAdmin();

  if (!result.ok) {
    if (result.reason === "misconfigured") {
      return (
        <Denied
          status={result.status}
          title="Admin authentication is not configured"
          detail="This server is missing its Clerk keys, so administrator access cannot be verified. Access is denied until an administrator completes the setup."
        />
      );
    }
    if (result.reason === "unauthenticated") {
      return (
        <Denied
          status={result.status}
          title="Sign in required"
          detail="You must be signed in with an administrator account to view this area."
          action={
            isClerkConfigured() ? (
              <Link
                href="/sign-in"
                className="w-fit rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white"
              >
                Sign in
              </Link>
            ) : null
          }
        />
      );
    }
    return (
      <Denied
        status={result.status}
        title="Administrator access required"
        detail="Your account is signed in but does not have administrator permissions."
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <Link href="/admin" className="text-sm font-bold uppercase tracking-wide text-ink/60">
          JO&apos;S Grill admin
        </Link>
        <AdminSessionControls />
      </div>
      {children}
    </div>
  );
}
