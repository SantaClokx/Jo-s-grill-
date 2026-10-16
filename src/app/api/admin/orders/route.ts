import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { countOrders, listOrders, recordAudit, updateOrderStatus } from "@/lib/db/orders";
import type { OrderStatus } from "@/types";

/**
 * Admin order API.
 *
 * Every method starts with `requireAdmin()`, which verifies the Clerk session
 * and the administrator role **on the server**. Nothing here trusts the browser:
 * the caller's identity is never read from the query string or body.
 *
 * Reads and status changes are recorded in the audit log with the verified
 * actor id. Customer personal data is returned to administrators only.
 */

const VALID_STATUSES: readonly OrderStatus[] = [
  "received",
  "confirmed",
  "preparing",
  "delivered",
  "cancelled",
];

function guardFailure(result: { ok: false; status: number; message: string }) {
  return NextResponse.json({ error: result.message }, { status: result.status });
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guardFailure(guard);

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Order storage is not configured on this server." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit"));
  const offsetRaw = Number(url.searchParams.get("offset"));
  const statusParam = url.searchParams.get("status");

  const status =
    statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as OrderStatus)
      : undefined;

  try {
    const [ordersList, total] = await Promise.all([
      listOrders({
        limit: Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 50,
        offset: Number.isFinite(offsetRaw) && offsetRaw > 0 ? offsetRaw : 0,
        status,
      }),
      countOrders(status),
    ]);

    // Reading customer records is an auditable action.
    await recordAudit({
      actorUserId: guard.userId,
      action: "list",
      entity: "order",
      entityId: null,
      details: { status: status ?? "all", returned: ordersList.length },
    });

    return NextResponse.json({ orders: ordersList, total });
  } catch {
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guardFailure(guard);

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Order storage is not configured on this server." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const record = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const reference = typeof record.reference === "string" ? record.reference.trim() : "";
  const status = typeof record.status === "string" ? record.status.trim() : "";

  if (reference === "" || !(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: "Provide a valid order reference and status." },
      { status: 400 },
    );
  }

  try {
    const updated = await updateOrderStatus(reference, status as OrderStatus);
    if (!updated) {
      return NextResponse.json({ error: "No order with that reference." }, { status: 404 });
    }

    await recordAudit({
      actorUserId: guard.userId,
      action: "update_status",
      entity: "order",
      entityId: reference,
      details: { status },
    });

    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }
}
