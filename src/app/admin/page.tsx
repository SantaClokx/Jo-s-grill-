import Link from "next/link";

import { AdminOrderDashboard } from "@/components/admin/admin-order-dashboard";
import { requireAdmin } from "@/lib/auth/guard";

export const instant = false;

export default async function AdminHomePage() {
  const result = await requireAdmin();

  // The layout already renders the full denial screen for every failure reason,
  // so this branch is unreachable in practice. It is kept as a defensive
  // fallback in case the page is ever rendered outside that layout, and it
  // deliberately carries no sign-in call to action of its own - duplicating the
  // layout's would show two of them.
  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-bold uppercase tracking-wide text-ink/60">Error {result.status}</p>
        <h1 className="text-3xl font-extrabold text-ink">
          {result.reason === "misconfigured" ? "Admin authentication is not configured" : result.reason === "unauthenticated" ? "Sign in required" : "Administrator access required"}
        </h1>
        <p className="text-ink/80">{result.message}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="w-fit rounded-lg border border-ink/20 px-4 py-2 text-sm font-bold text-ink">Back to the website</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-line pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-muted">JO&apos;S Grill admin</p>
        <h1 className="text-4xl font-extrabold text-ink">Good day, operator.</h1>
        <p className="max-w-2xl text-sm text-ink/65">Manage the service queue securely. Order totals and status changes are always verified by the server.</p>
      </div>
      <AdminOrderDashboard />
    </div>
  );
}
