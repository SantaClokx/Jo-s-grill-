import Link from "next/link";

import { AdminOrderDashboard } from "@/components/admin/admin-order-dashboard";
import { isClerkConfigured } from "@/lib/auth/config";
import { requireAdmin } from "@/lib/auth/guard";

export const instant = false;

export default async function AdminHomePage() {
  const result = await requireAdmin();

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-bold uppercase tracking-wide text-ink/60">Error {result.status}</p>
        <h1 className="text-3xl font-extrabold text-ink">
          {result.reason === "misconfigured" ? "Admin authentication is not configured" : result.reason === "unauthenticated" ? "Sign in required" : "Administrator access required"}
        </h1>
        <p className="text-ink/80">{result.message}</p>
        <div className="flex flex-wrap gap-3">
          {result.reason === "unauthenticated" && isClerkConfigured() ? <Link href="/sign-in" className="w-fit rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white">Sign in</Link> : null}
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
